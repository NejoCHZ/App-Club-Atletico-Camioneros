using CACC.DAO;
using CACC.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CACC.API.Controllers
{
    [ApiController]
    [Route("api/staff")]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly IStaffDao _staffDao;

        public StaffController(IStaffDao staffDao)
        {
            _staffDao = staffDao;
        }

        [HttpGet]
        public async Task<IActionResult> GetStaff()
        {
            var staffDb = await _staffDao.ObtenerTodosAsync();

            var response = staffDb.Select(s => new StaffResponseDto
            {
                IdStaff = s.IdStaff,
                IdUsuario = s.IdUsuario,
                Nombre = s.Nombre,
                Apellido = s.Apellido,
                NombreCompleto = $"{s.Nombre} {s.Apellido}".Trim(),
                Dni = s.Dni,
                FechaDeNacimiento = s.FechaDeNacimiento,
                Email = s.Email,
                Rol = s.Rol,
                CategoriaAsignada = s.CategoriaAsignada,
                Activo = s.Activo
            });

            return Ok(response);
        }
    }
    [HttpPost]
        [Authorize(Roles = "Tesorero")]
        public async Task<IActionResult> CrearStaff([FromBody] StaffCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Dni) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Contrasenia))
            {
                return BadRequest(new { message = "Nombre, DNI, Email y Contraseña son obligatorios." });
            }

            try
            {
                // Hasheo de contraseña con BCrypt
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasenia);

                var staffAlta = new StaffAlta
                {
                    Nombre = dto.Nombre.Trim(),
                    Apellido = dto.Apellido.Trim(),
                    Dni = dto.Dni.Trim(),
                    FechaNacimiento = dto.FechaNacimiento,
                    Genero = dto.Genero,
                    Domicilio = dto.Domicilio,
                    Email = dto.Email.Trim(),
                    ContraseniaHasheada = passwordHash,
                    IdRol = dto.IdRol,
                    IdCategoria = dto.IdCategoria
                };

                int nuevoIdStaff = await _staffDao.CrearAsync(staffAlta);

                return StatusCode(201, new
                {
                    message = "Colaborador de staff dado de alta con éxito.",
                    idStaff = nuevoIdStaff,
                    nombreCompleto = $"{dto.Nombre} {dto.Apellido}".Trim()
                });
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return StatusCode(409, new { message = "Ya existe un registro con ese DNI o Email en el sistema." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error interno al crear el staff.", details = ex.Message });
            }
        }
    }