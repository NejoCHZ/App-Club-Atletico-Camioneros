# Sistema de Gestión Deportiva — Club Atlético Camioneros de Córdoba (CACC)

Sistema integral desarrollado para optimizar las gestiones diarias del personal deportivo, administrativo y médico del **Club Atlético Camioneros de Córdoba (CACC)**.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Angular v22** (TypeScript, CSS)
- **angular-qrcode** — Generación de códigos QR al vuelo

### Backend
- **C# 13 / .NET 9.0**
- **API REST** organizada en arquitectura por capas (*Entities*, *DAO / Repository*, *API / Controllers*)
- **Seguridad e Integraciones:** Autenticación mediante **JWT** y control de accesos basado en roles (**RBAC**)
- **Librerías clave:** `QRCoder` (para la generación dinámica de códigos QR en formatos permitidos como `PngByteQRCode` o `SvgQRCode`) y `QuestPDF` (para la exportación de credenciales físicas en PDF).

### Base de Datos
- **SQL Server 2025**
- **SQL Server Management Studio (SSMS) 2022**

---

## 👥 Módulos y Roles de Staff (RBAC)

El acceso al sistema está restringido exclusivamente al staff del club. Los permisos se configuran de manera automática al iniciar sesión según el rol asignado

1. **Tesorero (Súper Admin):** Único rol con acceso a la pantalla de selección de portales. Posee control total del sistema, gestión de altas de staff, pagos, cuotas, tipos de descuentos y supervisión de deudas.
2. **Coordinador:** Acceso directo al **Portal Deportivo**, con visibilidad global sobre todas las categorías y planteles de jugadores.
3. **Director Técnico (DT):** Acceso directo al **Portal Deportivo**, limitado estrictamente a los jugadores de la categoría asignada a su cargo.
4. **Médico:** Acceso directo al **Portal Deportivo**. Permite la visualización general de perfiles de jugadores y la edición exclusiva de la información médica y patológica.
5. **"Don QR":** Acceso directo a la WebApp de **Semáforo QR** para el registro diario de asistencias mediante escaneo de tarjetas o ingreso manual de DNI.

*Nota institucional:* Los jugadores **no** poseen acceso al sistema.



## 📂 Estructura del Proyecto


App-Club-Atletico-Camioneros/
├── BackEnd/
│   ├── CACC.sln
│   ├── CACC.API/         # Controladores, Endpoints y Middleware de Autenticación
│   ├── CACC.DAO/         # Capa de Acceso a Datos (Consultas SQL parametrizadas)
│   └── CACC.Entities/    # Modelos y Entidades de dominio
├── FrontEnd/             # Aplicación Angular v22
└── cacc_database_init.sql # Script SQL de respaldo (Estructura y Datos iniciales)


Guía de Instalación y Puesta en Marcha Local1. Base de Datos (SQL Server 2025)Abrir SQL Server Management Studio (SSMS).
1. Ejecutar el script consolidado ubicado en la raíz del repositorio (cacc_database_init.sql) para generar el esquema completo de tablas bajo nomenclatura estándar (UPPER_SNAKE_CASE y snake_case) junto con los datos iniciales.
2. Backend (.NET 9.0)Posicionarse en la carpeta del backend:Bashcd BackEnd
Restaurar dependencias y compilar la solución:Bashdotnet restore
dotnet build
Verificar los parámetros de conexión (Connection Strings) en los archivos de configuración de la API.Ejecutar el proyecto API:Bashcd CACC.API
dotnet run
3. Frontend (Angular v22)Desde una nueva terminal, ubicarse en la carpeta del frontend:Bashcd FrontEnd
Instalar los paquetes necesarios de Node.js:Bashnpm install
Levantar el entorno de desarrollo local:Bashnpm start
Abrir el navegador en http://localhost:4200.

📄 Normativa y ConvencionesBase de datos: Tablas en plural con mayúsculas sostenidas (UPPER_SNAKE_CASE), columnas en minúsculas separadas por guiones bajos (snake_case), claves primarias prefijadas con PK_id_ y foráneas con FK_id_.   QR y Credenciales: El código QR se genera dinámicamente al vuelo a partir del DNI (sin persistencia en base de datos) para la impresión de tarjetas físicas y procesamiento en el semáforo de asistencias. Las credenciales se exportan en formato PDF mediante QuestPDF con diseño optimizado (formato CR80, sin fotografía).

🛡️ LicenciaProyecto institucional desarrollado de manera exclusiva para el Club Atlético Camioneros de Córdoba (CACC). Uso interno y reservado.

