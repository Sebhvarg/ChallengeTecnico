namespace Inventario.API.DTOs.Proveedor;

public class ProveedorDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Celular { get; set; }
    public bool Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
}
