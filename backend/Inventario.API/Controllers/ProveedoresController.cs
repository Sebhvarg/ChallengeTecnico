using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Proveedor;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ProveedoresController : ControllerBase
{
    private readonly IProveedorService _proveedorService;

    public ProveedoresController(IProveedorService proveedorService)
    {
        _proveedorService = proveedorService;
    }

    /// <summary>
    /// Consulta paginada de proveedores con filtro de búsqueda.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProveedorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProveedores([FromQuery] string? filtro, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 10)
    {
        var resultado = await _proveedorService.BuscarProveedoresAsync(filtro, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<ProveedorDto>>.Ok(resultado, "Proveedores obtenidos exitosamente."));
    }

    /// <summary>
    /// Obtiene la lista completa de todos los proveedores activos (para combos y selectores).
    /// </summary>
    [HttpGet("activos")]
    [ProducesResponseType(typeof(ApiResponse<List<ProveedorDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivos()
    {
        var proveedores = await _proveedorService.ObtenerTodosActivosAsync();
        return Ok(ApiResponse<List<ProveedorDto>>.Ok(proveedores));
    }

    /// <summary>
    /// Obtiene la información de un proveedor por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProveedorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var proveedor = await _proveedorService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<ProveedorDto>.Ok(proveedor));
    }

    /// <summary>
    /// Registra un nuevo proveedor en el sistema.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ProveedorDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CrearProveedorDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var proveedor = await _proveedorService.CrearProveedorAsync(dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<ProveedorDto>.Ok(proveedor, "Proveedor creado exitosamente.", 201));
    }

    /// <summary>
    /// Actualiza la información de un proveedor existente.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ProveedorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarProveedorDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var proveedor = await _proveedorService.ActualizarProveedorAsync(id, dto);
        return Ok(ApiResponse<ProveedorDto>.Ok(proveedor, "Proveedor actualizado correctamente."));
    }

    /// <summary>
    /// Desactiva lógicamente un proveedor del catálogo.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _proveedorService.EliminarProveedorAsync(id);
        return Ok(ApiResponse<bool>.Ok(resultado, "Proveedor desactivado exitosamente."));
    }
}
