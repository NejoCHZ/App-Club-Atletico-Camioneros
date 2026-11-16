using CACC.API.Utils;

namespace CACC.Tests;

public class PlayerPositionNormalizerTests
{
    [Theory]
    [InlineData("ARQUERO", "Arquero")]
    [InlineData("defensor", "Defensor")]
    [InlineData(" Mediocampista ", "Mediocampista")]
    [InlineData("VOLANTE", "Mediocampista")]
    [InlineData("Delantera", "Delantero")]
    public void TryNormalize_KnownValues_ReturnsCanonicalValue(string input, string expected)
    {
        var result = PlayerPositionNormalizer.TryNormalize(input, out var normalized);

        Assert.True(result);
        Assert.Equal(expected, normalized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryNormalize_EmptyValue_ReturnsNull(string? input)
    {
        var result = PlayerPositionNormalizer.TryNormalize(input, out var normalized);

        Assert.True(result);
        Assert.Null(normalized);
    }

    [Fact]
    public void TryNormalize_UnsupportedValue_ReturnsFalse()
    {
        var result = PlayerPositionNormalizer.TryNormalize("PRUEBA", out var normalized);

        Assert.False(result);
        Assert.Null(normalized);
    }
}
