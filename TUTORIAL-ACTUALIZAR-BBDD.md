# Actualizar la base de datos CACC sin perder información

Este procedimiento aplica las protecciones de integridad incorporadas en las migraciones `002` a `009` sobre una base CACC existente. El actualizador es transaccional e idempotente: si detecta un conflicto, revierte la operación completa; si ya fue aplicado, puede ejecutarse nuevamente.

## Elegir el archivo correcto

| Situación | Archivo |
|---|---|
| Crear una instalación nueva | `BaseDatos-ClubCamioneros.sql` |
| Actualizar una base existente | `BackEnd/scripts/database/Actualizar-BBDD-Existente-Ultimos-Arreglos.sql` |

> No ejecute el script de creación sobre una base existente. Para conservar datos use siempre el actualizador.

## Camino rápido

1. Detenga temporalmente el backend.
2. Realice un backup completo de la base.
3. Abra el actualizador en SQL Server Management Studio (SSMS).
4. Seleccione explícitamente la base CACC en el desplegable de SSMS.
5. Ejecute el archivo completo con **F5**.
6. Compruebe el mensaje `Actualización completada correctamente`.
7. Verifique que todas las protecciones de la tabla final indiquen `activa = 1`.
8. Inicie nuevamente el backend y pruebe el inicio de sesión y una consulta de jugadores.

## 1. Detener el backend

Evite escrituras mientras cambia el esquema. Cierre la terminal que ejecuta la API o detenga su proceso antes de continuar.

No es necesario borrar la base, eliminar volúmenes de Docker ni reinstalar SQL Server.

## 2. Crear el backup obligatorio

En SSMS:

1. Abra **Bases de datos**.
2. Haga clic derecho sobre la base CACC.
3. Seleccione **Tareas → Copia de seguridad**.
4. Elija el tipo **Completa**.
5. Seleccione un archivo `.bak` en una ubicación conocida.
6. Presione **Aceptar** y confirme que SSMS informe que la copia terminó correctamente.

No continúe si el backup falla.

## 3. Seleccionar la base correcta

Abra:

```text
BackEnd/scripts/database/Actualizar-BBDD-Existente-Ultimos-Arreglos.sql
```

En el desplegable de bases de datos de SSMS seleccione la base que usa el proyecto, normalmente:

```text
ClubCamioneros
```

Puede confirmar la selección ejecutando primero en otra ventana:

```sql
SELECT DB_NAME() AS base_seleccionada;
```

El actualizador rechaza `master`, `model`, `msdb` y `tempdb`, y también rechaza bases que no contengan el esquema CACC esperado.

## 4. Ejecutar la actualización

Ejecute el archivo completo con **F5**. No seleccione fragmentos individuales.

El actualizador:

- normaliza valores que pueden corregirse sin ambigüedad;
- aborta si encuentra duplicados que requieren una decisión humana;
- crea índices y restricciones faltantes;
- elimina únicamente asignaciones `STAFF_CATEGORIAS` con claves `NULL`, porque no representan relaciones recuperables;
- confirma todos los cambios juntos o los revierte todos.

El resultado correcto incluye:

```text
Actualización completada correctamente en [ClubCamioneros].
```

Si aparece `Actualización cancelada`, no se confirmó ningún cambio. Lea el número y el mensaje del error antes de modificar datos.

## 5. Verificar las protecciones

Al final del script aparece una tabla con las columnas `proteccion` y `activa`.

Confirme que todas las filas muestren:

```text
activa = 1
```

Entre las protecciones verificadas se encuentran:

- DNI, email e identidades de usuario únicos;
- partidos y participaciones no duplicables;
- minutos de juego dentro del rango permitido;
- nombres de categorías únicos;
- asignaciones de categorías únicas y completas;
- una ficha médica y un responsable activo por jugador.

También puede volver a ejecutar el actualizador: su segunda ejecución debe finalizar correctamente sin duplicar objetos.

## 6. Reiniciar y probar el sistema

Inicie nuevamente el backend y compruebe:

- inicio de sesión;
- listado de jugadores;
- listado de Staff;
- categorías y partidos;
- registro de asistencia.

Si el backend no inicia, conserve el mensaje de error y no vuelva a ejecutar modificaciones manuales sobre la base.

## Si la actualización falla

El script usa una transacción y revierte automáticamente sus propios cambios. Si el error indica duplicados o relaciones ambiguas:

1. Guarde el mensaje completo.
2. No elimine registros al azar.
3. Identifique los datos señalados y decida cuál representa la información correcta.
4. Corrija esos datos con una consulta revisada.
5. Ejecute nuevamente el actualizador.

## Restaurar el backup

Use la restauración solo si necesita regresar toda la base al estado anterior:

1. Detenga el backend.
2. En SSMS haga clic derecho en **Bases de datos**.
3. Seleccione **Restaurar base de datos**.
4. Elija **Dispositivo** y seleccione el archivo `.bak` creado antes de la actualización.
5. Revise cuidadosamente la base de destino.
6. En **Opciones**, active el cierre de conexiones existentes si SSMS lo requiere.
7. Ejecute la restauración y espere la confirmación.
8. Reinicie el backend y vuelva a probar el sistema.

## Checklist final

- [ ] El backend estuvo detenido durante la actualización.
- [ ] Existe un backup completo y verificable.
- [ ] La base seleccionada era la base CACC correcta.
- [ ] Apareció el mensaje de actualización completada.
- [ ] Todas las protecciones muestran `activa = 1`.
- [ ] El backend volvió a iniciar.
- [ ] El inicio de sesión y las pantallas principales funcionan.

Para instalaciones nuevas use `BaseDatos-ClubCamioneros.sql`; el actualizador consolidado está destinado exclusivamente a bases existentes.
