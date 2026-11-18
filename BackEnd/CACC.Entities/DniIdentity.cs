namespace CACC.Entities;

public static class DniIdentity
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return string.Concat(value.Where(char.IsLetterOrDigit)).ToUpperInvariant();
    }

    public static bool AreSame(string? left, string? right)
    {
        var normalizedLeft = Normalize(left);
        return normalizedLeft.Length > 0 && normalizedLeft == Normalize(right);
    }
}

public sealed class TutorSelfReferenceException : InvalidOperationException
{
    public TutorSelfReferenceException()
        : base("El jugador no puede ser su propio tutor o responsable.")
    {
    }
}
