namespace CACC.Entities
{
    public class TipoDescuento
    {
        public int IdDescuento { get; set; }
        public string TipoDescuentoNombre { get; set; } = string.Empty;
        public int Porcentaje { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
    }
}