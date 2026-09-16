using CACC.DAO;
using CACC.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using QuestPDF.Infrastructure;

// Configuramos la licencia Community de QuestPDF correctamente como sentencia ejecutable
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS (Para que Angular no sea bloqueado)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // URL oficial de nuestro frontend Angular
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 2. Inyección de Dependencias (¡Sin paréntesis en las implementaciones!)
builder.Services.AddScoped<IUsuarioDao, UsuarioDao>();
builder.Services.AddScoped<ICategoriaDao, CategoriaDao>();
builder.Services.AddScoped<IStaffDao, StaffDao>();
builder.Services.AddScoped<IJugadorDao, JugadorDao>();
builder.Services.AddScoped<IFichaMedicaDao, FichaMedicaDao>();
builder.Services.AddScoped<IAsistenciaDao, AsistenciaDao>();
builder.Services.AddScoped<IQrService, QrService>();

// 3. Agregar soporte para los Controllers
builder.Services.AddControllers();

// 4. Configurar el validador de JWT
var jwtKey = builder.Configuration["JwtSettings:Key"] ?? throw new InvalidOperationException("Falta la clave JWT en appsettings.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

// 5. Configurar el Pipeline HTTP
app.UseCors("AllowAngular");

app.UseAuthentication(); // Primero validamos quién sos
app.UseAuthorization();  // Después validamos qué podés hacer

app.MapControllers();

app.Run();