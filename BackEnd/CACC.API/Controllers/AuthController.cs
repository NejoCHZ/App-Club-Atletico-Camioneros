using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CACC.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Cadena de conexión no configurada.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "El usuario y la contraseña son obligatorios." });
            }

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string query = @"
                SELECT 
                    u.PK_id_usuario,
                    u.email,
                    u.contrasenia,
                    u.FK_id_rol,
                    r.nombre_rol,
                    p.nombre,
                    p.apellido,
                    sc.FK_id_categoria
                FROM USUARIOS u
                INNER JOIN ROLES r ON u.FK_id_rol = r.PK_id_rol
                INNER JOIN PERSONAS p ON u.FK_id_persona = p.PK_id_persona
                LEFT JOIN STAFF s ON u.PK_id_usuario = s.FK_id_usuario
                LEFT JOIN STAFF_CATEGORIAS sc ON s.PK_id_staff = sc.FK_id_staff
                WHERE u.email = @Email AND u.activo = 1;";

            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Email", dto.Email.Trim());

            using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return Unauthorized(new { message = "Credenciales incorrectas o usuario inactivo." });
            }

            int idUsuario = reader.GetInt32(reader.GetOrdinal("PK_id_usuario"));
            string email = reader.GetString(reader.GetOrdinal("email"));
            string hashBd = reader.GetString(reader.GetOrdinal("contrasenia"));
            int idRol = reader.GetInt32(reader.GetOrdinal("FK_id_rol"));
            string nombreRol = reader.GetString(reader.GetOrdinal("nombre_rol"));
            string nombre = reader.IsDBNull(reader.GetOrdinal("nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("nombre"));
            string apellido = reader.IsDBNull(reader.GetOrdinal("apellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("apellido"));
            int? idCategoriaAsignada = reader.IsDBNull(reader.GetOrdinal("FK_id_categoria")) ? null : reader.GetInt32(reader.GetOrdinal("FK_id_categoria"));

            // Verificación con hash BCrypt
            bool passwordValida = BCrypt.Net.BCrypt.Verify(dto.Password, hashBd);
            if (!passwordValida)
            {
                return Unauthorized(new { message = "Credenciales incorrectas o usuario inactivo." });
            }

            // Construcción del Token JWT
            var jwtKey = _configuration["JwtSettings:Key"]
    ?? throw new InvalidOperationException("Falta la clave JWT en appsettings.");
            var jwtIssuer = _configuration["JwtSettings:Issuer"] ?? "CACC_API";
            var jwtAudience = _configuration["JwtSettings:Audience"] ?? "CACC_Angular";

            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
            var tokenHandler = new JwtSecurityTokenHandler();

            var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
    new Claim(ClaimTypes.Email, email),
    new Claim(ClaimTypes.Name, $"{nombre} {apellido}".Trim()),
    new Claim(ClaimTypes.Role, nombreRol),
    new Claim("id_rol", idRol.ToString())
};

            if (idCategoriaAsignada.HasValue)
            {
                claims.Add(new Claim("id_categoria", idCategoriaAsignada.Value.ToString()));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(_configuration["JwtSettings:ExpirationMinutes"] ?? "720")
                ),
                Issuer = jwtIssuer,
                Audience = jwtAudience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(keyBytes),
                    SecurityAlgorithms.HmacSha256Signature
                )
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            string tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                rol = nombreRol,   
                role = nombreRol,
                idRol = idRol,
                usuario = email
            });
        }
    }
}