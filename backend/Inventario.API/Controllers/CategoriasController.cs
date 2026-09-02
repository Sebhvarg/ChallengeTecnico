using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Categoria;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaService _categoriaService;

    public CategoriasController(ICategoriaService categoriaService)
    {
        _categoriaService = categoriaService;
    }

    /// <summary>
    /// Obtiene la lista de categorías activas para clasificación de productos.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<CategoriaDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategorias()
    {
        var categorias = await _categoriaService.ObtenerTodasActivasAsync();
        return Ok(ApiResponse<List<CategoriaDto>>.Ok(categorias));
    }

    /// <summary>
    /// Crea una nueva categoría de productos.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<CategoriaDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CrearCategoriaDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var categoria = await _categoriaService.CrearCategoriaAsync(dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CategoriaDto>.Ok(categoria, "Categoría creada exitosamente.", 201));
    }
}
