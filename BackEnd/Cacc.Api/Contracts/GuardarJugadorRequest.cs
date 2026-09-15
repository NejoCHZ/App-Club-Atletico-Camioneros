using System.Text.Json.Serialization;

namespace Cacc.Api.Contracts;

public sealed record GuardarJugadorRequest(
    string? Dni,
    string? Nombre,
    string? Apellido,
    DateOnly FechaNacimiento,
    string? Categoria,
    [property: JsonRequired]
    string? Posicion,
    string? ClubOrigen,
    bool AptoFisico,
    TutorRequest? Tutor);

public sealed record TutorRequest(
    string? Dni,
    string? Nombre,
    string? Apellido,
    string? Telefono,
    string? Email);
