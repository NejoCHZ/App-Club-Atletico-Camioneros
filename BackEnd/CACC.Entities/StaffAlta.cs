using System;
using System.Collections.Generic;

namespace CACC.Entities
{
    public class StaffAlta
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public DateTime? FechaNacimiento { get; set; }
        public string? Genero { get; set; }
        public string? Domicilio { get; set; }
        public string Email { get; set; } = string.Empty;
        public string ContraseniaHasheada { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public int? IdCategoria { get; set; } 
        public List<int> CategoriasIds { get; set; } = new();
    }
}