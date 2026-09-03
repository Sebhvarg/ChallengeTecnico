using System.Security.Claims;
using Inventario.API.Common.Responses;
using Inventario.API.Data;
using Inventario.API.DTOs.Auditoria;
using Inventario.API.Entities;
using Inventario.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Inventario.API.Services.Implementations;

public class AuditoriaService : IAuditoriaService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditoriaService> _logger;

    public AuditoriaService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditoriaService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task RegistrarAsync(
        string accion,
        string modulo,
        string detalle,
        int? idUsuario = null,
        string? usuario = null,
        string? rol = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            string? ip = httpContext?.Connection?.RemoteIpAddress?.ToString();

            // Si no se pasaron datos del usuario explícitamente, intentar extraerlos de los Claims del JWT
            if (idUsuario == null && httpContext?.User?.Identity?.IsAuthenticated == true)
            {
                var idClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst("nameid")?.Value
                    ?? httpContext.User.FindFirst("sub")?.Value;

                if (int.TryParse(idClaim, out var parsedId))
                {
                    idUsuario = parsedId;
                }
            }

            if (string.IsNullOrWhiteSpace(usuario))
            {
                usuario = httpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                    ?? httpContext?.User?.FindFirst("unique_name")?.Value
                    ?? "Sistema";
            }

            if (string.IsNullOrWhiteSpace(rol))
            {
                rol = httpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
                    ?? httpContext?.User?.FindFirst("role")?.Value
                    ?? "General";
            }

            var auditEntry = new Auditoria
            {
                IdUsuario = idUsuario,
                Usuario = usuario,
                Rol = rol,
                Accion = accion.Trim().ToUpper(),
                Modulo = modulo.Trim(),
                Detalle = detalle.Trim(),
                Ip = ip,
                Fecha = DateTime.UtcNow
            };

            _context.Auditorias.Add(auditEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Auditoría registrada: [{Accion}] en [{Modulo}] por el usuario {Usuario} ({Rol})",
                auditEntry.Accion, auditEntry.Modulo, auditEntry.Usuario, auditEntry.Rol);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar evento de auditoría para la acción: {Accion} en {Modulo}", accion, modulo);
        }
    }

    public async Task<PagedResult<AuditoriaDto>> BuscarAsync(
        string? filtro,
        string? modulo,
        string? accion,
        int pagina,
        int tamanoPagina)
    {
        if (pagina < 1) pagina = 1;
        if (tamanoPagina < 1) tamanoPagina = 10;
        if (tamanoPagina > 100) tamanoPagina = 100;

        var query = _context.Auditorias.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            var clean = filtro.Trim().ToLower();
            query = query.Where(a =>
                a.Usuario.ToLower().Contains(clean) ||
                a.Detalle.ToLower().Contains(clean) ||
                a.Rol.ToLower().Contains(clean) ||
                a.Accion.ToLower().Contains(clean));
        }

        if (!string.IsNullOrWhiteSpace(modulo) && modulo.ToUpper() != "TODOS")
        {
            var cleanMod = modulo.Trim().ToLower();
            query = query.Where(a => a.Modulo.ToLower() == cleanMod);
        }

        if (!string.IsNullOrWhiteSpace(accion) && accion.ToUpper() != "TODOS")
        {
            var cleanAcc = accion.Trim().ToUpper();
            query = query.Where(a => a.Accion.ToUpper() == cleanAcc);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.Id)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(a => new AuditoriaDto
            {
                Id = a.Id,
                IdUsuario = a.IdUsuario,
                Usuario = a.Usuario,
                Rol = a.Rol,
                Accion = a.Accion,
                Modulo = a.Modulo,
                Detalle = a.Detalle,
                Ip = a.Ip,
                Fecha = a.Fecha
            })
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<AuditoriaDto>(items, total, pagina, tamanoPagina);
    }

    public async Task<AuditoriaStatsDto> ObtenerEstadisticasAsync()
    {
        var total = await _context.Auditorias.CountAsync();
        var creaciones = await _context.Auditorias.CountAsync(a => a.Accion.StartsWith("CREAR") || a.Accion == "REGISTRAR");
        var ediciones = await _context.Auditorias.CountAsync(a => a.Accion.StartsWith("EDITAR") || a.Accion.StartsWith("ACTUALIZAR"));
        var desactivaciones = await _context.Auditorias.CountAsync(a => a.Accion.StartsWith("ELIMINAR") || a.Accion.StartsWith("DESACTIVAR"));
        var logins = await _context.Auditorias.CountAsync(a => a.Accion == "LOGIN");

        return new AuditoriaStatsDto
        {
            Total = total,
            Creaciones = creaciones,
            Ediciones = ediciones,
            Desactivaciones = desactivaciones,
            IniciosSesion = logins
        };
    }
}
