using CACC.API.Controllers;
using CACC.API.DTOs;
using CACC.DAO;
using CACC.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CACC.Tests;

public sealed class StaffDuplicateProtectionTests
{
    [Fact]
    public async Task MapsExistingStaffIdentityToConflict()
    {
        var dao = new FakeStaffDao { ConflictOnCreate = true };

        var result = await new StaffController(dao).CrearStaff(ValidCreateDto());

        var conflict = Assert.IsType<ObjectResult>(result);
        Assert.Equal(409, conflict.StatusCode);
        Assert.Equal(1, dao.CreateCalls);
    }

    [Fact]
    public void DaoAndMigrationProtectStaffIdentityUnderConcurrency()
    {
        var root = FindRepositoryRoot();
        var dao = File.ReadAllText(Path.Combine(root, "BackEnd", "CACC.DAO", "StaffDao.cs"));
        var migration = File.ReadAllText(Path.Combine(root, "BackEnd", "scripts", "database", "003-enforce-unique-staff-identity.sql"));

        Assert.Contains("IsolationLevel.Serializable", dao);
        Assert.Contains("USUARIOS WITH (UPDLOCK, HOLDLOCK)", dao);
        Assert.Contains("FK_id_persona = @IdPersona", dao);
        Assert.Contains("email = @Email", dao);
        Assert.Contains("UX_USUARIOS_EMAIL", migration);
        Assert.Contains("UX_USUARIOS_PERSONA", migration);
        Assert.Contains("UX_STAFF_USUARIO", migration);
        Assert.Contains("HAVING COUNT(*) > 1", migration);
    }

    private static StaffCreateDto ValidCreateDto() => new()
    {
        Nombre = "Empleado",
        Apellido = "Duplicado",
        Dni = "99000003",
        Email = "staff.duplicado@example.test",
        Contrasenia = "Test.Password.2026!",
        Rol = "MÉDICO",
    };

    private static string FindRepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "BaseDatos-ClubCamioneros.sql")))
            {
                return directory.FullName;
            }
        }

        throw new DirectoryNotFoundException("No se encontró la raíz del repositorio.");
    }

    private sealed class FakeStaffDao : IStaffDao
    {
        public bool ConflictOnCreate { get; init; }
        public int CreateCalls { get; private set; }

        public Task<int> CrearAsync(StaffAlta staff)
        {
            CreateCalls++;
            if (ConflictOnCreate)
            {
                throw new StaffIdentityConflictException();
            }

            return Task.FromResult(10);
        }

        public Task<IEnumerable<Persona>> ObtenerStaffGeneralAsync() => Task.FromResult<IEnumerable<Persona>>([]);
        public Task<IEnumerable<StaffDetalle>> ObtenerTodosAsync(int? rolId = null) => Task.FromResult<IEnumerable<StaffDetalle>>([]);
        public Task<StaffDetalle?> ObtenerPorIdAsync(int idStaff) => Task.FromResult<StaffDetalle?>(null);
        public Task<bool> ActualizarAsync(StaffEdicion staff) => Task.FromResult(false);
        public Task<bool> DarDeBajaAsync(int idStaff) => Task.FromResult(false);
    }
}
