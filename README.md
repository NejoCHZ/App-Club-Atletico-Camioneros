# Sistema de Gestión Deportiva – Club Atlético Camioneros (CACC)

**Institución:** Club Atlético Camioneros de Córdoba (CACC)[cite: 2].
**Estado actual:** Base de datos creada; en desarrollo la landing page inicial[cite: 2].

## Acerca del Proyecto
Esta plataforma busca facilitar las gestiones diarias del personal deportivo y administrativo del club[cite: 2]. El sistema se divide en un **Portal Administrativo** y un **Portal Deportivo**, con acceso exclusivo para el staff (los jugadores no tienen acceso)[cite: 2]. 
Sus funciones principales incluyen:
* Registro de asistencia diaria mediante el escaneo de un código QR físico o ingreso manual del DNI[cite: 2].
* Verificación automática del estado de la cuota mensual para admitir o denegar el acceso en puerta[cite: 2].
* Gestión económica, pagos, generación de cuotas y aplicación de descuentos[cite: 2].
* Seguimiento individual del jugador, incluyendo ficha médica, datos deportivos, generación de QR y contacto de tutores[cite: 2].

## Roles y Accesos
El sistema utiliza Control de Accesos Basado en Roles (RBAC)[cite: 2]. Dependiendo del rol detectado al validar las credenciales (JWT), el usuario es redirigido a su entorno correspondiente[cite: 2]:
* **Tesorero (Súper Admin):** Acceso completo al Portal Administrativo para gestionar usuarios, pagos y estado de deudas[cite: 2].
* **Coordinador:** Acceso total al Portal Deportivo (todas las categorías y jugadores)[cite: 2].
* **Director Técnico (DT):** Acceso al Portal Deportivo restringido únicamente al plantel de su categoría asignada[cite: 2].
* **Médico:** Acceso de visualización a todos los perfiles, con permiso exclusivo para editar la información médica[cite: 2].
* **"Don QR":** Acceso a la WebApp (Semáforo QR) para registrar ingresos del personal y jugadores[cite: 2].

## Stack Tecnológico
* **Frontend:** Angular v22 (TypeScript, CSS) y la librería `angular-qrcode`[cite: 2].
* **Backend y Base de Datos:** C# 13 / .NET 9.0 (Arquitectura en capas) y SQL Server 2025[cite: 2].
* **Seguridad y Herramientas:** Autenticación JWT, Figma, Jira y GitHub[cite: 2].
