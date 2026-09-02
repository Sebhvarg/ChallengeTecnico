using System.ComponentModel.DataAnnotations;

namespace Inventario.API.DTOs.Inventario;

public class AjustarStockDto
{
    [Required(ErrorMessage = "El ID del lote (ProveedorXProducto) es obligatorio")]
    public int IdLote { get; set; }

    [Required(ErrorMessage = "La cantidad de ajuste es obligatoria")]
    public int Cantidad { get; set; }

    [Required(ErrorMessage = "El tipo de ajuste es obligatorio (Fijar, Incrementar, Decrementar)")]
    public string TipoAjuste { get; set; } = "Incrementar"; // "Fijar", "Incrementar", "Decrementar"

    [Range(0, double.MaxValue, ErrorMessage = "El nuevo costo debe ser mayor o igual a 0")]
    public decimal? NuevoCosto { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "El nuevo precio debe ser mayor o igual a 0")]
    public decimal? NuevoPrecio { get; set; }
}
