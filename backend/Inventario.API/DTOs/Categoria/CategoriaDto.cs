namespace Inventario.API.DTOs.Categoria;

public class CategoriaDto
{
    public int Id { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public bool Estado { get; set; }
}
