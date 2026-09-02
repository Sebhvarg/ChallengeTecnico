using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Inventario.API.Common.Exceptions;
using Inventario.API.Data;
using Inventario.API.DTOs.Auth;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Inventario.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var cleanInput = request.Usuario.Trim().ToLower();

        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
                .ThenInclude(r => r.Rutas)
            .Where(u => u.Estado && u.Rol.Estado)
            .FirstOrDefaultAsync(u => u.NombreUsuario.ToLower() == cleanInput || u.Email.ToLower() == cleanInput);

        if (usuario == null)
        {
            _logger.LogWarning("Intento de login fallido para usuario/email: {Input}", request.Usuario);
            throw new UnauthorizedException("Credenciales inválidas. Por favor verifique su usuario y contraseña.");
        }

        bool passwordValida = false;
        try
        {
            passwordValida = BCrypt.Net.BCrypt.Verify(request.Contrasena, usuario.ContrasenaHash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al verificar hash BCrypt para usuario {Usuario}", usuario.NombreUsuario);
            throw new UnauthorizedException("Credenciales inválidas.");
        }

        if (!passwordValida)
        {
            _logger.LogWarning("Contraseña incorrecta para usuario: {Usuario}", usuario.NombreUsuario);
            throw new UnauthorizedException("Credenciales inválidas. Por favor verifique su usuario y contraseña.");
        }

        var expirationMinutes = _configuration.GetValue<int>("Jwt:ExpiresInMinutes", 120);
        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = GenerarJwtToken(usuario, expiration);

        var rutas = usuario.Rol.Rutas
            .Where(r => r.Estado)
            .OrderBy(r => r.Id)
            .Select(r => new RutaDto
            {
                Id = r.Id,
                Nombre = r.Nombre,
                Ruta = r.RutaUrl
            })
            .ToList();

        _logger.LogInformation("Usuario {Usuario} ({Rol}) inició sesión exitosamente.", usuario.NombreUsuario, usuario.Rol.RolNombre);

        return new LoginResponseDto
        {
            Token = token,
            Expiracion = expiration,
            Usuario = new UserInfoDto
            {
                Id = usuario.Id,
                Nombres = usuario.Nombres,
                Apellidos = usuario.Apellidos,
                Usuario = usuario.NombreUsuario,
                Email = usuario.Email,
                IdRol = usuario.IdRol,
                RolNombre = usuario.Rol.RolNombre
            },
            Rutas = rutas
        };
    }

    public async Task<UserInfoDto> GetUserProfileAsync(int userId)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Estado);

        if (usuario == null)
        {
            throw new NotFoundException("Usuario no encontrado.");
        }

        return new UserInfoDto
        {
            Id = usuario.Id,
            Nombres = usuario.Nombres,
            Apellidos = usuario.Apellidos,
            Usuario = usuario.NombreUsuario,
            Email = usuario.Email,
            IdRol = usuario.IdRol,
            RolNombre = usuario.Rol.RolNombre
        };
    }

    private string GenerarJwtToken(Entities.Usuario usuario, DateTime expiration)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "Cachy0S$PruebaB6GyS3ba4stianH0lg++n200216202204!";
        var issuer = _configuration["Jwt:Issuer"] ?? "InventoryApi";
        var audience = _configuration["Jwt:Audience"] ?? "InventoryAngularClient";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.NombreUsuario),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.GivenName, $"{usuario.Nombres} {usuario.Apellidos}"),
            new Claim(ClaimTypes.Role, usuario.Rol.RolNombre),
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
}
