using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Producto;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _productoService;

    public ProductosController(IProductoService productoService)
    {
        _productoService = productoService;
    }

    /// <summary>
    /// Consulta y búsqueda paginada de productos con filtros por categoría, rango de precios y proveedor.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProductoListItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductos(
        [FromQuery] string? filtro,
        [FromQuery] int? idCategoria,
        [FromQuery] decimal? precioMin,
        [FromQuery] decimal? precioMax,
        [FromQuery] int? idProveedor,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 10)
    {
        var resultado = await _productoService.BuscarProductosAsync(filtro, idCategoria, precioMin, precioMax, idProveedor, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<ProductoListItemDto>>.Ok(resultado, "Listado de productos obtenido exitosamente."));
    }

    /// <summary>
    /// Obtiene el detalle de un producto por su identificador único.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProductoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var producto = await _productoService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<ProductoDto>.Ok(producto));
    }

    /// <summary>
    /// Obtiene el detalle de un producto por su código alfanumérico.
    /// </summary>
    [HttpGet("codigo/{codigo}")]
    [ProducesResponseType(typeof(ApiResponse<ProductoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCodigo(string codigo)
    {
        var producto = await _productoService.ObtenerPorCodigoAsync(codigo);
        return Ok(ApiResponse<ProductoDto>.Ok(producto));
    }

    /// <summary>
    /// Registra un nuevo producto junto con su proveedor, número de lote e inventario inicial.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ProductoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CrearProductoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var producto = await _productoService.CrearProductoAsync(dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ProductoDto>.Ok(producto, "Producto registrado correctamente.", 201));
    }

    /// <summary>
    /// Actualiza los datos de un producto y opcionalmente su inventario / lote.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ProductoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarProductoDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var producto = await _productoService.ActualizarProductoAsync(id, dto);
        return Ok(ApiResponse<ProductoDto>.Ok(producto, "Producto actualizado correctamente."));
    }

    /// <summary>
    /// Realiza la baja lógica de un producto y desactiva sus lotes vinculados.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _productoService.EliminarProductoAsync(id);
        return Ok(ApiResponse<bool>.Ok(resultado, "Producto desactivado exitosamente."));
    }

    /// <summary>
    /// Agrega un nuevo lote con proveedor y precio a un producto existente.
    /// </summary>
    [HttpPost("lotes")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<LoteProductoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddLote([FromBody] CrearLoteDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var lote = await _productoService.AgregarLoteAsync(dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<LoteProductoDto>.Ok(lote, "Lote agregado al producto correctamente.", 201));
    }
}
