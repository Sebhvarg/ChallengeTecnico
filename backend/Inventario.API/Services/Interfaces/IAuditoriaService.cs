using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Auditoria;

namespace Inventario.API.Services.Interfaces;

public interface IAuditoriaService
{
    Task RegistrarAsync(string accion, string modulo, string detalle, int? idUsuario = null, string? usuario = null, string? rol = null);
    Task<PagedResult<AuditoriaDto>> BuscarAsync(string? filtro, string? modulo, string? accion, int pagina, int tamanoPagina);
    Task<AuditoriaStatsDto> ObtenerEstadisticasAsync();
}
