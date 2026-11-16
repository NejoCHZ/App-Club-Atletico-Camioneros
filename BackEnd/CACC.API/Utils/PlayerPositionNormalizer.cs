namespace CACC.API.Utils;

public static class PlayerPositionNormalizer
{
    public static bool TryNormalize(string? value, out string? normalized)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            normalized = null;
            return true;
        }

        normalized = value.Trim().ToUpperInvariant() switch
        {
            "ARQUERO" => "Arquero",
            "DEFENSOR" => "Defensor",
            "MEDIOCAMPISTA" or "VOLANTE" => "Mediocampista",
            "DELANTERO" or "DELANTERA" => "Delantero",
            _ => null,
        };

        return normalized is not null;
    }
}
