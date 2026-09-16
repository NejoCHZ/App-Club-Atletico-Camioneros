using Microsoft.AspNetCore.Mvc;
using CACC.API.DTOs;
using CACC.DAO;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioDao _usuarioDao;
        private readonly IConfiguration _configuration;

        public AuthController(IUsuarioDao usuarioDao, IConfiguration configuration)
        {
            _usuarioDao = usuarioDao;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            // 1. Buscamos al usuario en la BD por su email
            var usuario = await _usuarioDao.ObtenerUsuarioParaAuthAsync(request.Email);

            if (usuario == null || !usuario.Activo)
            {
                return Unauthorized(new { message = "Credenciales incorrectas o usuario inactivo." });
            }

            // 2. Verificamos que la contraseña ingresada coincida con el hash de la BD usando BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.Contrasenia))
            {
                return Unauthorized(new { message = "Credenciales incorrectas." });
            }

            // 3. Preparamos la "carga útil" (Claims) del token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Role, usuario.NombreRol),
                // Guardamos el array de categorías asignadas como JSON dentro del token
                // Esto es fundamental para que el DT solo vea su categoría sin depender del frontend
                new Claim("categorias", JsonSerializer.Serialize(usuario.CategoriasAsignadas))
            };

            // 4. Firmamos el token con la clave secreta de appsettings.json
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:ExpirationMinutes"]!)),
                signingCredentials: creds
            );

            // 5. Retornamos el DTO con el Token y el Rol al frontend Angular
            return Ok(new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Rol = usuario.NombreRol
            });
        }
    }
}