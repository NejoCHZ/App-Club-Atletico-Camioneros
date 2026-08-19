**Sistema de Gestión y Control QR - Club Atlético Camioneros**

## Descripción del proyecto
Plataforma web cliente-servidor desarrollada como Trabajo Final Integrador para digitalizar el núcleo operativo del club. El sistema centraliza el padrón de jugadores, vincula tutores y agiliza el ingreso al predio evaluando el estado de deuda en tiempo real.
* **Stack Tecnológico:** Frontend en Angular, Backend en ASP.NET Core (C#) y persistencia en SQL Server mediante Entity Framework Core.
* **Módulos:** Panel de administración con control de acceso (RBAC), generador de credenciales físicas PDF con código QR y sistema tipo "semáforo" para escaneo en puerta.
* **Equipo Scrum:** Lucas Cornejo (PO), Facundo Zabala (SM), Lisandro Siraveña (Back), Lucas González (Front), Samuel Peinado Martínez (QA).

## Cómo instalar y ejecutar
Asegúrate de tener instalados Node.js, el SDK de .NET y SQL Server antes de comenzar.
* **Repositorio:** Clona el proyecto localmente y navega a las carpetas correspondientes.
* **Base de Datos:** Aplica las migraciones de Entity Framework Core ejecutando el comando de actualización para generar la estructura relacional.
* **Backend:** Configura la cadena de conexión en el entorno de C# y ejecuta la API REST.
* **Frontend:** Instala las dependencias mediante el gestor de paquetes de Node y levanta el servidor de desarrollo local de Angular.

## Cómo contribuir
El flujo de trabajo colaborativo está regido por metodologías ágiles para asegurar la integridad del código.
* **Asignación:** Revisa el tablero de Jira para identificar tu tarea activa correspondiente al sprint actual.
* **Desarrollo:** Crea una rama independiente para programar tu funcionalidad evitando impactar la rama principal.
* **Integración:** Realiza registros de cambios descriptivos y abre una solicitud de integración para que un compañero valide el código.

## Ejemplos de uso
El sistema adapta su interfaz dependiendo del rol autorizado por el token JWT.
* **Control de Accesos (Portería):** Al habilitar la cámara desde un dispositivo móvil, se escanea el carnet físico del jugador y la pantalla devuelve una señal visual (Verde, Amarillo o Rojo) confirmando el ingreso.
* **Gestión Institucional (Administración):** Permite registrar a un deportista menor de edad, asociar obligatoriamente sus datos con los de su tutor y exportar la credencial en tamaño estándar lista para imprimir.
