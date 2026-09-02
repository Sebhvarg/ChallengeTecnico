namespace Inventario.API.Entities;

public class Producto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int? IdCategoria { get; set; }
    public bool Estado { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual CategoriaProducto? Categoria { get; set; }
    public virtual ICollection<ProveedorXProducto> ProveedorXProductos { get; set; } = new List<ProveedorXProducto>();
}
