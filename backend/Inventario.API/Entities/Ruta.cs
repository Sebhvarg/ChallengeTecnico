namespace Inventario.API.Entities;

public class Ruta
{
    public int Id { get; set; }
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string RutaUrl { get; set; } = string.Empty;
    public bool Estado { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public virtual Rol Rol { get; set; } = null!;
}
