namespace CACC.Entities
{
    public class StaffPlantel
    {
        public int IdStaff { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}