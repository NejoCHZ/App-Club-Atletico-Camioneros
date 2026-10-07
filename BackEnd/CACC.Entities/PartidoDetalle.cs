using System;
using System.Collections.Generic;

namespace CACC.Entities
{
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
}