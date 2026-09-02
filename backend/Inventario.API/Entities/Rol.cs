namespace Inventario.API.Entities;

public class Rol
{
    public int Id { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public bool Estado { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public virtual ICollection<Ruta> Rutas { get; set; } = new List<Ruta>();
}
