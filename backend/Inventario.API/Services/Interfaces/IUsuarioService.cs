using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Usuario;

namespace Inventario.API.Services.Interfaces;

public interface IUsuarioService
{
    Task<PagedResult<UsuarioDto>> BuscarUsuariosAsync(string? filtro, int pagina, int tamanoPagina);
    Task<UsuarioDto> ObtenerPorIdAsync(int id);
    Task<List<RolDto>> ObtenerRolesActivosAsync();
    Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioDto dto);
    Task<UsuarioDto> ActualizarUsuarioAsync(int id, ActualizarUsuarioDto dto);
    Task<bool> EliminarUsuarioAsync(int id);
    Task<bool> ReactivarUsuarioAsync(int id);
}
