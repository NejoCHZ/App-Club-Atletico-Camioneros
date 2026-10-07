using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class StaffCreateDto
    {
        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("fechaNacimiento")]
        public string? FechaNacimiento { get; set; }

        [JsonPropertyName("genero")]
        public string? Genero { get; set; }

        [JsonPropertyName("domicilio")]
        public string? Domicilio { get; set; }

        [JsonPropertyName("telefono")]
        public string? Telefono { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("contrasenia")]
        public string Contrasenia { get; set; } = string.Empty;

        [JsonPropertyName("rol")]
        public string Rol { get; set; } = string.Empty;

        [JsonPropertyName("idRol")]
        public int? IdRol { get; set; }

        [JsonPropertyName("idCategoria")]
        public int? IdCategoria { get; set; }

        [JsonPropertyName("categoriasIds")]
        public List<int> CategoriasIds { get; set; } = new();
    }
}