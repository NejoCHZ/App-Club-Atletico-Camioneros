using System;
using System.Collections.Generic;
using System.Linq;

namespace CACC.Entities
{
    public static class PartidoParticipationRules
    {
        public const int MaxMinutes = 120;

        public static string? Validate(IEnumerable<JugadorMinutoAlta>? participaciones)
        {
            if (participaciones == null) return null;

            var lista = participaciones.ToList();
            if (lista.Any(item => item.IdJugador <= 0))
                return "Todos los jugadores deben tener un identificador válido.";
            if (lista.GroupBy(item => item.IdJugador).Any(group => group.Count() > 1))
                return "Un jugador no puede aparecer más de una vez en el mismo partido.";
            if (lista.Any(item => item.MinutosJugados < 0 || item.MinutosJugados > MaxMinutes))
                return $"Los minutos jugados deben estar entre 0 y {MaxMinutes}.";

            return null;
        }
    }

    public sealed class ParticipacionPartidoDuplicadaException : InvalidOperationException
    {
        public ParticipacionPartidoDuplicadaException(Exception? innerException = null)
            : base("Un jugador no puede aparecer más de una vez en el mismo partido.", innerException)
        {
        }
    }

    public sealed class ParticipacionPartidoInvalidaException : InvalidOperationException
    {
        public ParticipacionPartidoInvalidaException(string message, Exception? innerException = null)
            : base(message, innerException)
        {
        }
    }

    public sealed class PartidoDuplicadoException : InvalidOperationException
    {
        public PartidoDuplicadoException()
            : base("Ya existe un partido para la misma categoría, fecha, rival y condición.")
        {
        }

        public PartidoDuplicadoException(Exception innerException)
            : base("Ya existe un partido para la misma categoría, fecha, rival y condición.", innerException)
        {
        }
    }

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
