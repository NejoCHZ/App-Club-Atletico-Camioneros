using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class JugadorResponseDto
    {
        [JsonPropertyName("idJugador")]
        public int IdJugador { get; set; }

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get; set; } = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("genero")]
        public string? Genero { get; set; }

        [JsonPropertyName("fechaDeNacimiento")]
        public DateTime? FechaDeNacimiento { get; set; }

        [JsonPropertyName("domicilio")]
        public string? Domicilio { get; set; }

        [JsonPropertyName("idCategoria")]
        public int IdCategoria { get; set; }

        [JsonPropertyName("nombreCategoria")]
        public string? NombreCategoria { get; set; }

        [JsonPropertyName("clubOrigen")]
        public string? ClubOrigen { get; set; }

        [JsonPropertyName("fichaMedicaLiga")]
        public bool FichaMedicaLiga { get; set; }

        [JsonPropertyName("posicionCancha")]
        public string? PosicionCancha { get; set; }

        [JsonPropertyName("peso")]
        public decimal? Peso { get; set; }

        [JsonPropertyName("altura")]
        public decimal? Altura { get; set; }

        [JsonPropertyName("pieHabil")]
        public string? PieHabil { get; set; }

        [JsonPropertyName("estadoCuota")]
        public string EstadoCuota { get; set; } = "AL DÍA";

        [JsonPropertyName("fichaMedica")]
        public FichaMedicaDto? FichaMedica { get; set; }

        [JsonPropertyName("partidos")]
        public List<PartidoDto> Partidos { get; set; } = new List<PartidoDto>();

        // Hace referencia a TutorDto definido en TutorDto.cs
        [JsonPropertyName("tutor")]
        public TutorDto? Tutor { get; set; }
    }

    public class PartidoDto
    {
        [JsonPropertyName("fecha")]
        public DateTime Fecha { get; set; }

        [JsonPropertyName("rival")]
        public string Rival { get; set; } = string.Empty;

        [JsonPropertyName("resultado")]
        public string Resultado { get; set; } = string.Empty;

        [JsonPropertyName("condicion")]
        public string? Condicion { get; set; }

        [JsonPropertyName("minutos")]
        public int Minutos { get; set; }
    }

    public class FichaMedicaDto
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
}