using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class TutorDto
    {
        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get => _nombre; set => _nombre = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _nombre = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get => _apellido; set => _apellido = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _apellido = string.Empty;

        [JsonPropertyName("telefono")]
        public string? Telefono { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("parentesco")]
        public string? Parentesco { get; set; }
    }

    public class GuardarTutorDto
    {
        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get => _nombre; set => _nombre = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _nombre = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get => _apellido; set => _apellido = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _apellido = string.Empty;

        [JsonPropertyName("parentesco")]
        public string Parentesco { get; set; } = "Padre";

        [JsonPropertyName("telefono")]
        public string Telefono { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }
}