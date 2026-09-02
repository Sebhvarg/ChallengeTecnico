using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Reporte;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reporteService;

    public ReportesController(IReporteService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>
    /// Genera la matriz comparativa de precios de venta de productos entre los distintos proveedores.
    /// </summary>
    [HttpGet("precios-proveedores")]
    [ProducesResponseType(typeof(ApiResponse<List<ReportePrecioProductoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReportePrecios([FromQuery] string? filtro)
    {
        var reporte = await _reporteService.ObtenerReportePreciosPorProveedorAsync(filtro);
        return Ok(ApiResponse<List<ReportePrecioProductoDto>>.Ok(reporte, "Reporte comparativo de precios generado exitosamente."));
    }
}
