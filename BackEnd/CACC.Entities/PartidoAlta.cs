using System;
using System.Collections.Generic;

namespace CACC.Entities
{
    public class PartidoAlta
    {
        public int IdCategoria { get; set; }
        public DateTime FechaPartido { get; set; }
        public string Rival { get; set; } = string.Empty;
        public string CondicionLocalia { get; set; } = "Local";
        public string Resultado { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public List<JugadorMinutoAlta> JugadoresMinutos { get; set; } = new();
    }

    public class JugadorMinutoAlta
    {
        public int IdJugador { get; set; }
        public int MinutosJugados { get; set; }
    }
}