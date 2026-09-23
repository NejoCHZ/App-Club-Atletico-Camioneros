namespace CACC.Entities
{
    public class Rol
    {
        public int IdRol { get; set; }
        public string NombreRol { get; set; } = string.Empty;
        public string? Permisos { get; set; }
    }
}