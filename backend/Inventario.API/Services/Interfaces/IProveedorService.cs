using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Proveedor;

namespace Inventario.API.Services.Interfaces;

public interface IProveedorService
{
    Task<PagedResult<ProveedorDto>> BuscarProveedoresAsync(string? filtro, int pagina, int tamanoPagina);
    Task<List<ProveedorDto>> ObtenerTodosActivosAsync();
    Task<ProveedorDto> ObtenerPorIdAsync(int id);
    Task<ProveedorDto> CrearProveedorAsync(CrearProveedorDto dto);
    Task<ProveedorDto> ActualizarProveedorAsync(int id, ActualizarProveedorDto dto);
    Task<bool> EliminarProveedorAsync(int id);
}
