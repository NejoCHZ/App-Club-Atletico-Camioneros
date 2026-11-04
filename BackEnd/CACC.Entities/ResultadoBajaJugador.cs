namespace CACC.Entities
{
    // Qué pasó al borrar un jugador: se eliminó por completo (no tenía historial) o se lo dio de baja conservando todo.
    public enum ResultadoBajaJugador
    {
        NoEncontrado,
        DadoDeBaja,
        Eliminado
    }
}
