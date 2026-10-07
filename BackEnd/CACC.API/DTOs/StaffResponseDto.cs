using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class StaffResponseDto
    {
        [JsonPropertyName("idStaff")]
        public int IdStaff { get; set; }

        [JsonPropertyName("idUsuario")]
        public int IdUsuario { get; set; }

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("nombreCompleto")]
        public string NombreCompleto { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("fechaDeNacimiento")]
        public DateTime? FechaDeNacimiento { get; set; }

        [JsonPropertyName("domicilio")]
        public string? Domicilio { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("idRol")]
        public int IdRol { get; set; }

        [JsonPropertyName("rol")]
        public string Rol { get; set; } = string.Empty;

        [JsonPropertyName("categoriasIds")]
        public List<int> CategoriasIds { get; set; } = new();

        [JsonPropertyName("categoriaAsignada")]
        public string CategoriaAsignada { get; set; } = string.Empty;

        [JsonPropertyName("activo")]
        public bool Activo { get; set; }
    }
}