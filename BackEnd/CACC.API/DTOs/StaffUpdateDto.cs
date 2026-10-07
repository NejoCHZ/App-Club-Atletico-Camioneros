using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class StaffUpdateDto
    {
        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("fechaNacimiento")]
        public string? FechaNacimiento { get; set; }

        [JsonPropertyName("domicilio")]
        public string? Domicilio { get; set; }

        [JsonPropertyName("genero")]
        public string? Genero { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("contrasenia")]
        public string? Contrasenia { get; set; }

        [JsonPropertyName("rol")]
        public string? Rol { get; set; }

        [JsonPropertyName("idRol")]
        public int? IdRol { get; set; }

        [JsonPropertyName("idCategoria")]
        public int? IdCategoria { get; set; }

        [JsonPropertyName("categoriasIds")]
        public List<int> CategoriasIds { get; set; } = new();

        [JsonPropertyName("activo")]
        public bool Activo { get; set; } = true;
    }
}