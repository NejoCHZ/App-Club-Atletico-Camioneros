namespace CACC.Entities
{
    public class HistorialPartido
    {
        public int IdPartido { get; set; }
        public int IdCategoria { get; set; }
        public DateTime FechaPartido { get; set; }
        public string Rival { get; set; } = string.Empty;
        public string? CondicionLocalia { get; set; }
        public string? Resultado { get; set; }
        public string? Observaciones { get; set; }
    }
}