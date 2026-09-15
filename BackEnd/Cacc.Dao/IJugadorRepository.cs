using Cacc.Entities;

namespace Cacc.Dao;

public interface IJugadorRepository
{
    IReadOnlyCollection<Jugador> ObtenerTodos();
    Jugador? ObtenerPorId(Guid id);
    Jugador Agregar(Jugador jugador);
    bool Actualizar(Jugador jugador);
    bool Eliminar(Guid id);
}
