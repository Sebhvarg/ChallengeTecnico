using System.Data;
using Inventario.API.Common.Exceptions;
using Inventario.API.Common.Responses;
using Inventario.API.Data;
using Inventario.API.DTOs.Usuario;
using Inventario.API.Entities;
using Inventario.API.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class UsuarioService : IUsuarioService
{
    private readonly AppDbContext _context;
    private readonly IAuditoriaService _auditoriaService;
    private readonly ILogger<UsuarioService> _logger;

    public UsuarioService(
        AppDbContext context,
        IAuditoriaService auditoriaService,
        ILogger<UsuarioService> logger)
    {
        _context = context;
        _auditoriaService = auditoriaService;
        _logger = logger;
    }

    public async Task<PagedResult<UsuarioDto>> BuscarUsuariosAsync(string? filtro, int pagina, int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var query = _context.Usuarios
            .Include(u => u.Rol)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var clean = filtro.Trim().ToLower();
            query = query.Where(u =>
                u.NombreUsuario.ToLower().Contains(clean) ||
                u.Nombres.ToLower().Contains(clean) ||
                u.Apellidos.ToLower().Contains(clean) ||
                u.Email.ToLower().Contains(clean) ||
                u.Rol.RolNombre.ToLower().Contains(clean));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.Id)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(u => new UsuarioDto
            {
                Id = u.Id,
                Nombres = u.Nombres,
                Apellidos = u.Apellidos,
                Usuario = u.NombreUsuario,
                Email = u.Email,
                IdRol = u.IdRol,
                Rol = u.Rol.RolNombre,
                Estado = u.Estado,
                FechaCreacion = u.FechaCreacion
            })
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<UsuarioDto>(items, total, pagina, tamanoPagina);
    }

    public async Task<List<RolDto>> ObtenerRolesActivosAsync()
    {
        return await _context.Roles
            .Where(r => r.Estado)
            .OrderBy(r => r.Id)
            .Select(r => new RolDto
            {
                Id = r.Id,
                Rol = r.RolNombre
            })
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<UsuarioDto> ObtenerPorIdAsync(int id)
    {
        var u = await _context.Usuarios
            .Include(x => x.Rol)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (u == null)
        {
            throw new NotFoundException($"El usuario con ID {id} no fue encontrado.");
        }

        return new UsuarioDto
        {
            Id = u.Id,
            Nombres = u.Nombres,
            Apellidos = u.Apellidos,
            Usuario = u.NombreUsuario,
            Email = u.Email,
            IdRol = u.IdRol,
            Rol = u.Rol.RolNombre,
            Estado = u.Estado,
            FechaCreacion = u.FechaCreacion
        };
    }

    public async Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto dto)
    {
        var cleanUsuario = dto.Usuario.Trim().ToLower();
        var cleanEmail = dto.Email.Trim().ToLower();

        if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario.ToLower() == cleanUsuario))
        {
            throw new BadRequestException($"El nombre de usuario '{dto.Usuario}' ya se encuentra en uso.");
        }

        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == cleanEmail))
        {
            throw new BadRequestException($"El correo '{dto.Email}' ya se encuentra registrado.");
        }

        var rolExiste = await _context.Roles.AnyAsync(r => r.Id == dto.IdRol && r.Estado);
        if (!rolExiste)
        {
            throw new BadRequestException("El rol especificado no existe o está inactivo.");
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var nuevo = new Usuario
        {
            Nombres = dto.Nombres.Trim(),
            Apellidos = dto.Apellidos.Trim(),
            NombreUsuario = dto.Usuario.Trim(),
            Email = cleanEmail,
            ContrasenaHash = hash,
            IdRol = dto.IdRol,
            Estado = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Usuarios.Add(nuevo);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Usuario {Usuario} creado con ID {Id}.", nuevo.NombreUsuario, nuevo.Id);
        await _auditoriaService.RegistrarAsync("CREAR_USUARIO", "Usuarios", $"Se registró un nuevo usuario: @{nuevo.NombreUsuario} ({nuevo.Nombres} {nuevo.Apellidos}) con rol ID {nuevo.IdRol}.");

        return await ObtenerPorIdAsync(nuevo.Id);
    }

    public async Task<UsuarioDto> ActualizarUsuarioAsync(int id, ActualizarUsuarioDto dto)
    {
        var u = await _context.Usuarios.FirstOrDefaultAsync(x => x.Id == id);
        if (u == null)
        {
            throw new NotFoundException($"El usuario con ID {id} no fue encontrado.");
        }

        var cleanEmail = dto.Email.Trim().ToLower();
        if (await _context.Usuarios.AnyAsync(x => x.Id != id && x.Email.ToLower() == cleanEmail))
        {
            throw new BadRequestException($"El correo '{dto.Email}' ya se encuentra en uso por otro usuario.");
        }

        var rolExiste = await _context.Roles.AnyAsync(r => r.Id == dto.IdRol && r.Estado);
        if (!rolExiste)
        {
            throw new BadRequestException("El rol seleccionado no es válido.");
        }

        u.Nombres = dto.Nombres.Trim();
        u.Apellidos = dto.Apellidos.Trim();
        u.Email = cleanEmail;
        u.IdRol = dto.IdRol;
        u.Estado = dto.Estado;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            u.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Usuario ID {Id} actualizado correctamente.", id);
        await _auditoriaService.RegistrarAsync("EDITAR_USUARIO", "Usuarios", $"Se actualizaron los datos del usuario ID {id} (@{u.NombreUsuario} - {u.Nombres} {u.Apellidos}).");

        return await ObtenerPorIdAsync(id);
    }

    public async Task<bool> EliminarUsuarioAsync(int id)
    {
        var u = await _context.Usuarios.FirstOrDefaultAsync(x => x.Id == id);
        if (u == null)
        {
            throw new NotFoundException($"El usuario con ID {id} no fue encontrado.");
        }

        if (!u.Estado)
        {
            throw new BadRequestException("El usuario ya se encuentra inactivo.");
        }

        u.Estado = false;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Usuario ID {Id} desactivado exitosamente.", id);
        await _auditoriaService.RegistrarAsync("DESACTIVAR_USUARIO", "Usuarios", $"Se desactivó la cuenta del usuario ID {id} (@{u.NombreUsuario}).");

        return true;
    }

    public async Task<bool> ReactivarUsuarioAsync(int id)
    {
        var u = await _context.Usuarios.FirstOrDefaultAsync(x => x.Id == id);
        if (u == null)
        {
            throw new NotFoundException($"El usuario con ID {id} no fue encontrado.");
        }

        if (u.Estado)
        {
            throw new BadRequestException("El usuario ya se encuentra activo.");
        }

        u.Estado = true;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Usuario ID {Id} reactivado exitosamente.", id);
        await _auditoriaService.RegistrarAsync("REACTIVAR_USUARIO", "Usuarios", $"Se reactivó la cuenta del usuario ID {id} (@{u.NombreUsuario}).");

        return true;
    }
}
