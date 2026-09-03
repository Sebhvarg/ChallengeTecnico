namespace Inventario.API.DTOs.Auditoria;

public class AuditoriaDto
{
    public int Id { get; set; }
    public int? IdUsuario { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string Detalle { get; set; } = string.Empty;
    public string? Ip { get; set; }
    public DateTime Fecha { get; set; }
}

public class AuditoriaStatsDto
{
    public int Total { get; set; }
    public int Creaciones { get; set; }
    public int Ediciones { get; set; }
    public int Desactivaciones { get; set; }
    public int IniciosSesion { get; set; }
}
