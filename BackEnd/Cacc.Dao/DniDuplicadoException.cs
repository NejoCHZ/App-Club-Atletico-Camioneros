namespace Cacc.Dao;

public sealed class DniDuplicadoException(string dni)
    : InvalidOperationException($"Ya existe un jugador con el DNI {dni}.");
