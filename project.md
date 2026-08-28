# Sistema de Gestión Deportiva – Club Atlético Camioneros (CACC)

**Institución:** Club Atlético Camioneros de Córdoba (CACC)
**Estado actual:** Base de datos creada; en desarrollo la landing page inicial del sistema.
**Última actualización:** 22/08/2026

---

## Objetivo

Facilitar las gestiones diarias del personal deportivo y administrativo del club, entre ellas:

- Registro de asistencia de jugadores y staff.
- Control del estado de deuda de las cuotas sociales.
- Seguimiento deportivo e historial clínico individual de cada jugador.
- Registro de información del tutor, en caso de jugadores menores de edad.

## Alcance

- **Carga de personas:** registro y administración (alta, baja y modificación) de jugadores y staff.
  - *Staff:* creación de usuarios del sistema, con asignación de rol y credenciales de acceso.
  - *Jugadores:* carga de datos personales, de contacto, deportivos y de salud (sin acceso al sistema).
- Generación momentánea de un código QR que tomará los datos de la persona (principalmente el DNI) para imprimir en la tarjeta física. Este QR no se guardará en la base de datos, y en caso de reimpresión se generará uno nuevo en el momento.
- Registro de jugadores organizados por categoría.
- Acceso al sistema exclusivo para el staff del club, diferenciado mediante control de accesos (RBAC) según el rol de cada usuario.
- División de la plataforma en opciones de acceso que incluyen: **1- Portal Administrativo**, **2- Portal Deportivo** y **3- Registrar persona (staff y jugadores)**.
- Los jugadores **no** tienen acceso al sistema.

## Usuarios y Roles

El sistema contempla 5 roles de staff. Cada uno accede únicamente a las pantallas y funciones que le corresponden; esto se determina automáticamente al iniciar sesión. 

| Rol | Alcance de acceso | Permisos |
|---|---|---|
| **Tesorero** (Súper Admin) | Pantalla de Selección de Portales | Es el único rol que accederá a la pantalla de selección de portales para elegir entre: 1- Portal Administrativo, 2- Portal Deportivo, 3- Registrar persona. Acceso completo al sistema. Crea los usuarios de staff, gestiona pagos, cuotas, tipos de descuentos y supervisa el estado de deuda de los jugadores. |
| **Coordinador** | Portal Deportivo (General) | Accede directamente al Portal Deportivo. Acceso a todas las categorías y a todos los jugadores. |
| **Director Técnico (DT)** | Portal Deportivo (Su categoría) | Accede directamente al Portal Deportivo. Acceso únicamente a los jugadores de la categoría que tiene a cargo (plantel asignado). |
| **Médico** | Portal Deportivo (Salud) | Accede directamente al Portal Deportivo. Solo visualización de todos los perfiles de jugador. Puede editar exclusivamente la información médica/patológica. |
| **"Don QR"** | WebApp (Semáforo QR) | Accede directamente a una pantalla para registrar las asistencias escaneando el código QR de las tarjetas, o ingresando directamente el DNI de la persona. |

## Funcionalidades

### 1. Gestión Económica y Administrativa
- Registro de pagos, generación de cuotas y fechas de vencimiento.
- Aplicación de porcentajes de descuento a jugadores específicos.
- Visualización del estado de deuda en tiempo real.

### 2. Registro de Asistencia (Semáforo QR)
- Registro de asistencia diaria de jugadores y staff.
- Dos métodos de registro: escaneo de código QR (que detecta el DNI para registrar la asistencia al DNI coincidente con la persona en la base de datos) o ingreso manual del DNI.
- Verificación automática del estado de la cuota mensual (al día / con deuda) para emitir el estado de acceso (admitir o denegar).

### 3. Perfil de Jugador
Visualización y edición de:
- Información personal y de contacto (no lleva foto de perfil).
- Información de salud / ficha médica (obra social, antecedentes, vencimiento de apto físico).
- Información deportiva: club de origen, posición en la cancha, etc.
- Información de los responsables (tutores), en caso de jugadores menores de edad.

### 4. Acceso Restringido y Portales
- El Tesorero (súper admin) es el único con acceso a la pantalla de selección de portales.
- El resto del staff accede directamente al **Portal Deportivo**, con excepción de "Don QR" que accede directamente a la pantalla de registro de asistencia.
- Cada DT visualiza únicamente el plantel de la categoría que tiene asignada, ocultando el resto de la información del club.

## Stack Tecnológico

**Frontend**
- Angular v22 (TypeScript, CSS)
- angular-qrcode — generación de códigos QR al vuelo

**Backend**
- C# 13 / .NET 9.0
- Arquitectura en capas (Entities, DAO, API REST)

**Base de Datos**
- SQL Server 2025
- SQL Server Management Studio 2022

**Seguridad e Integraciones**
- Autenticación JWT y Control de Accesos (RBAC)

**Herramientas de diseño y gestión**
- Figma — diseño UI/UX
- Jira — gestión de tareas y sprints
- GitHub — control de versiones