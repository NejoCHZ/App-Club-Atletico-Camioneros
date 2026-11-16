using System.Text.Json.Serialization;

namespace CACC.API.DTOs;

public class JugadorDatosFisicosUpdateDto
{
    [JsonPropertyName("peso")]
    public decimal? Peso { get; set; }

    [JsonPropertyName("altura")]
    public decimal? Altura { get; set; }

    [JsonPropertyName("pieHabil")]
    public string? PieHabil { get; set; }
}
