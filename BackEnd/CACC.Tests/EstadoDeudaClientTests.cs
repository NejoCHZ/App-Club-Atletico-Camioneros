using System.Net;
using System.Text;
using CACC.API.Services;
using CACC.DAO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
namespace CACC.Tests;

public class EstadoDeudaClientTests
{
    private const string Habilitado = "{\"dni\":\"40111222\",\"idJugador\":7,\"estado\":\"habilitado\",\"accesoPermitido\":true,\"fechaBaja\":null}";

    private static EstadoDeudaClient Cliente(Func<HttpRequestMessage, HttpResponseMessage> responder, out Manejador manejador, string? token = "token-del-usuario")
    {
        manejador = new Manejador(responder);
        var contexto = new DefaultHttpContext();
        if (token is not null) contexto.Request.Headers.Authorization = "Bearer " + token;
        return new EstadoDeudaClient(
            new HttpClient(manejador) { BaseAddress = new Uri("http://administrativo.test/") },
            new HttpContextAccessor { HttpContext = contexto },
            NullLogger<EstadoDeudaClient>.Instance);
    }

    private static HttpResponseMessage Json(HttpStatusCode codigo, string cuerpo) =>
        new(codigo) { Content = new StringContent(cuerpo, Encoding.UTF8, "application/json") };

