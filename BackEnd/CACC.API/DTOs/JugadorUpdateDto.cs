using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class JugadorUpdateDto
    {
        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("fechaNacimiento")]
        public DateTime? FechaDeNacimiento { get; set; }

        [JsonPropertyName("posicion")]
        public string? Posicion { get; set; }

        [JsonPropertyName("peso")]
        public decimal? Peso { get; set; }

        [JsonPropertyName("altura")]
        public decimal? Altura { get; set; }

        [JsonPropertyName("pieHabil")]
        public string? PieHabil { get; set; }

        [JsonPropertyName("fichaMedica")]
        public FichaMedicaUpdateDto? FichaMedica { get; set; }

        [JsonPropertyName("partidos")]
        public List<PartidoUpdateDto> Partidos { get; set; } = new List<PartidoUpdateDto>();
    }

    public class FichaMedicaUpdateDto
    {
        [JsonPropertyName("grupoSanguineo")]
        public string? GrupoSanguineo { get; set; }

        [JsonPropertyName("patologias")]
        public string? Patologias { get; set; }

        [JsonPropertyName("historialLesiones")]
        public string? HistorialLesiones { get; set; }

        [JsonPropertyName("observaciones")]
        public string? Observaciones { get; set; }
    }

    public class PartidoUpdateDto
    {
        [JsonPropertyName("fecha")]
        public DateTime Fecha { get; set; }

        [JsonPropertyName("rival")]
        public string Rival { get; set; } = string.Empty;

        [JsonPropertyName("minutos")]
        public int Minutos { get; set; }
    }
}