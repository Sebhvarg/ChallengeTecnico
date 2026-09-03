using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Log;

namespace Inventario.API.Services.Interfaces;

public interface ILogService
{
    Task<PagedResult<LogItemDto>> ObtenerLogsAsync(string? filtro, string? nivel, int pagina, int tamanoPagina);
    Task<LogStatsDto> ObtenerEstadisticasLogsAsync();
    Task<bool> LimpiarLogsAsync();
}
