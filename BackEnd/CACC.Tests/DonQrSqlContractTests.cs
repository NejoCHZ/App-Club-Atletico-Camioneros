using Xunit;
namespace CACC.Tests;
public class DonQrSqlContractTests {
 [Fact] public void SchemaAndDaoUsePlayerAndStaffForeignKeys(){
  var root=FindRepositoryRoot(); var schema=File.ReadAllText(Path.Combine(root,"BaseDatos-ClubCamioneros.sql")); var dao=ReadDao(root);
  Assert.Contains("[FK_id_jugador] [int] NULL",schema); Assert.Contains("[FK_id_staff] [int] NULL",schema); Assert.Contains("v.FK_id_jugador=j.PK_id_jugador",dao); Assert.Contains("INSERT INTO ASISTENCIAS(FK_id_jugador,FK_id_staff,fecha_hora,estado_acceso,observaciones)",dao); Assert.DoesNotContain("INSERT INTO ASISTENCIAS (FK_id_persona",dao);
 }
 [Fact] public void DaoSerializesResolutionAndSameDayIdempotency(){
  var dao=ReadDao(FindRepositoryRoot()); Assert.Contains("IsolationLevel.Serializable",dao); Assert.Contains("JUGADORES j WITH (UPDLOCK, HOLDLOCK)",dao); Assert.Contains("ASISTENCIAS WITH (UPDLOCK,HOLDLOCK)",dao); Assert.Contains("SELECT TOP(1) estado_acceso",dao); Assert.Contains("matches.Count != 1",dao); Assert.Contains("fecha_hora>=CONVERT(date,GETDATE())",dao); Assert.Contains("fecha_hora<DATEADD(day,1,CONVERT(date,GETDATE()))",dao); Assert.DoesNotContain("DATEADD(hour,-24",dao,StringComparison.OrdinalIgnoreCase); Assert.Contains("result.YaRegistrada",dao); Assert.Contains("transaction.RollbackAsync()",dao); Assert.Contains("await using var transaction",dao); Assert.Contains("catch",dao); Assert.Contains("await transaction.RollbackAsync()",dao);
 }
 [Fact] public void DaoPersistsPermittedAndDeniedAttemptsThroughOneParameterizedInsert(){
  var dao=ReadDao(FindRepositoryRoot()); Assert.Contains("cuotas < 2 ? \"PERMITIDO\" : \"DENEGADO\"",dao); Assert.Contains("VALUES(@IdJugador,@IdStaff,GETDATE(),@EstadoAcceso,@Observaciones)",dao); Assert.Contains("insertCommand.Parameters.Add(\"@EstadoAcceso\"",dao); Assert.Contains("insertCommand.Parameters.Add(\"@Observaciones\"",dao); Assert.DoesNotContain("if (cuotas < 2)",dao);
 }
 [Fact] public void DaoComposesProfessionalObservationFromAuthoritativeDebtAndConstrainedMethod(){
  var dao=ReadDao(FindRepositoryRoot()); Assert.Contains("Lectura de credencial QR",dao); Assert.Contains("Registro manual por DNI",dao); Assert.Contains("Posee 1 mes de deuda -",dao); Assert.Contains("Posee {cuotas} meses de deuda -",dao);
 }
 [Fact] public void HistoryQueryUsesParameterizedInclusiveDateBoundsAndNewestFirst(){
  var dao=ReadDao(FindRepositoryRoot()); Assert.Contains("FK_id_jugador = @IdJugador",dao); Assert.Contains("fecha_hora >= @Desde",dao); Assert.Contains("fecha_hora < @HastaExclusiva",dao); Assert.Contains("hasta.Value.Date.AddDays(1)",dao); Assert.Contains("estado_acceso = @Estado",dao); Assert.Contains("ORDER BY fecha_hora DESC, PK_id_asistencia DESC",dao); Assert.Contains("command.Parameters.Add(\"@Estado\"",dao);
 }
 private static string ReadDao(string root)=>File.ReadAllText(Path.Combine(root,"BackEnd","CACC.DAO","AsistenciaDao.cs"));
 private static string FindRepositoryRoot(){for(var d=new DirectoryInfo(AppContext.BaseDirectory);d is not null;d=d.Parent)if(File.Exists(Path.Combine(d.FullName,"BaseDatos-ClubCamioneros.sql")))return d.FullName;throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");}
}

