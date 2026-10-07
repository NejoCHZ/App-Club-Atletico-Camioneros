namespace CACC.Entities;

public class CategoriaConConteo
{
    public int IdCategoria { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
    public string Asociacion { get; set; } = string.Empty;
    public int CantidadJugadores { get; set; }
    public int CantidadStaff { get; set; }
}

public class JugadorPlantel
{
    public int IdJugador { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string? PosicionCancha { get; set; }
    public string? FechaNacimiento { get; set; }
}

public class StaffPlantel
{
    public int IdStaff { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class JugadorAlta
{
    public string Dni { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateTime? FechaNacimiento { get; set; }
    public string? Categoria { get; set; }
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
    public string? Parentesco { get; set; }
}

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
    public string CategoriaAsignada { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

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

public class StaffEdicion : StaffAlta
{
    public int IdStaff { get; set; }
    public new string? ContraseniaHasheada { get; set; }
    public bool Activo { get; set; }
}

public class PartidoAlta
{
    public int IdCategoria { get; set; }
    public DateTime FechaPartido { get; set; }
    public string Rival { get; set; } = string.Empty;
    public string CondicionLocalia { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public List<JugadorMinutoAlta> JugadoresMinutos { get; set; } = new();
}

public class PartidoEdicion : PartidoAlta
{
    public int IdPartido { get; set; }
}

public class JugadorMinutoAlta
{
    public int IdJugador { get; set; }
    public int MinutosJugados { get; set; }
}
