using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class CategoriaResponseDto
    {
        [JsonPropertyName("idCategoria")]
        public int IdCategoria { get; set; }

        [JsonPropertyName("nombreCategoria")]
        public string NombreCategoria { get; set; } = string.Empty;

        [JsonPropertyName("asociacion")]
        public string Asociacion { get; set; } = "Liga Cordobesa";

        [JsonPropertyName("cantidadJugadores")]
        public int CantidadJugadores { get; set; }

        [JsonPropertyName("cantidadStaff")]
        public int CantidadStaff { get; set; }
    }

    public class CategoriaCreateUpdateDto
    {
        [JsonPropertyName("nombreCategoria")]
        public string NombreCategoria { get; set; } = string.Empty;

        [JsonPropertyName("asociacion")]
        public string Asociacion { get; set; } = "Liga Cordobesa";
    }

    public class AsignarJugadorCategoriaDto
    {
        [JsonPropertyName("idJugador")]
        public int IdJugador { get; set; }
    }

    public class JugadorPlantelDto
    {
        [JsonPropertyName("idJugador")]
        public int IdJugador { get; set; }

        [JsonPropertyName("nombreCompleto")]
        public string NombreCompleto { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("posicionCancha")]
        public string PosicionCancha { get; set; } = string.Empty;

        [JsonPropertyName("fechaNacimiento")]
        public string? FechaNacimiento { get; set; }
    }

    public class StaffPlantelDto
    {
        [JsonPropertyName("idStaff")]
        public int IdStaff { get; set; }

        [JsonPropertyName("nombreCompleto")]
        public string NombreCompleto { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("rol")]
        public string Rol { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    public class AsignarStaffCategoriaDto
    {
        [JsonPropertyName("idStaff")]
        public int IdStaff { get; set; }
    }
}