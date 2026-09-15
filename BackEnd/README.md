# Backend CACC

API REST para la gestión de jugadores, implementada con C# 13 y .NET 9. Los datos se conservan en memoria mientras la aplicación está en ejecución; todavía no se utiliza una base de datos.

## Estructura

- `Cacc.Entities`: entidades de dominio.
- `Cacc.Dao`: interfaz y repositorio en memoria thread-safe.
- `Cacc.Api`: controladores, contratos, validaciones y configuración HTTP.
- `Cacc.Tests`: pruebas automatizadas.

## Ejecutar

Desde la carpeta `backend`:

```powershell
dotnet restore
dotnet run --project Cacc.Api
```

La URL exacta se muestra en la consola al iniciar la API. Los orígenes locales
`http://localhost:4200` y `http://127.0.0.1:4200` están habilitados mediante CORS.

## Swagger

En el entorno de desarrollo, la documentación interactiva está disponible en:

- Swagger UI: `http://localhost:5031/swagger`
- Documento OpenAPI: `http://localhost:5031/swagger/v1/swagger.json`

La raíz `http://localhost:5031` redirige automáticamente a Swagger UI.

Al iniciar la API en `Development`, se carga un jugador identificable como
`Jugador Prueba API` (DNI `40999888`). Este registro temporal permite comprobar
la conexión con el listado Angular y desaparece al detener el proceso.

## Endpoints

| Método | Ruta | Resultado exitoso |
|---|---|---|
| `GET` | `/api/jugadores` | `200 OK` |
| `GET` | `/api/jugadores/{id}` | `200 OK` |
| `POST` | `/api/jugadores` | `201 Created` |
| `PUT` | `/api/jugadores/{id}` | `204 No Content` |
| `DELETE` | `/api/jugadores/{id}` | `204 No Content` |

Ejemplo de alta de un jugador menor de edad:

```json
{
  "dni": "48.123.456",
  "nombre": "Santiago",
  "apellido": "Pérez",
  "fechaNacimiento": "2012-05-20",
  "categoria": "Infantil",
  "posicion": "DELANTERO",
  "clubOrigen": "Club de origen",
  "aptoFisico": true,
  "tutor": {
    "dni": "30.123.456",
    "nombre": "Carlos",
    "apellido": "Pérez",
    "telefono": "+54 351 555-0101",
    "email": "carlos@example.com"
  }
}
```

`dni`, `nombre`, `apellido`, `fechaNacimiento`, `categoria` y `posicion` son obligatorios. Las posiciones admitidas son `ARQUERO`, `DEFENSOR`, `VOLANTE` y `DELANTERO`; la API acepta mayúsculas o minúsculas y siempre devuelve el valor normalizado en mayúsculas. El DNI se normaliza a dígitos y debe ser único. Para un menor de 18 años, los cinco datos del tutor son obligatorios. Si se informa un tutor para un adulto, también debe estar completo. Los errores se devuelven con el formato estándar `ProblemDetails`.

## Verificar

```powershell
dotnet test
dotnet build
```
