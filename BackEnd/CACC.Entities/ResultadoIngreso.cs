namespace CACC.Entities;
public class ResultadoIngreso {
 public bool PersonaEncontrada { get; set; }
 public bool AsistenciaRegistrada { get; set; }
 public bool YaRegistrada { get; set; }
 public string? Error { get; set; }
 public bool AccesoPermitido { get; set; }
 public string EstadoAcceso { get; set; } = string.Empty;
}
