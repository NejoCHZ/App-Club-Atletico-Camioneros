using System.Text.Json;
using CACC.API.DTOs;
using CACC.Entities;
using Xunit;
namespace CACC.Tests;

// Nombres y apellidos se guardan igual sin importar cómo se tipearon. La regla es la misma que usa el Portal Administrativo
// (la base es una sola).
public class NombresPropiosTests
{
    [Theory]
    [InlineData("JUAN CARLOS", "Juan Carlos")]
    [InlineData("juan carlos", "Juan Carlos")]
    [InlineData("jUaN cArLoS", "Juan Carlos")]
    [InlineData("  PEREZ   GOMEZ  ", "Perez Gomez")]
    [InlineData("MARÍA DE LOS ÁNGELES", "María de los Ángeles")]
    [InlineData("DE LA FUENTE", "De la Fuente")]
    [InlineData("PÉREZ-GÓMEZ", "Pérez-Gómez")]
    [InlineData("d'angelo", "D'Angelo")]
    [InlineData("MCDONALD", "McDonald")]
    [InlineData("PÉREZ-MCDONALD", "Pérez-McDonald")]
    [InlineData("mcdonald-mcgregor", "McDonald-McGregor")]
    [InlineData("ñandú NÚÑEZ", "Ñandú Núñez")]
    public void Deja_la_primera_letra_de_cada_palabra_en_mayuscula(string escrito, string esperado)
        => Assert.Equal(esperado, NombresPropios.Normalizar(escrito));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Un_valor_vacio_queda_vacio(string? escrito)
        => Assert.Equal(string.Empty, NombresPropios.Normalizar(escrito));

    [Fact]
    public void Es_idempotente()
    {
        string una = NombresPropios.Normalizar("MARÍA DE LOS ÁNGELES MCDONALD-PÉREZ");
        Assert.Equal(una, NombresPropios.Normalizar(una));
    }

    [Fact]
    public void El_alta_de_un_jugador_normaliza_nombre_apellido_y_tutor()
    {
        var dto = JsonSerializer.Deserialize<JugadorCreateDto>(
            "{\"nombre\":\"JUAN PABLO\",\"apellido\":\"GÓMEZ\",\"tutor\":{\"nombre\":\"MARTA\",\"apellido\":\"DE LA ROSA\"}}")!;

        Assert.Equal("Juan Pablo", dto.Nombre);
        Assert.Equal("Gómez", dto.Apellido);
        Assert.Equal("Marta", dto.Tutor!.Nombre);
        Assert.Equal("De la Rosa", dto.Tutor.Apellido);
    }

    [Fact]
    public void La_edicion_de_un_jugador_normaliza()
    {
        var dto = JsonSerializer.Deserialize<JugadorUpdateDto>("{\"nombre\":\"ANA\",\"apellido\":\"LÓPEZ\"}")!;

        Assert.Equal("Ana", dto.Nombre);
        Assert.Equal("López", dto.Apellido);
    }

    [Fact]
    public void El_alta_y_la_edicion_de_personal_normalizan()
    {
        var alta = JsonSerializer.Deserialize<StaffCreateDto>("{\"nombre\":\"LUIS\",\"apellido\":\"MCDONALD\"}")!;
        var edicion = JsonSerializer.Deserialize<StaffUpdateDto>("{\"nombre\":\"LUIS\",\"apellido\":\"MCDONALD\"}")!;

        Assert.Equal("Luis", alta.Nombre);
        Assert.Equal("McDonald", alta.Apellido);
        Assert.Equal("Luis", edicion.Nombre);
        Assert.Equal("McDonald", edicion.Apellido);
    }

    [Fact]
    public void El_tutor_que_se_guarda_aparte_normaliza()
    {
        var dto = JsonSerializer.Deserialize<GuardarTutorDto>("{\"nombre\":\"PEDRO\",\"apellido\":\"SOSA\"}")!;

        Assert.Equal("Pedro", dto.Nombre);
        Assert.Equal("Sosa", dto.Apellido);
    }
}
