using Cacc.Entities;

namespace Cacc.Dao;

public sealed class JugadorRepository : IJugadorRepository
{
    private readonly Lock _sync = new();
    private readonly Dictionary<Guid, Jugador> _jugadores = [];

    public IReadOnlyCollection<Jugador> ObtenerTodos()
    {
        lock (_sync)
        {
            return _jugadores.Values.ToArray();
        }
    }

    public Jugador? ObtenerPorId(Guid id)
    {
        lock (_sync)
        {
            return _jugadores.GetValueOrDefault(id);
        }
    }

    public Jugador Agregar(Jugador jugador)
    {
        lock (_sync)
        {
            VerificarDniDisponible(jugador.Dni);
            _jugadores.Add(jugador.Id, jugador);
            return jugador;
        }
    }

    public bool Actualizar(Jugador jugador)
    {
        lock (_sync)
        {
            if (!_jugadores.ContainsKey(jugador.Id))
            {
                return false;
            }

            VerificarDniDisponible(jugador.Dni, jugador.Id);
            _jugadores[jugador.Id] = jugador;
            return true;
        }
    }

    public bool Eliminar(Guid id)
    {
        lock (_sync)
        {
            return _jugadores.Remove(id);
        }
    }

    private void VerificarDniDisponible(string dni, Guid? idExcluido = null)
    {
        if (_jugadores.Values.Any(jugador =>
                jugador.Id != idExcluido &&
                string.Equals(jugador.Dni, dni, StringComparison.OrdinalIgnoreCase)))
        {
            throw new DniDuplicadoException(dni);
        }
    }
}