    [Fact]
    public async Task ConsultaPorDni_ReenviaElTokenDelUsuarioYLeeElEstado()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, Habilitado), out var manejador);

        var consulta = await cliente.PorDniAsync("40111222");

        Assert.Equal(ResultadoConsulta.Ok, consulta.Resultado);
        Assert.Equal("habilitado", consulta.Estado!.Estado);
        Assert.True(consulta.Estado.AccesoPermitido);
        Assert.Equal(7, consulta.Estado.IdJugador);
        Assert.Equal("Bearer token-del-usuario", manejador.Pedidos[0].Headers.Authorization!.ToString());
        Assert.Equal("/api/integracion/v1/estado-deuda/dni/40111222", manejador.Pedidos[0].RequestUri!.AbsolutePath);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest, ResultadoConsulta.DniInvalido)]
    [InlineData(HttpStatusCode.Conflict, ResultadoConsulta.Ambiguo)]
    [InlineData(HttpStatusCode.Unauthorized, ResultadoConsulta.SinPermiso)]
    [InlineData(HttpStatusCode.Forbidden, ResultadoConsulta.SinPermiso)]
    [InlineData(HttpStatusCode.InternalServerError, ResultadoConsulta.NoResponde)]
    [InlineData(HttpStatusCode.BadGateway, ResultadoConsulta.NoResponde)]
    public async Task LosCodigosDelAdministrativoSeTraducen(HttpStatusCode codigo, ResultadoConsulta esperado)
    {
        var cliente = Cliente(_ => Json(codigo, "{}"), out _);
        Assert.Equal(esperado, (await cliente.PorDniAsync("40111222")).Resultado);
    }

    [Fact]
    public async Task UnDniQueNoEsDeUnJugador_LlegaComo404ConMensaje()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.NotFound, "{\"exito\":false,\"mensaje\":\"El DNI no pertenece a un jugador.\"}"), out _);
        Assert.Equal(ResultadoConsulta.NoEsJugador, (await cliente.PorDniAsync("40111222")).Resultado);
    }

    // Una ruta que no existe (Administrativo de una versión anterior) también es 404, pero sin mensaje: no es "no es un jugador".
    [Theory]
    [InlineData("")]
    [InlineData("{}")]
    [InlineData("<html>Not Found</html>")]
    public async Task UnDosCuatrocientosCuatroSinMensaje_EsUnProblemaDeConfiguracion(string cuerpo)
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.NotFound, cuerpo), out _);
        var consulta = await cliente.PorDniAsync("40111222");
        Assert.Equal(ResultadoConsulta.NoResponde, consulta.Resultado);
        Assert.Equal(404, consulta.CodigoHttp);
    }

    // ===== Cargos de alta (opción A): el Deportivo avisa al Administrativo después de dar de alta a un jugador =====

    [Fact]
    public async Task CargosDeAlta_PideLosCargosConElTokenDelUsuario_YLeeQueSeGeneraron()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, "{\"idJugador\":42,\"inscripcionGenerada\":true,\"cuotaGenerada\":false}"), out var manejador);

        var resultado = await cliente.GenerarCargosDeAltaAsync(42);

        Assert.Equal(EstadoCargosAlta.Generados, resultado.Estado);
        Assert.True(resultado.Inscripcion);
        Assert.False(resultado.Cuota);
        Assert.Equal(HttpMethod.Post, manejador.Pedidos[0].Method);
        Assert.Equal("/api/integracion/v1/jugadores/42/cargos-alta", manejador.Pedidos[0].RequestUri!.AbsolutePath);
        Assert.Equal("Bearer token-del-usuario", manejador.Pedidos[0].Headers.Authorization!.ToString());
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound, "{\"exito\":false,\"mensaje\":\"No existe el jugador 42.\"}", "No existe el jugador 42.")]
    [InlineData(HttpStatusCode.UnprocessableEntity, "{\"exito\":false,\"mensaje\":\"El jugador está dado de baja.\"}", "El jugador está dado de baja.")]
    [InlineData(HttpStatusCode.BadRequest, "{\"exito\":false,\"mensaje\":\"Indicá un jugador válido.\"}", "Indicá un jugador válido.")]
    public async Task CargosDeAlta_UnaRespuestaQueDiceQueNoCorresponde_EsRechazada(HttpStatusCode codigo, string cuerpo, string motivo)
    {
        var resultado = await Cliente(_ => Json(codigo, cuerpo), out _).GenerarCargosDeAltaAsync(42);

        Assert.Equal(EstadoCargosAlta.Rechazado, resultado.Estado);
        Assert.Equal(motivo, resultado.Motivo);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    public async Task CargosDeAlta_SinPermisoEnElAdministrativo_EsRechazada(HttpStatusCode codigo)
    {
        var resultado = await Cliente(_ => Json(codigo, ""), out _).GenerarCargosDeAltaAsync(42);

        Assert.Equal(EstadoCargosAlta.Rechazado, resultado.Estado);
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound, "")]
    [InlineData(HttpStatusCode.NotFound, "{}")]
    [InlineData(HttpStatusCode.InternalServerError, "{}")]
    [InlineData(HttpStatusCode.BadGateway, "no es json")]
    public async Task CargosDeAlta_UnErrorDelServidorOUnaRutaInexistente_CuentaComoNoResponde(HttpStatusCode codigo, string cuerpo)
    {
        var resultado = await Cliente(_ => Json(codigo, cuerpo), out _).GenerarCargosDeAltaAsync(42);

        Assert.Equal(EstadoCargosAlta.NoResponde, resultado.Estado);
    }

    [Fact]
    public async Task CargosDeAlta_SiLaConexionFalla_NoLanzaYCuentaComoNoResponde()
    {
        var cliente = Cliente(_ => throw new HttpRequestException("sin conexión"), out _);

        Assert.Equal(EstadoCargosAlta.NoResponde, (await cliente.GenerarCargosDeAltaAsync(42)).Estado);
    }

    [Fact]
    public async Task SiLaConexionFalla_ContaComoNoResponde()
    {
        var cliente = Cliente(_ => throw new HttpRequestException("sin conexión"), out _);
        Assert.Equal(ResultadoConsulta.NoResponde, (await cliente.PorDniAsync("40111222")).Resultado);
    }

    [Fact]
    public async Task SiElTiempoSeAgota_ContaComoNoResponde()
    {
        var cliente = Cliente(_ => throw new TaskCanceledException("timeout"), out _);
        Assert.Equal(ResultadoConsulta.NoResponde, (await cliente.PorDniAsync("40111222")).Resultado);
    }

    [Fact]
    public async Task UnaRespuestaIlegible_ContaComoNoResponde()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, "esto no es json"), out _);
        Assert.Equal(ResultadoConsulta.NoResponde, (await cliente.PorDniAsync("40111222")).Resultado);
    }

    [Fact]
    public async Task UnaCancelacionPedidaPorQuienLlama_SePropaga()
    {
        var cliente = Cliente(_ => throw new TaskCanceledException("cancelado"), out _);
        using var cancelacion = new CancellationTokenSource();
        cancelacion.Cancel();
        await Assert.ThrowsAsync<TaskCanceledException>(() => cliente.PorDniAsync("40111222", cancelacion.Token));
    }

    [Fact]
    public async Task ElLoteSeArmaPorDniYDevuelveSoloLosJugadores()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, "{\"items\":[" + Habilitado + "],\"noEncontrados\":[\"1\"]}"), out var manejador);

        var lote = await cliente.PorLoteAsync(new[] { "40111222", "40111222", "1" });

        Assert.NotNull(lote);
        Assert.Single(lote!);
        Assert.Equal("habilitado", lote["40111222"].Estado);
        Assert.Single(manejador.Pedidos);
        Assert.Equal("/api/integracion/v1/estado-deuda/lote", manejador.Pedidos[0].RequestUri!.AbsolutePath);
        Assert.Contains("\"dnis\":[\"40111222\",\"1\"]", manejador.Cuerpos[0]);
    }

    [Fact]
    public async Task ElLoteSeParteEnTandasDe500()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, "{\"items\":[]}"), out var manejador);

        await cliente.PorLoteAsync(Enumerable.Range(10000000, 1200).Select(n => n.ToString()));

        Assert.Equal(3, manejador.Pedidos.Count);
    }

    [Fact]
    public async Task SiElLoteFalla_SeDevuelveNull()
    {
        Assert.Null(await Cliente(_ => Json(HttpStatusCode.ServiceUnavailable, "{}"), out _).PorLoteAsync(new[] { "40111222" }));
        Assert.Null(await Cliente(_ => throw new HttpRequestException("caído"), out _).PorLoteAsync(new[] { "40111222" }));
    }

    [Fact]
    public async Task UnLoteVacio_NoLlamaAlAdministrativo()
    {
        var cliente = Cliente(_ => Json(HttpStatusCode.OK, "{}"), out var manejador);
        var lote = await cliente.PorLoteAsync(Array.Empty<string>());
        Assert.Empty(lote!);
        Assert.Empty(manejador.Pedidos);
    }

    [Theory]
    [InlineData("habilitado", "AL DÍA")]
    [InlineData("solo_entrenamientos", "SOLO ENTRENAMIENTOS")]
    [InlineData("inhabilitado", "INHABILITADO")]
    [InlineData("baja", "BAJA")]
    public void ElTextoDeCuotaSigueAlEstadoDelAdministrativo(string estado, string texto) =>
        Assert.Equal(texto, EstadoCuotaTexto.De(new CACC.Entities.EstadoDeudaAdministrativo { Estado = estado }));

    [Fact]
    public void SinDatosDelAdministrativo_ElTextoEsSinVerificar() =>
        Assert.Equal("SIN VERIFICAR", EstadoCuotaTexto.De(null));

    [Fact]
    public async Task ElUsuarioDeLaAuditoriaViajaPorLasLlamadasAsincronicas()
    {
        ContextoAuditoria.IdUsuario = 42;
        await Task.Yield();
        Assert.Equal(42, ContextoAuditoria.IdUsuario);
        ContextoAuditoria.IdUsuario = null;
    }

    [Theory]
    [InlineData("Permitir", true)]
    [InlineData(" permitir ", true)]
    [InlineData("", false)]
    [InlineData("Denegar", false)]
    [InlineData("cualquier cosa", false)]
    public void SoloPermiteSiSeConfiguraExplicitamente(string valor, bool permite) =>
        Assert.Equal(permite, new AdministrativoApiOptions { SiNoResponde = valor }.PermiteSiNoResponde);

    [Fact]
    public void PorDefectoNoPasaNadieSiNoResponde() =>
        Assert.False(new AdministrativoApiOptions().PermiteSiNoResponde);

    public sealed class Manejador(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        public List<HttpRequestMessage> Pedidos { get; } = new();
        public List<string> Cuerpos { get; } = new();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Pedidos.Add(request);
            Cuerpos.Add(request.Content is null ? "" : await request.Content.ReadAsStringAsync(cancellationToken));
            return responder(request);
        }
    }
}
