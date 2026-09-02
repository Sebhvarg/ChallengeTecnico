using Inventario.API.Common.Responses;
using Inventario.API.DTOs.Inventario;

namespace Inventario.API.Services.Interfaces;

public interface IInventarioService
{
    Task<PagedResult<InventarioDto>> ObtenerInventarioAsync(string? filtro, int pagina, int tamanoPagina);
    Task<InventarioDto> AjustarStockAsync(AjustarStockDto dto);
    Task<List<InventarioDto>> ObtenerLotesPorProductoAsync(int idProducto);
}
