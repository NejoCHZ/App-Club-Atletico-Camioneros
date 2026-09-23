namespace CACC.Entities
{
    public class UsuarioAuthData
    {
        public int IdUsuario { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Contrasenia { get; set; } = string.Empty;
        public bool Activo { get; set; }
        public string NombreRol { get; set; } = string.Empty;
        public List<int> CategoriasAsignadas { get; set; } = new List<int>();
    }
}