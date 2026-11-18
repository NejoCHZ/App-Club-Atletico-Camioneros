using System.Text.Json.Serialization;

namespace CACC.API.DTOs;

public sealed class AsistenciaResponseDto
{
    [JsonPropertyName("idAsistencia")]
    public int IdAsistencia { get; init; }

    [JsonPropertyName("idJugador")]
    public int? IdJugador { get; init; }

    [JsonPropertyName("idStaff")]
    public int? IdStaff { get; init; }

    [JsonPropertyName("fechaHora")]
    public DateTime FechaHora { get; init; }

    [JsonPropertyName("estadoAcceso")]
    public string EstadoAcceso { get; init; } = string.Empty;

    [JsonPropertyName("observaciones")]
    public string? Observaciones { get; init; }
}

public static class EstadosRegistroAsistencia
{
    public const string Registrada = "REGISTRADA";
    public const string YaRegistrada = "YA_REGISTRADA";
}

public sealed class IngresoAsistenciaResponseDto
{
    [JsonPropertyName("accesoPermitido")]
    public bool AccesoPermitido { get; init; }

    [JsonPropertyName("estadoAcceso")]
    public string EstadoAcceso { get; init; } = string.Empty;

    [JsonPropertyName("estadoRegistro")]
    public string EstadoRegistro { get; init; } = string.Empty;

    [JsonPropertyName("asistenciaRegistrada")]
    public bool AsistenciaRegistrada { get; init; }

    [JsonPropertyName("yaRegistrada")]
    public bool YaRegistrada { get; init; }

    [JsonPropertyName("mensaje")]
    public string Mensaje { get; init; } = string.Empty;

    [JsonPropertyName("deudaTotal")]
    public decimal DeudaTotal { get; init; }

    [JsonPropertyName("cuotasVencidas")]
    public int CuotasVencidas { get; init; }
}
