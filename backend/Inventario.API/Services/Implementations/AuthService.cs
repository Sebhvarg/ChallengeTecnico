using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Security;
using Inventario.API.Data;
using Inventario.API.DTOs.Auth;
using Inventario.API.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace Inventario.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditoriaService _auditoriaService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        IAuditoriaService auditoriaService,
        IMemoryCache cache,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _auditoriaService = auditoriaService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<EncryptedResponseDto> LoginAsync(LoginRequestDto request)
    {
        var cleanInput = request.Usuario.Trim();
        var cacheKey = $"login_attempt_{cleanInput.ToLowerInvariant()}";

        // 0. Verificar si el usuario se encuentra bloqueado por 3 intentos fallidos
        if (_cache.TryGetValue(cacheKey, out LoginAttemptInfo? attemptInfo) && attemptInfo != null)
        {
            if (attemptInfo.LockoutEndUtc.HasValue && DateTime.UtcNow < attemptInfo.LockoutEndUtc.Value)
            {
                var remainingSec = Math.Max(1, (int)(attemptInfo.LockoutEndUtc.Value - DateTime.UtcNow).TotalSeconds);
                var min = remainingSec / 60;
                var sec = remainingSec % 60;
                _logger.LogWarning("Petición de login rechazada por bloqueo temporal: {Usuario}. Restan {Segundos}s.", cleanInput, remainingSec);
                throw new BadRequestException($"Acceso bloqueado por límite de 3 intentos fallidos. Intente nuevamente en {min:D2}:{sec:D2} minutos.");
            }
        }

        // 1. Ejecución del Stored Procedure spLogin a nivel de base de datos
        var connection = _context.Database.GetDbConnection();
        var wasClosed = connection.State == ConnectionState.Closed;

        int userId = 0;
        string nombres = string.Empty;
        string apellidos = string.Empty;
        string usuario = string.Empty;
        string email = string.Empty;
        string contrasenaHash = string.Empty;
        int idRol = 0;
        string nombreRol = string.Empty;
        string rutasJson = string.Empty;
        bool userFound = false;

        try
        {
            if (wasClosed)
            {
                await connection.OpenAsync();
            }

            using var command = connection.CreateCommand();
            command.CommandText = "spLogin";
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.Add(new SqlParameter("@usuario", SqlDbType.VarChar, 50) { Value = cleanInput });

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                userFound = true;
                userId = reader.GetInt32(reader.GetOrdinal("id"));
                nombres = reader.GetString(reader.GetOrdinal("nombres"));
                apellidos = reader.GetString(reader.GetOrdinal("apellidos"));
                usuario = reader.GetString(reader.GetOrdinal("usuario"));
                email = reader.GetString(reader.GetOrdinal("email"));
                contrasenaHash = reader.GetString(reader.GetOrdinal("contrasenaHash"));
                idRol = reader.GetInt32(reader.GetOrdinal("idRol"));
                nombreRol = reader.GetString(reader.GetOrdinal("nombreRol"));

                var rutasOrdinal = reader.GetOrdinal("RutasJson");
                if (!reader.IsDBNull(rutasOrdinal))
                {
                    rutasJson = reader.GetString(rutasOrdinal);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al ejecutar spLogin para el usuario: {Input}", cleanInput);
            throw new BadRequestException("Error al consultar el servicio de autenticación en la base de datos.");
        }
        finally
        {
            if (wasClosed && connection.State == ConnectionState.Open)
            {
                await connection.CloseAsync();
            }
        }

        if (!userFound)
        {
            await RegistrarFalloIntentoAsync(cacheKey, cleanInput);
        }

        // 2. Validación de Contraseña BCrypt
        bool passwordValida = false;
        try
        {
            passwordValida = BCrypt.Net.BCrypt.Verify(request.Contrasena, contrasenaHash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar hash BCrypt para usuario {Usuario}", usuario);
            await RegistrarFalloIntentoAsync(cacheKey, cleanInput);
        }

        if (!passwordValida)
        {
            await RegistrarFalloIntentoAsync(cacheKey, cleanInput);
        }

        // Éxito: Limpiar intentos fallidos
        _cache.Remove(cacheKey);

        // 3. Deserialización de las Rutas obtenidas directamente desde el Stored Procedure
        var rutas = new List<RutaDto>();
        if (!string.IsNullOrWhiteSpace(rutasJson))
        {
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                rutas = JsonSerializer.Deserialize<List<RutaDto>>(rutasJson, options) ?? new List<RutaDto>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudieron deserializar las rutas JSON del rol: {RutasJson}", rutasJson);
            }
        }

        // 4. Generación del Token JWT
        var expirationMinutes = _configuration.GetValue<int>("Jwt:ExpiresInMinutes", 120);
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var userInfo = new UserInfoDto
        {
            Id = userId,
            Nombres = nombres,
            Apellidos = apellidos,
            Usuario = usuario,
            Email = email,
            IdRol = idRol,
            RolNombre = nombreRol
        };

        var token = GenerarJwtToken(userInfo, expiration);

        _logger.LogInformation("Usuario {Usuario} ({Rol}) autenticado con éxito mediante spLogin.", usuario, nombreRol);
        await _auditoriaService.RegistrarAsync("LOGIN", "Autenticación", $"Inicio de sesión exitoso del usuario {usuario} ({nombres} {apellidos}) con rol {nombreRol}.", userId, usuario, nombreRol);

        var rawResponse = new LoginResponseDto
        {
            Token = token,
            Expiracion = expiration,
            Usuario = userInfo,
            Rutas = rutas
        };

        // 5. Cifrado de la respuesta completa (Rutas, Usuario y Token) para la consola de red
        var jwtKey = _configuration["Jwt:Key"] ?? "Cachy0SPruebaB6GyS3ba4stianH0lg++in200216202204!";
        var (payload, iv) = AesEncryptionHelper.EncryptObject(rawResponse, jwtKey);

        return new EncryptedResponseDto
        {
            Payload = payload,
            Iv = iv
        };
    }

    public async Task<EncryptedResponseDto> GetUserProfileAsync(int userId)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Estado);

        if (usuario == null)
        {
            throw new NotFoundException("Usuario no encontrado.");
        }

        var userInfo = new UserInfoDto
        {
            Id = usuario.Id,
            Nombres = usuario.Nombres,
            Apellidos = usuario.Apellidos,
            Usuario = usuario.NombreUsuario,
            Email = usuario.Email,
            IdRol = usuario.IdRol,
            RolNombre = usuario.Rol.RolNombre
        };

        var jwtKey = _configuration["Jwt:Key"] ?? "Cachy0SPruebaB6GyS3ba4stianH0lg++in200216202204!";
        var (payload, iv) = AesEncryptionHelper.EncryptObject(userInfo, jwtKey);

        return new EncryptedResponseDto
        {
            Payload = payload,
            Iv = iv
        };
    }

    private string GenerarJwtToken(UserInfoDto usuario, DateTime expiration)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "Cachy0SPruebaB6GyS3ba4stianH0lg++in200216202204!";
        var issuer = _configuration["Jwt:Issuer"] ?? "InventoryApi";
        var audience = _configuration["Jwt:Audience"] ?? "InventoryAngularClient";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Usuario),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.GivenName, $"{usuario.Nombres} {usuario.Apellidos}"),
            new Claim(ClaimTypes.Role, usuario.RolNombre),
            new Claim("RolId", usuario.IdRol.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    private async Task RegistrarFalloIntentoAsync(string cacheKey, string usuario)
    {
        if (!_cache.TryGetValue(cacheKey, out LoginAttemptInfo? attemptInfo) || attemptInfo == null)
        {
            attemptInfo = new LoginAttemptInfo { FailedAttempts = 0, LockoutEndUtc = null };
        }

        attemptInfo.FailedAttempts++;

        if (attemptInfo.FailedAttempts >= 3)
        {
            attemptInfo.LockoutEndUtc = DateTime.UtcNow.AddMinutes(2);
            _cache.Set(cacheKey, attemptInfo, TimeSpan.FromMinutes(3));

            _logger.LogWarning("Acceso bloqueado: Usuario {Usuario} alcanzó 3 intentos fallidos.", usuario);
            await _auditoriaService.RegistrarAsync(
                "BLOQUEO_ACCESO", 
                "Autenticación", 
                $"Acceso bloqueado por 2 minutos para '{usuario}' tras alcanzar 3 intentos fallidos de autenticación.", 
                null, 
                usuario, 
                "Sin Rol"
            );

            throw new BadRequestException("Ha alcanzado el límite de 3 intentos fallidos. Su acceso ha sido bloqueado temporalmente por 2 minutos.");
        }
        else
        {
            _cache.Set(cacheKey, attemptInfo, TimeSpan.FromMinutes(10));
            var intentosRestantes = 3 - attemptInfo.FailedAttempts;

            _logger.LogWarning("Intento de login fallido ({Intentos}/3) para usuario: {Usuario}", attemptInfo.FailedAttempts, usuario);
            await _auditoriaService.RegistrarAsync(
                "LOGIN_FALLIDO", 
                "Autenticación", 
                $"Intento de autenticación fallido ({attemptInfo.FailedAttempts}/3) para el usuario '{usuario}'.", 
                null, 
                usuario, 
                "Sin Rol"
            );

            throw new UnauthorizedException($"Credenciales inválidas. Intento {attemptInfo.FailedAttempts} de 3. Le {(intentosRestantes == 1 ? "queda 1 intento" : $"quedan {intentosRestantes} intentos")}.");
        }
    }

    private class LoginAttemptInfo
    {
        public int FailedAttempts { get; set; }
        public DateTime? LockoutEndUtc { get; set; }
    }
}
