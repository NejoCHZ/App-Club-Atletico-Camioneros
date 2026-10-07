namespace CACC.Entities
{
    public class Persona
    {
        public int IdPersona { get; set; }
        public string? Genero { get; set; }
        public DateTime? FechaDeNacimiento { get; set; }
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
    }
}