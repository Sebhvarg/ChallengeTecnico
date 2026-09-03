using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Auditoria;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Soporte")]
[Produces("application/json")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _auditoriaService;

    public AuditoriaController(IAuditoriaService auditoriaService)
    {
        _auditoriaService = auditoriaService;
    }

    /// <summary>
    /// Consulta paginada y filtrada del historial de auditoría de usuarios y acciones.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditoriaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditoria(
        [FromQuery] string? filtro,
        [FromQuery] string? modulo,
        [FromQuery] string? accion,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        var resultado = await _auditoriaService.BuscarAsync(filtro, modulo, accion, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<AuditoriaDto>>.Ok(resultado, "Historial de auditoría obtenido exitosamente."));
    }

    /// <summary>
    /// Obtiene métricas cuantitativas de acciones realizadas por los usuarios en el sistema.
    /// </summary>
    [HttpGet("estadisticas")]
    [ProducesResponseType(typeof(ApiResponse<AuditoriaStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEstadisticas()
    {
        var stats = await _auditoriaService.ObtenerEstadisticasAsync();
        return Ok(ApiResponse<AuditoriaStatsDto>.Ok(stats));
    }
}
