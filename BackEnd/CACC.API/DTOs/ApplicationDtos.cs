namespace CACC.API.DTOs;

public class TutorDto
{
    public string Dni { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Parentesco { get; set; }
}

public class JugadorCreateDto
{
    public string Dni { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateTime? FechaNacimiento { get; set; }
    public string? Categoria { get; set; }
    public string? Posicion { get; set; }
    public string? ClubOrigen { get; set; }
    public bool AptoFisico { get; set; }
    public TutorDto? Tutor { get; set; }
}

public class CategoriaCreateUpdateDto
{
    public string NombreCategoria { get; set; } = string.Empty;
    public string Asociacion { get; set; } = string.Empty;
}

public class AsignarJugadorCategoriaDto
{
    public int IdJugador { get; set; }
}

public class AsignarStaffCategoriaDto
{
    public int IdStaff { get; set; }
}

public class PartidoCreateDto
{
    public string FechaPartido { get; set; } = string.Empty;
    public string Rival { get; set; } = string.Empty;
    public string CondicionLocalia { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public List<JugadorMinutoDto> JugadoresMinutos { get; set; } = new();
}

public class JugadorMinutoDto
{
    public int IdJugador { get; set; }
    public int MinutosJugados { get; set; }
}

public class StaffCreateDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string? FechaNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? Domicilio { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Contrasenia { get; set; } = string.Empty;
    public int? IdRol { get; set; }
    public string? Rol { get; set; }
    public int? IdCategoria { get; set; }
    public List<int> CategoriasIds { get; set; } = new();
}

public class StaffUpdateDto : StaffCreateDto
{
    public bool Activo { get; set; }
}

public class CategoriaResponseDto
{
    public int IdCategoria { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
    public string Asociacion { get; set; } = string.Empty;
    public int CantidadJugadores { get; set; }
    public int CantidadStaff { get; set; }
}

public class JugadorPlantelDto
{
    public int IdJugador { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string? PosicionCancha { get; set; }
    public string? FechaNacimiento { get; set; }
}

public class StaffPlantelDto
{
    public int IdStaff { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class PartidoResponseDto
{
    public int IdPartido { get; set; }
    public int IdCategoria { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Rival { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public string? Condicion { get; set; }
}

public class StaffResponseDto
{
    public int IdStaff { get; set; }
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public DateTime? FechaDeNacimiento { get; set; }
    public string? Domicilio { get; set; }
    public string Email { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public string Rol { get; set; } = string.Empty;
    public List<int> CategoriasIds { get; set; } = new();
    public string CategoriaAsignada { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class GuardarTutorDto
{
    public string Dni { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Parentesco { get; set; }
}
