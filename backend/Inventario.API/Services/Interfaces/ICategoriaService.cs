using Inventario.API.DTOs.Categoria;

namespace Inventario.API.Services.Interfaces;

public interface ICategoriaService
{
    Task<List<CategoriaDto>> ObtenerTodasActivasAsync();
    Task<CategoriaDto> CrearCategoriaAsync(CrearCategoriaDto dto);
}
