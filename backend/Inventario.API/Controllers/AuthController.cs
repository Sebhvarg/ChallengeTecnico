using System.Security.Claims;
using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Auth;
using Inventario.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventario.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Inicia sesión y genera un token JWT.
    /// </summary>
    /// <param name="request">Credenciales del usuario (usuario o email y contraseña).</param>
    /// <returns>Token JWT, fecha de expiración, datos de usuario y rutas autorizadas.</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errores = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object>.Fail("Datos de entrada inválidos.", errores, 400));
        }

        var resultado = await _authService.LoginAsync(request);
        return Ok(ApiResponse<LoginResponseDto>.Ok(resultado, "Inicio de sesión exitoso."));
    }

    /// <summary>
    /// Obtiene los datos del perfil del usuario autenticado actualmente.
    /// </summary>
    [HttpGet("perfil")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserInfoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPerfil()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Token no contiene un ID de usuario válido.", null, 401));
        }

        var perfil = await _authService.GetUserProfileAsync(userId);
        return Ok(ApiResponse<UserInfoDto>.Ok(perfil));
    }
}
