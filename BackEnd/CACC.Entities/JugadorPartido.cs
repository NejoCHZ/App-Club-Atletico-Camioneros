namespace CACC.Entities
{
    public class JugadorPartido
    {
        public int IdJugadorPartido { get; set; }
        public int IdPartido { get; set; }
        public int IdJugador { get; set; }
        public int? MinutosJugados { get; set; }
        public int? Goles { get; set; }
        public int? TarjetasAmarillas { get; set; }
        public bool TarjetaRoja { get; set; }
    }
}