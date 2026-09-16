namespace CACC.Entities
{
    public class Jugador
    {
        public int IdJugador { get; set; }
        public int IdPersona { get; set; }
        public int IdCategoria { get; set; }
        public string? ClubOrigen { get; set; }
        public bool FichaMedicaLiga { get; set; }
        public string? PosicionCancha { get; set; }
    }
}