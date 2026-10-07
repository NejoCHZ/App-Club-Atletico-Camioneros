using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class JugadorCreateDto
    {
        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("fechaNacimiento")]
        public DateTime? FechaNacimiento { get; set; }

        [JsonPropertyName("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [JsonPropertyName("posicion")]
        public string? Posicion { get; set; }

        [JsonPropertyName("clubOrigen")]
        public string? ClubOrigen { get; set; }

        [JsonPropertyName("aptoFisico")]
        public bool AptoFisico { get; set; }

        [JsonPropertyName("tutor")]
        public TutorCreateDto? Tutor { get; set; }
    }

    public class TutorCreateDto
    {
        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("telefono")]
        public string? Telefono { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        // Mapea el nuevo campo que agregamos en Angular
        [JsonPropertyName("parentesco")]
        public string? Parentesco { get; set; }
    }
}