using Cacc.Dao;
using Cacc.Api.Development;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CACC API",
        Version = "v1",
        Description = "API REST para la gestión deportiva del Club Atlético Camioneros de Córdoba."
    });
});
builder.Services.AddSingleton<IJugadorRepository, JugadorRepository>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendAngular", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://127.0.0.1:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("FrontendAngular");

if (app.Environment.IsDevelopment())
{
    DatosIniciales.Cargar(app.Services);
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("v1/swagger.json", "CACC API v1");
        options.DocumentTitle = "CACC API - Swagger";
    });
    app.MapGet("/", () => Results.Redirect("/swagger"));
}

app.MapControllers();

app.Run();

public partial class Program;
