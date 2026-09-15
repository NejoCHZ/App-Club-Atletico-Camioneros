namespace Cacc.Entities;

public sealed record Jugador(
    Guid Id,
    string Dni,
    string Nombre,
    string Apellido,
    DateOnly FechaNacimiento,
    string Categoria,
    string Posicion,
    string? ClubOrigen,
    bool AptoFisico,
    Tutor? Tutor);
