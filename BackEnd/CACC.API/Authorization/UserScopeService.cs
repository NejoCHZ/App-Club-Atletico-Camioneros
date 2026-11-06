using Microsoft.Data.SqlClient;
using System.Security.Claims;

namespace CACC.API.Authorization;

public sealed class UserScopeService : IUserScopeService
{
    private readonly string _connectionString;

    public UserScopeService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Cadena de conexión no configurada.");
    }

    public int? GetRoleId(ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue("id_rol"), out var id) ? id : null;

    public IReadOnlySet<int> GetAssignedCategoryIds(ClaimsPrincipal user) => user
        .FindAll("id_categoria")
        .Select(c => int.TryParse(c.Value, out var id) ? id : 0)
        .Where(id => id > 0)
        .ToHashSet();

    public Task<bool> CanReadCategoryAsync(ClaimsPrincipal user, int categoryId)
    {
        var roleId = GetRoleId(user);
        if (roleId is 1 or 3 or 7) return Task.FromResult(true);
        if (roleId is not (4 or 6)) return Task.FromResult(false);
        return Task.FromResult(GetAssignedCategoryIds(user).Contains(categoryId));
    }

    public async Task<bool> CanReadPlayerAsync(ClaimsPrincipal user, int playerId)
    {
        var roleId = GetRoleId(user);
        if (roleId is 1 or 3 or 5 or 7) return true;
        if (roleId is not (4 or 6)) return false;

        var categories = GetAssignedCategoryIds(user);
        if (categories.Count == 0) return false;

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        var parameters = categories.Select((_, index) => $"@category{index}").ToArray();
        var query = $@"
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM JUGADORES_CATEGORIAS
                WHERE FK_id_jugador = @playerId
                AND FK_id_categoria IN ({string.Join(",", parameters)})
            ) OR EXISTS (
                SELECT 1 FROM JUGADORES
                WHERE PK_id_jugador = @playerId
                AND FK_id_categoria IN ({string.Join(",", parameters)})
            ) THEN 1 ELSE 0 END;";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@playerId", playerId);
        foreach (var item in categories.Select((value, index) => (value, index)))
            command.Parameters.AddWithValue($"@category{item.index}", item.value);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) == 1;
    }
}
