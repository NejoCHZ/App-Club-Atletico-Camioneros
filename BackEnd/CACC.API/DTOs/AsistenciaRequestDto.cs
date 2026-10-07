namespace CACC.API.DTOs
{
    public class AsistenciaRequestDto
    {
        public string Dni { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
    }
}