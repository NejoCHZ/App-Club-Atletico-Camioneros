using Xunit;
namespace CACC.Tests;

// Contrato del DAO del QR con la base unificada (se comprueba contra el texto del DAO porque no hay base en estas pruebas).
public class DonQrSqlContractTests
{
    [Fact]
    public void ElDaoRegistraLaAsistenciaDeUnJugadorActivoYNoCalculaLaDeuda()
    {
        var dao = ReadDao(FindBackEnd());
        Assert.Contains("INSERT INTO ASISTENCIAS(FK_id_jugador,fecha_hora,estado_acceso,observaciones)", dao);
        Assert.DoesNotContain("INSERT INTO ASISTENCIAS (FK_id_persona", dao);
        // Las bajas no pasan y la deuda la informa el Portal Administrativo: el DAO no la lee ni la vista puente ni nada parecido.
        Assert.Contains("j.activo=1", dao);
        Assert.DoesNotContain("VISTA_ESTADO_DEUDA", dao);
        Assert.DoesNotContain("PAGOS", dao);
    }

    [Fact]
    public void ElDaoSerializaLaResolucionYLaIdempotenciaDelMismoDia()
    {
        var dao = ReadDao(FindBackEnd());
        Assert.Contains("IsolationLevel.Serializable", dao);
        Assert.Contains("JUGADORES j WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("ASISTENCIAS WITH (UPDLOCK,HOLDLOCK)", dao);
        Assert.Contains("ids.Count != 1", dao);
        Assert.Contains("fecha_hora>=CONVERT(date,GETDATE())", dao);
        Assert.Contains("result.YaRegistrada", dao);
        Assert.Contains("await using var transaction", dao);
        Assert.Contains("await transaction.RollbackAsync()", dao);
    }

    [Fact]
    public void TodasLasConexionesDeLosDaoSeAbrenConAuditoria()
    {
        var carpeta = Path.Combine(FindBackEnd(), "CACC.DAO");
        foreach (var archivo in Directory.GetFiles(carpeta, "*.cs"))
        {
            if (Path.GetFileName(archivo) == "ConexionAuditada.cs") continue;
            var texto = File.ReadAllText(archivo);
            // Abrir con OpenAsync a secas dejaría las escrituras sin responsable en la auditoría.
            Assert.False(texto.Contains("connection.OpenAsync(") || texto.Contains("connection.Open("),
                $"{Path.GetFileName(archivo)} abre una conexión sin OpenAuditadaAsync.");
        }
    }

    private static string ReadDao(string root) => File.ReadAllText(Path.Combine(root, "CACC.DAO", "AsistenciaDao.cs"));

    private static string FindBackEnd()
    {
        for (var d = new DirectoryInfo(AppContext.BaseDirectory); d is not null; d = d.Parent)
        {
            if (File.Exists(Path.Combine(d.FullName, "CACC.slnx"))) return d.FullName;
            if (File.Exists(Path.Combine(d.FullName, "BackEnd", "CACC.slnx"))) return Path.Combine(d.FullName, "BackEnd");
        }
        throw new DirectoryNotFoundException("No se encontró la carpeta BackEnd.");
    }
}
