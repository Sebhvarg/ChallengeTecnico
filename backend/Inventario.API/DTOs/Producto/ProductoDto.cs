namespace Inventario.API.DTOs.Producto;

public class ProductoDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? IdCategoria { get; set; }
    public string? CategoriaNombre { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public List<LoteProductoDto> Lotes { get; set; } = new List<LoteProductoDto>();
    public int StockTotal => Lotes.Where(l => l.Estado).Sum(l => l.StockProducto);
}
