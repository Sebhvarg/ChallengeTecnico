using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Log;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Soporte")]
[Produces("application/json")]
public class LogsController : ControllerBase
{
    private readonly ILogService _logService;

    public LogsController(ILogService logService)
    {
        _logService = logService;
    }

    /// <summary>
    /// Consulta paginada de logs de auditoría y traza del sistema.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LogItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? filtro,
        [FromQuery] string? nivel,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 15)
    {
        var resultado = await _logService.ObtenerLogsAsync(filtro, nivel, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<LogItemDto>>.Ok(resultado, "Logs obtenidos correctamente."));
    }

    /// <summary>
    /// Obtiene estadísticas cuantitativas de logs (total, errores, advertencias, info).
    /// </summary>
    [HttpGet("estadisticas")]
    [ProducesResponseType(typeof(ApiResponse<LogStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEstadisticas()
    {
        var stats = await _logService.ObtenerEstadisticasLogsAsync();
        return Ok(ApiResponse<LogStatsDto>.Ok(stats));
    }

    /// <summary>
    /// Limpia los archivos de logs del sistema (requiere rol de Administrador o Soporte).
    /// </summary>
    [HttpDelete("limpiar")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Limpiar()
    {
        var ok = await _logService.LimpiarLogsAsync();
        return Ok(ApiResponse<bool>.Ok(ok, "Logs limpiados exitosamente."));
    }
}
