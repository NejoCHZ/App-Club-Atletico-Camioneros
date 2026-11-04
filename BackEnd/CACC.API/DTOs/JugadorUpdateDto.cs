using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class JugadorUpdateDto
    {
        [JsonPropertyName("nombre")]
        public string Nombre { get => _nombre; set => _nombre = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _nombre = string.Empty;

        [JsonPropertyName("apellido")]
        public string Apellido { get => _apellido; set => _apellido = CACC.Entities.NombresPropios.Normalizar(value); }
        private string _apellido = string.Empty;

        [JsonPropertyName("dni")]
        public string Dni { get; set; } = string.Empty;

        [JsonPropertyName("genero")]
        public string? Genero { get; set; }

        [JsonPropertyName("fechaNacimiento")]
        public DateTime? FechaDeNacimiento { get; set; }

        [JsonPropertyName("domicilio")]
        public string? Domicilio { get; set; }

        [JsonPropertyName("idCategoria")]
        public int IdCategoria { get; set; }

        [JsonPropertyName("clubOrigen")]
        public string? ClubOrigen { get; set; }

        [JsonPropertyName("posicion")]
        public string? Posicion { get; set; }

        [JsonPropertyName("peso")]
        public decimal? Peso { get; set; }

        [JsonPropertyName("altura")]
        public decimal? Altura { get; set; }

        [JsonPropertyName("pieHabil")]
        public string? PieHabil { get; set; }

        [JsonPropertyName("partidos")]
        public List<PartidoUpdateDto> Partidos { get; set; } = new List<PartidoUpdateDto>();
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
