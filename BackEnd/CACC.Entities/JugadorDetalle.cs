namespace CACC.Entities
{
    public class JugadorDetalle
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

        // Nuevos campos mapeados desde la DB
        public decimal? Peso { get; set; }
        public decimal? Altura { get; set; }
        public string? PieHabil { get; set; }
        public string? Domicilio { get; set; }
        public FichaMedicaDetalle? FichaMedica { get; set; }
        public List<PartidoDetalle> Partidos { get; set; } = new List<PartidoDetalle>();
    }

    // Clases de apoyo exclusivas para la Entidad (evita depender de los DTOs de la API)
    public class PartidoDetalle
    {
        public DateTime Fecha { get; set; }
        public string Rival { get; set; } = string.Empty;
        public string Resultado { get; set; } = string.Empty;
        public string? Condicion { get; set; } // <--- NUEVA LÍNEA
        public int Minutos { get; set; }
    }

    public class FichaMedicaDetalle
    {
        public string? GrupoSanguineo { get; set; }
        public string? Patologias { get; set; }
        public string? HistorialLesiones { get; set; }
        public string? Observaciones { get; set; }
    }
}