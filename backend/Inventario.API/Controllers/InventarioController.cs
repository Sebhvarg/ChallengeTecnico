using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Inventario;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class InventarioController : ControllerBase
{
    private readonly IInventarioService _inventarioService;

    public InventarioController(IInventarioService inventarioService)
    {
        _inventarioService = inventarioService;
    }

    /// <summary>
    /// Consulta paginada del inventario y stock por lote/proveedor.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<InventarioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventario([FromQuery] string? filtro, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 10)
    {
        var inventario = await _inventarioService.ObtenerInventarioAsync(filtro, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<InventarioDto>>.Ok(inventario));
    }

    /// <summary>
    /// Obtiene todos los lotes e inventario asociados a un producto específico.
    /// </summary>
    [HttpGet("producto/{idProducto:int}")]
    [ProducesResponseType(typeof(ApiResponse<List<InventarioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLotesPorProducto(int idProducto)
    {
        var lotes = await _inventarioService.ObtenerLotesPorProductoAsync(idProducto);
        return Ok(ApiResponse<List<InventarioDto>>.Ok(lotes));
    }

    /// <summary>
    /// Ajusta las existencias (stock), costo o precio de un lote específico.
    /// </summary>
    [HttpPut("ajuste-stock")]
    [ProducesResponseType(typeof(ApiResponse<InventarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AjustarStock([FromBody] AjustarStockDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var resultado = await _inventarioService.AjustarStockAsync(dto);
        return Ok(ApiResponse<InventarioDto>.Ok(resultado, "Ajuste de inventario aplicado con éxito."));
    }
}
