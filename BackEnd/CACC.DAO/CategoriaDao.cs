using CACC.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace CACC.DAO
{
    public class CategoriaDao : ICategoriaDao
    {
        private readonly string _connectionString;

        public CategoriaDao(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string no configurado.");
        }

        public async Task<IEnumerable<Categoria>> ObtenerTodasAsync()
        {
            var categorias = new List<Categoria>();
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = "SELECT PK_id_categoria, nombre_categoria FROM CATEGORIAS";
            using var command = new SqlCommand(query, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                categorias.Add(new Categoria
                {
                    IdCategoria = reader.GetInt32(reader.GetOrdinal("PK_id_categoria")),
                    NombreCategoria = reader.GetString(reader.GetOrdinal("nombre_categoria"))
                });
            }

            return categorias;
        }
    }
}