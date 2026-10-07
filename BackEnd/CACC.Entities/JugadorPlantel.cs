namespace CACC.Entities
{
    public class JugadorPlantel
    {
        public int IdJugador { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string PosicionCancha { get; set; } = string.Empty;
        public string? FechaNacimiento { get; set; }
    }
}