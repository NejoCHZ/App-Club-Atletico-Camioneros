namespace CACC.Entities
{
    // Qué pasó al borrar un jugador: se eliminó por completo (no tenía historial) o se lo dio de baja conservando todo.
    public enum ResultadoBajaJugador
    {
        NoEncontrado,
        DadoDeBaja,
        Eliminado,
        // Solo con EliminarSinHistorialAsync: el jugador tiene historial, asi que no se borro ni se dio de baja todavia
        // (la baja la registra el Administrativo; ver JugadoresController.EliminarJugador).
        RequiereBaja
    }
}
