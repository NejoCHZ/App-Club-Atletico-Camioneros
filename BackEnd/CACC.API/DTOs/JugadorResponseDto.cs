namespace CACC.API.DTOs
{
    public class JugadorResponseDto
    {
        public int IdJugador { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string? Genero { get; set; }
        public DateTime? FechaDeNacimiento { get; set; }
        public int IdCategoria { get; set; }
        public string? NombreCategoria { get; set; }
        public string? ClubOrigen { get; set; }
        public bool FichaMedicaLiga { get; set; }
        public string? PosicionCancha { get; set; }
    }
}