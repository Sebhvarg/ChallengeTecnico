namespace Inventario.API.Common.Responses;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalRegistros { get; set; }
    public int Pagina { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalPaginas => TamanoPagina > 0 ? (int)Math.Ceiling((double)TotalRegistros / TamanoPagina) : 0;
    public bool TienePaginaAnterior => Pagina > 1;
    public bool TienePaginaSiguiente => Pagina < TotalPaginas;

    public PagedResult() { }

    public PagedResult(List<T> items, int totalRegistros, int pagina, int tamanoPagina)
    {
        Items = items;
        TotalRegistros = totalRegistros;
        Pagina = pagina;
        TamanoPagina = tamanoPagina;
    }
}
