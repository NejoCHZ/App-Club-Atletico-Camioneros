using System.Text.Json.Serialization;

namespace CACC.API.DTOs;

public sealed class JugadorDatosMedicosUpdateDto : JugadorDatosFisicosUpdateDto
{
    [JsonPropertyName("grupoSanguineo")]
    public string? GrupoSanguineo { get; set; }

    [JsonPropertyName("antecedentesSalud")]
    public string? AntecedentesSalud { get; set; }

    [JsonPropertyName("historialLesiones")]
    public string? HistorialLesiones { get; set; }

    [JsonPropertyName("observaciones")]
    public string? Observaciones { get; set; }
}
