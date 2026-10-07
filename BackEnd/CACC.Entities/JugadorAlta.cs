namespace CACC.Entities
{
    public class JugadorAlta
    {
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public DateTime? FechaNacimiento { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string? Posicion { get; set; }
        public string? ClubOrigen { get; set; }
        public bool AptoFisico { get; set; }
        public TutorAlta? Tutor { get; set; }
    }

    public class TutorAlta
    {
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Email { get; set; }

        // Agregá esta línea:
        public string? Parentesco { get; set; }
    }
}