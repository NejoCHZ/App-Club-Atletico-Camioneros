using System.Net.Mail;
using Cacc.Api.Contracts;

namespace Cacc.Api.Validation;

public static class JugadorRequestValidator
{
    private static readonly HashSet<string> PosicionesValidas = new(StringComparer.OrdinalIgnoreCase)
    {
        "ARQUERO",
        "DEFENSOR",
        "VOLANTE",
        "DELANTERO"
    };

    public static Dictionary<string, string[]> Validar(GuardarJugadorRequest request, DateOnly hoy)
    {
        var errores = new Dictionary<string, List<string>>();

        Requerido(request.Dni, "dni", errores);
        Requerido(request.Nombre, "nombre", errores);
        Requerido(request.Apellido, "apellido", errores);
        Requerido(request.Categoria, "categoria", errores);
        Requerido(request.Posicion, "posicion", errores);

        if (!string.IsNullOrWhiteSpace(request.Posicion) &&
            !PosicionesValidas.Contains(request.Posicion.Trim()))
        {
            AgregarError(
                "posicion",
                "La posición debe ser ARQUERO, DEFENSOR, VOLANTE o DELANTERO.",
                errores);
        }

        var dni = NormalizarDni(request.Dni);
        if (dni.Length is < 7 or > 9)
        {
            AgregarError("dni", "El DNI debe contener entre 7 y 9 dígitos.", errores);
        }

        if (request.FechaNacimiento == default || request.FechaNacimiento > hoy)
        {
            AgregarError("fechaNacimiento", "La fecha de nacimiento debe ser una fecha real y no futura.", errores);
        }

        var requiereTutor = request.FechaNacimiento != default && CalcularEdad(request.FechaNacimiento, hoy) < 18;
        if (requiereTutor && request.Tutor is null)
        {
            AgregarError("tutor", "Los jugadores menores de 18 años deben informar un tutor completo.", errores);
        }
        else if (request.Tutor is not null)
        {
            ValidarTutor(request.Tutor, errores);
        }

        return errores.ToDictionary(par => par.Key, par => par.Value.ToArray());
    }

    public static string NormalizarDni(string? dni) =>
        string.Concat((dni ?? string.Empty).Where(char.IsAsciiDigit));

    public static string NormalizarPosicion(string? posicion) =>
        (posicion ?? string.Empty).Trim().ToUpperInvariant();

    public static int CalcularEdad(DateOnly fechaNacimiento, DateOnly hoy)
    {
        var edad = hoy.Year - fechaNacimiento.Year;
        if (fechaNacimiento > hoy.AddYears(-edad))
        {
            edad--;
        }

        return edad;
    }

    private static void ValidarTutor(TutorRequest tutor, Dictionary<string, List<string>> errores)
    {
        Requerido(tutor.Dni, "tutor.dni", errores);
        Requerido(tutor.Nombre, "tutor.nombre", errores);
        Requerido(tutor.Apellido, "tutor.apellido", errores);
        Requerido(tutor.Telefono, "tutor.telefono", errores);
        Requerido(tutor.Email, "tutor.email", errores);

        var dni = NormalizarDni(tutor.Dni);
        if (dni.Length is < 7 or > 9)
        {
            AgregarError("tutor.dni", "El DNI del tutor debe contener entre 7 y 9 dígitos.", errores);
        }

        if (!string.IsNullOrWhiteSpace(tutor.Email) && !MailAddress.TryCreate(tutor.Email, out _))
        {
            AgregarError("tutor.email", "El email del tutor no tiene un formato válido.", errores);
        }
    }

    private static void Requerido(
        string? valor,
        string campo,
        Dictionary<string, List<string>> errores)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            AgregarError(campo, "El campo es obligatorio.", errores);
        }
    }

    private static void AgregarError(
        string campo,
        string mensaje,
        Dictionary<string, List<string>> errores)
    {
        if (!errores.TryGetValue(campo, out var mensajes))
        {
            mensajes = [];
            errores[campo] = mensajes;
        }

        mensajes.Add(mensaje);
    }
}
