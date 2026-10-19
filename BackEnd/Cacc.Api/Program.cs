using CACC.DAO;
using CACC.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using QuestPDF.Infrastructure;
using CACC.API.Security;
using System.Security.Claims;

// Configuramos la licencia Community de QuestPDF 
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Configurar CORS (Para que Angular no sea bloqueado)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        // Orígenes permitidos: Cors:AllowedOrigins (variable de entorno Cors__AllowedOrigins__0, ...). En desarrollo, el
        // Portal Administrativo usa el puerto 4200 y este portal el 4300.
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                  ?? new[] { "http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:4300", "http://127.0.0.1:4300" })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

//Inyección de Dependencias 
builder.Services.AddScoped<IUsuarioDao, UsuarioDao>();
builder.Services.AddScoped<ICategoriaDao, CategoriaDao>();
builder.Services.AddScoped<IStaffDao, StaffDao>();
builder.Services.AddScoped<IJugadorDao, JugadorDao>();
builder.Services.AddScoped<IFichaMedicaDao, FichaMedicaDao>();
builder.Services.AddScoped<IAsistenciaDao, AsistenciaDao>();
builder.Services.AddScoped<IQrService, QrService>();

// La deuda de cada jugador la informa el Portal Administrativo: es la única fuente de verdad.
var administrativo = builder.Configuration.GetSection(AdministrativoApiOptions.Seccion).Get<AdministrativoApiOptions>() ?? new AdministrativoApiOptions();
if (string.IsNullOrWhiteSpace(administrativo.BaseUrl) && builder.Environment.IsDevelopment())
    administrativo.BaseUrl = "http://localhost:5118"; // puerto por defecto del Portal Administrativo en desarrollo
builder.Services.AddSingleton(Microsoft.Extensions.Options.Options.Create(administrativo));
if (!Uri.TryCreate(administrativo.BaseUrl, UriKind.Absolute, out var administrativoUrl))
    throw new InvalidOperationException("Falta AdministrativoApi:BaseUrl (la dirección de la API del Portal Administrativo).");
builder.Services.AddHttpClient<IEstadoDeudaClient, EstadoDeudaClient>(client =>
{
    client.BaseAddress = new Uri(administrativoUrl.AbsoluteUri.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(Math.Clamp(administrativo.TimeoutSegundos, 1, 30));
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserAccess, CurrentUserAccess>();
builder.Services.AddScoped<CACC.API.Authorization.IUserScopeService, CACC.API.Authorization.UserScopeService>();

//  Agregar soporte para los Controllers
builder.Services.AddControllers();

//  Configurar el validador de JWT. La clave, el emisor y la audiencia son los MISMOS que usa el Portal Administrativo
//  (que es quien emite los tokens): se leen de Jwt:* (variables de entorno Jwt__Key, Jwt__Issuer, Jwt__Audience) y,
//  por compatibilidad, de JwtSettings:*.
var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["JwtSettings:Key"]
    ?? throw new InvalidOperationException("Falta la clave JWT (Jwt:Key).");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["JwtSettings:Audience"];
const string ClaveDeEjemploDelRepositorio = "EstaEsUnaClaveSuperSecretaYMuyLargaParaElProyectoCACC2026";
if (Encoding.UTF8.GetByteCount(jwtKey) < 32 || (!builder.Environment.IsDevelopment() && jwtKey == ClaveDeEjemploDelRepositorio))
    throw new InvalidOperationException("La clave JWT es corta o es la de ejemplo del repositorio: usá la misma clave secreta que el Portal Administrativo.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            // Igual que en el Portal Administrativo: un token cuya sesión se cerró, cuyo usuario se desactivó o cuyos
            // permisos cambiaron deja de servir acá también.
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                if (!int.TryParse(principal?.FindFirstValue("idUsuario"), out var idUsuario)
                    || !int.TryParse(principal?.FindFirstValue("rol_portal"), out var rolPortal)
                    || !int.TryParse(principal?.FindFirstValue("tokenVersion"), out var tokenVersion))
                {
                    context.Fail("Token inválido: iniciá sesión desde el Portal Administrativo.");
                    return;
                }

                var cadena = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>().GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Cadena de conexión no configurada.");
                if (!await SesionVigente.VerificarAsync(cadena, idUsuario, rolPortal, tokenVersion, context.HttpContext.RequestAborted))
                {
                    context.Fail("Sesión cerrada, usuario inactivo o permisos revocados.");
                }
            }
        };
    });

var app = builder.Build();

//  Configurar el Pipeline HTTP
app.UseCors("AllowAngular");

app.UseAuthentication(); // Primero validamos quién sos

// Quién hace el pedido, para que la auditoría de la base registre al responsable de cada cambio.
app.Use(async (context, next) =>
{
    ContextoAuditoria.IdUsuario = int.TryParse(context.User.FindFirstValue("idUsuario"), out var idUsuarioAuditoria) ? idUsuarioAuditoria : null;
    await next();
});

app.UseAuthorization();  // Después validamos qué podés hacer

app.MapControllers();

app.Run();
