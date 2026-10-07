using System;
using System.Collections.Generic;

namespace CACC.Entities
{
    public class StaffDetalle
    {
        public int IdStaff { get; set; }
        public int IdUsuario { get; set; }
        public int IdPersona { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public DateTime? FechaDeNacimiento { get; set; }
        public string? Genero { get; set; }
        public string? Domicilio { get; set; }
        public string Email { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string Rol { get; set; } = string.Empty;
        public List<int> CategoriasIds { get; set; } = new();
        public string CategoriaAsignada { get; set; } = "Todas / General";
        public bool Activo { get; set; }
    }
}