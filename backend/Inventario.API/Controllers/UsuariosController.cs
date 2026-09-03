using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Usuario;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
[Produces("application/json")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    /// <summary>
    /// Consulta paginada de usuarios con filtro por nombre, usuario o email.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UsuarioDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsuarios([FromQuery] string? filtro, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 10)
    {
        var resultado = await _usuarioService.BuscarUsuariosAsync(filtro, pagina, tamanoPagina);
        return Ok(ApiResponse<PagedResult<UsuarioDto>>.Ok(resultado, "Usuarios obtenidos exitosamente."));
    }

    /// <summary>
    /// Obtiene la lista de roles activos para asignación de usuarios.
    /// </summary>
    [HttpGet("roles")]
    [ProducesResponseType(typeof(ApiResponse<List<RolDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _usuarioService.ObtenerRolesActivosAsync();
        return Ok(ApiResponse<List<RolDto>>.Ok(roles));
    }

    /// <summary>
    /// Obtiene un usuario por su ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var usuario = await _usuarioService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<UsuarioDto>.Ok(usuario));
    }

    /// <summary>
    /// Registra un nuevo usuario en el sistema.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CrearUsuarioDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var nuevo = await _usuarioService.CrearUsuarioAsync(dto);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<UsuarioDto>.Ok(nuevo, "Usuario creado exitosamente.", 201));
    }

    /// <summary>
    /// Actualiza un usuario existente.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarUsuarioDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de validación incorrectos.", errores, 400));
        }

        var actualizado = await _usuarioService.ActualizarUsuarioAsync(id, dto);
        return Ok(ApiResponse<UsuarioDto>.Ok(actualizado, "Usuario actualizado exitosamente."));
    }

    /// <summary>
    /// Desactiva lógicamente un usuario.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _usuarioService.EliminarUsuarioAsync(id);
        return Ok(ApiResponse<bool>.Ok(resultado, "Usuario desactivado exitosamente."));
    }

    /// <summary>
    /// Reactiva un usuario inactivo.
    /// </summary>
    [HttpPost("{id:int}/reactivar")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reactivar(int id)
    {
        var resultado = await _usuarioService.ReactivarUsuarioAsync(id);
        return Ok(ApiResponse<bool>.Ok(resultado, "Usuario reactivado exitosamente."));
    }
}
