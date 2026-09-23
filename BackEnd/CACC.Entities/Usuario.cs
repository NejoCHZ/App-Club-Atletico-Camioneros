namespace CACC.Entities
{
	public class Usuario
	{
		public int IdUsuario { get; set; }
		public int IdPersona { get; set; }
		public int IdRol { get; set; }
		public string Email { get; set; } = string.Empty;
		public string Contrasenia { get; set; } = string.Empty;
		public bool Activo { get; set; }
	}
}