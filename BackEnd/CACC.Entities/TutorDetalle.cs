namespace CACC.Entities
{
	public class TutorDetalle
	{
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
		public string Apellido { get; set; } = string.Empty;
		public string? Parentesco { get; set; }
		public string? Telefono { get; set; }
		public string? Email { get; set; }
	}
}