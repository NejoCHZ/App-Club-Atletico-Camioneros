using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace CACC.DAO
{
    public class UsuarioDao : IUsuarioDao
    {
        private readonly string _connectionString;

        public UsuarioDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        // Vuelve a recibir solo el email (coincidiendo con tu IUsuarioDao)
        public async Task<UsuarioAuthData?> ObtenerUsuarioParaAuthAsync(string email)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Quitamos la condición de la contraseña de la query SQL
            var queryUsuario = @"
                SELECT u.PK_id_usuario, u.FK_id_persona, u.email, u.contrasenia, u.activo, r.nombre_rol 
                FROM USUARIOS u
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                WHERE u.email = @Email AND u.activo = 1";

            UsuarioAuthData? authData = null;

            using (var command = new SqlCommand(queryUsuario, connection))
            {
                command.Parameters.AddWithValue("@Email", email);

                using var reader = await command.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    authData = new UsuarioAuthData
                    {
                        IdUsuario = reader.GetInt32(reader.GetOrdinal("PK_id_usuario")),
                        Email = reader.GetString(reader.GetOrdinal("email")),
                        Contrasenia = reader.GetString(reader.GetOrdinal("contrasenia")),
                        Activo = reader.GetBoolean(reader.GetOrdinal("activo")),
                        NombreRol = reader.GetString(reader.GetOrdinal("nombre_rol"))
                    };
                }
            }

            if (authData != null)
            {
                var queryCategorias = @"
                    SELECT sc.FK_id_categoria
                    FROM STAFF s
                    INNER JOIN STAFF_CATEGORIAS sc ON s.PK_id_staff = sc.FK_id_staff
                    WHERE s.FK_id_usuario = @IdUsuario";

                using var commandCat = new SqlCommand(queryCategorias, connection);
                commandCat.Parameters.AddWithValue("@IdUsuario", authData.IdUsuario);

                using var readerCat = await commandCat.ExecuteReaderAsync();
                while (await readerCat.ReadAsync())
                {
                    authData.CategoriasAsignadas.Add(readerCat.GetInt32(readerCat.GetOrdinal("FK_id_categoria")));
                }
            }

            return authData;
        }
    }
}