namespace Inventario.API.Common.Responses;

public class ApiResponse<T>
{
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public T? Datos { get; set; }
    public List<string>? Errores { get; set; }
    public int CodigoEstado { get; set; }

    public static ApiResponse<T> Ok(T? datos, string mensaje = "Operación exitosa", int codigoEstado = 200)
    {
        return new ApiResponse<T>
        {
            Exito = true,
            Mensaje = mensaje,
            Datos = datos,
            CodigoEstado = codigoEstado
        };
    }

    public static ApiResponse<T> Fail(string mensaje, List<string>? errores = null, int codigoEstado = 400)
    {
        return new ApiResponse<T>
        {
            Exito = false,
            Mensaje = mensaje,
            Errores = errores ?? new List<string>(),
            CodigoEstado = codigoEstado
        };
    }
}
