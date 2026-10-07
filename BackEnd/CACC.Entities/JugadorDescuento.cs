namespace CACC.Entities
{
    public class JugadorDescuento
    {
        public int IdJugadorDescuento { get; set; }
        public int IdJugador { get; set; }
        public int IdDescuento { get; set; }
        public bool EstadoActivo { get; set; }
    }
}