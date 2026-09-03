using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Producto;

namespace Inventario.API.Services.Interfaces;

public interface IProductoService
{
    Task<PagedResult<ProductoListItemDto>> BuscarProductosAsync(
        string? filtro,
        int? idCategoria,
        decimal? precioMin,
        decimal? precioMax,
        int? idProveedor,
        int pagina,
        int tamanoPagina);
    Task<ProductoDto> ObtenerPorIdAsync(int id);
    Task<ProductoDto> ObtenerPorCodigoAsync(string codigo);
    Task<ProductoDto> CrearProductoAsync(CrearProductoDto dto);
    Task<ProductoDto> ActualizarProductoAsync(int id, ActualizarProductoDto dto);
    Task<bool> EliminarProductoAsync(int id);
    Task<LoteProductoDto> AgregarLoteAsync(CrearLoteDto dto);
}
