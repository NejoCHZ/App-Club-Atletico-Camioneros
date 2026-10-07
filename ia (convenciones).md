# Convenciones de Nomenclatura - Proyecto CACC

Este documento establece las reglas y estándares de código para garantizar la legibilidad y mantenibilidad del Sistema de Gestión Deportiva del Club Atlético Camioneros (CACC).

## 1. Arquitectura y Backend (C# 13 / .NET 9.0)

El desarrollo de la API REST se dividirá en capas. Se seguirán las convenciones estándar de Microsoft para C#:

### Capas del Proyecto
*   **Entities (Entidades):** Representan la estructura de la base de datos. Deben ir en singular y en `PascalCase`.
    *   *Ejemplo:* `Jugador`, `PagoCuota`, `FichaMedica`.
*   **DAO (Data Access Object) / Repositorios:** Clases encargadas de la interacción directa con la base de datos. Usarán `PascalCase` con el sufijo `Dao` o `Repository`. Sus interfaces siempre comienzan con `I`.
    *   *Ejemplo:* `JugadorDao`, `IJugadorDao`, `AsistenciaDao`.
*   **API (Controladores y URLs):** Clases que exponen los endpoints para ser consumidos.
    *   **Controladores:** `PascalCase` con el sufijo `Controller`. *Ejemplo:* `JugadorController`.
    *   **Rutas / URLs:** Las rutas de la API deben ir en minúsculas, usar `kebab-case` y emplear sustantivos en plural para respetar los estándares REST. *Ejemplo:* `/api/jugadores`, `/api/fichas-medicas`.

### Reglas Generales C#
*   **Clases e Interfaces Generales:** `PascalCase`.
*   **Métodos:** `PascalCase`. Deben representar acciones claras (verbos). *Ejemplo:* `RegistrarAsistencia()`, `ObtenerEstadoDeuda()`.
*   **Variables Locales y Parámetros:** `camelCase`. *Ejemplo:* `montoFinal`, `fechaPago`, `idJugador`.
*   **Campos Privados (Atributos de clase):** `_camelCase` (prefijo con guion bajo). *Ejemplo:* `_jugadorDao`, `_context`.
*   **Constantes:** `PascalCase` o `UPPER_SNAKE_CASE`. *Ejemplo:* `MaximoMesesDeuda` o `MAXIMO_MESES_DEUDA`.

## 2. Frontend (Angular v22 / TypeScript)

La aplicación web y el portal deportivo seguirán los lineamientos oficiales de Angular:

*   **Clases (Componentes, Servicios, Directivas, Pipes):** `PascalCase`.
    *   *Ejemplo:* `SemaforoQrComponent`, `AuthService`, `JugadorModel`.
*   **Métodos:** `camelCase`.
    *   *Ejemplo:* `escanearQr()`, `verificarDeuda()`, `cargarCategorias()`.
*   **Variables y Propiedades:** `camelCase`.
    *   *Ejemplo:* `estadoAcceso`, `jugadorSeleccionado`, `isFichaMedicaAlDia`.
*   **Nombres de Archivos:** `kebab-case`. Los archivos deben incluir su tipo como sufijo (`.component`, `.service`, `.model`).
    *   *Ejemplo:* `semaforo-qr.component.ts`, `asistencia.service.ts`, `jugador-detalle.component.css`.

## 3. Base de Datos (SQL Server 2025)

Basado en el diseño relacional actual, se unifican las siguientes reglas para mantener homogeneidad en los scripts y consultas:

*   **Tablas:** `UPPER_SNAKE_CASE` o mayúsculas sostenidas en plural.
    *   *Ejemplo:* `JUGADORES`, `FICHAS_MEDICAS`, `TIPO_DESCUENTO`.
*   **Columnas / Atributos:** `snake_case` (todo en minúsculas separado por guiones bajos) para facilitar la lectura.
    *   *Ejemplo:* `fecha_nacimiento`, `club_origen`, `estado_acceso`.
*   **Llaves Primarias (PK):** Prefijo `PK_id_` seguido del nombre de la entidad en singular.
    *   *Ejemplo:* `PK_id_jugador`, `PK_id_asistencia`.
*   **Llaves Foráneas (FK):** Prefijo `FK_id_` seguido del nombre de la entidad a la que hace referencia.
    *   *Ejemplo:* `FK_id_categoria`, `FK_id_estado_deuda`.

## 4. Módulo de Carga de Personas (QR y Credenciales)

Estándares para la nueva funcionalidad de alta de jugadores y staff, incluyendo la generación de códigos QR y credenciales físicas.

### Generación de Código QR (Backend, C#)
*   Librería: **QRCoder** (NuGet, licencia MIT, sin dependencias externas).
*   Usar los renderers `PngByteQRCode` o `SvgQRCode`. **No** usar `QRCode`/`ArtQRCode`: dependen de `System.Drawing.Common`, sin soporte multiplataforma desde .NET 6+.
*   El código QR se generará momentáneamente para la impresión tomando el DNI de la persona. **No será un dato persistente**. Al momento de escanearlo, detectará el DNI para registrar la asistencia a la persona coincidente en la base de datos.
*   En caso de necesitar reimprimir la tarjeta física, se generará un nuevo código QR al instante.

### Exportación de Credenciales
*   Formato: **PDF**, generado con **QuestPDF** (licencia Community, gratuita para uso académico/sin fines de lucro).
*   Contenido de cada credencial: nombre, apellido, DNI y el código QR. **NO va a llevar foto ni nada adicional.**
*   Tamaño de tarjeta sugerido: estándar CR80 (85,6 × 54 mm) — a confirmar según la impresora disponible.
*   Nomenclatura de archivo: `credencial_{tipo}_{id_persona}.pdf`. *Ejemplo:* `credencial_jugador_00123.pdf`, `credencial_staff_00045.pdf`.
*   Altas masivas: exportación batch en un único PDF multi-página. *Ejemplo:* `credenciales_lote_{yyyyMMdd}.pdf`.

### Relación QR – Persona en Base de Datos
*   **No se guardará la información del QR en la base de datos.** Dentro de la tabla `PERSONA` (entidad base) no existirá el QR ni un token asociado, ya que es un elemento de generación dinámica exclusiva para la impresión.