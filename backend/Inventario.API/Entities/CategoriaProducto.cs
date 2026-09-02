namespace Inventario.API.Entities;

public class CategoriaProducto
{
    public int Id { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public bool Estado { get; set; } = true;

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
