namespace Inventario.API.Entities;

public class Auditoria
{
    public int Id { get; set; }
    public int? IdUsuario { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string Detalle { get; set; } = string.Empty;
    public string? Ip { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public virtual Usuario? UsuarioRef { get; set; }
}
