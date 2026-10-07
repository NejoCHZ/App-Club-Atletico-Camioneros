namespace CACC.Entities
{
    public class Asistencia
    {
        public int IdAsistencia { get; set; }
        public int IdJugador { get; set; }
        public int IdStaff { get; set; }
        public DateTime FechaHora { get; set; }
        public string EstadoAcceso { get; set; } = string.Empty;
    }
}