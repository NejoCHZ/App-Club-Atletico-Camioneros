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
}