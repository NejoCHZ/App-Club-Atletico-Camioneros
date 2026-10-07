using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CACC.API.DTOs
{
    public class PartidoCreateDto
    {
        [JsonPropertyName("fechaPartido")]
        public string FechaPartido { get; set; } = string.Empty;

        [JsonPropertyName("rival")]
        public string Rival { get; set; } = string.Empty;

        [JsonPropertyName("condicionLocalia")]
        public string CondicionLocalia { get; set; } = "Local";

        [JsonPropertyName("resultado")]
        public string Resultado { get; set; } = string.Empty;

        [JsonPropertyName("observaciones")]
        public string? Observaciones { get; set; }

        [JsonPropertyName("jugadoresMinutos")]
        public List<JugadorMinutoDto> JugadoresMinutos { get; set; } = new();
    }

    public class JugadorMinutoDto
    {
        [JsonPropertyName("idJugador")]
        public int IdJugador { get; set; }

        [JsonPropertyName("minutosJugados")]
        public int MinutosJugados { get; set; }
    }

    public class PartidoResponseDto
    {
        [JsonPropertyName("idPartido")]
        public int IdPartido { get; set; }

        [JsonPropertyName("idCategoria")]
        public int IdCategoria { get; set; }

        [JsonPropertyName("categoria")]
        public string Categoria { get; set; } = string.Empty;

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
}