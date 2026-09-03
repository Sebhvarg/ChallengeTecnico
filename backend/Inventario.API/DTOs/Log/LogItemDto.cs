namespace Inventario.API.DTOs.Log;

public class LogItemDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Nivel { get; set; } = "INF"; // INF, WRN, ERR, FTL, DBG
    public string Mensaje { get; set; } = string.Empty;
    public string? Excepcion { get; set; }
    public string? Origen { get; set; }
}

public class LogStatsDto
{
    public int Total { get; set; }
    public int Errores { get; set; }
    public int Advertencias { get; set; }
    public int Informacion { get; set; }
}
