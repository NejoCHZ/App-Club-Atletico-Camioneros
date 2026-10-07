using System;
using System.Collections.Generic;

namespace CACC.Entities
{
    public class JugadorDetalle
    {
        public int IdJugador { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string? Genero { get; set; }
        public DateTime? FechaDeNacimiento { get; set; }
        public int IdCategoria { get; set; }
        public string? NombreCategoria { get; set; }
        public string? ClubOrigen { get; set; }
        public bool FichaMedicaLiga { get; set; }
        public string? PosicionCancha { get; set; }

        public decimal? Peso { get; set; }
        public decimal? Altura { get; set; }
        public string? PieHabil { get; set; }
        public string? Domicilio { get; set; }

        public FichaMedicaDetalle? FichaMedica { get; set; }
        public List<PartidoDetalle> Partidos { get; set; } = new List<PartidoDetalle>();
        public TutorDetalle? Tutor { get; set; }
        public string EstadoCuota { get; set; } = "AL DÍA";
    }

    public class FichaMedicaDetalle
    {
        public string? GrupoSanguineo { get; set; }
        public string? Patologias { get; set; }
        public string? HistorialLesiones { get; set; }
        public string? Observaciones { get; set; }
    }

    public class PartidoDetalle
    {
        public int IdPartido { get; set; }
        public int IdCategoria { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string Rival { get; set; } = string.Empty;
        public string Resultado { get; set; } = string.Empty;
        public string? Condicion { get; set; }
        public string? Observaciones { get; set; }
        public int Minutos { get; set; }
        public List<JugadorMinutoDetalle> JugadoresMinutos { get; set; } = new();
    }

    public class JugadorMinutoDetalle
    {
        public int IdJugador { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public int MinutosJugados { get; set; }
    }

    public class TutorDetalle
    {
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Parentesco { get; set; }
    }
}
