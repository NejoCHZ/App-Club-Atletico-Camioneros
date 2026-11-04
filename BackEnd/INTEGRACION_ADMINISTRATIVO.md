# Integración con el Portal Administrativo

El Portal Deportivo y el Portal Administrativo del club funcionan como **un solo sistema**: una base de datos, un inicio de sesión y una única elección de portales. Este documento explica cómo encaja el Deportivo.

## Qué es de quién

| Tema | Dueño | Cómo lo usa el Deportivo |
|---|---|---|
| Base de datos y migraciones | Portal Administrativo | Se conecta a la misma base. No cambia su estructura |
| Inicio de sesión, cierre de sesión y elección de portales | Portal Administrativo | Recibe la sesión (`/login#sso=<token>`) y valida el token en cada pedido |
| Deuda y habilitación de cada jugador | Portal Administrativo | La consulta por API; **nunca** la calcula |
| Altas, bajas lógicas, categorías, fichas, asistencia (QR) | Portal Deportivo | Las escribe en la base compartida. Los cargos de un alta (inscripción y cuota) los genera el Administrativo |

## Inicio de sesión único

- `POST api/auth/login` responde 410: el Deportivo **no tiene login propio**. La ruta `/login` del frontend solo recibe la sesión que entrega el Administrativo y, si no hay una válida, redirige al login de allá sin mostrar nada.
- `/admin/portales` lleva a la elección de portales del Administrativo (no hay otra).
- Cada pedido valida el token **y** que la sesión siga vigente (usuario activo y `tokenVersion` al día): cerrar sesión en un portal la cierra en los dos.
- Clave, emisor y audiencia del JWT son **los mismos** en los dos portales. Ver `LOCAL_CONFIGURATION.md`.
- El rol 2 (Administrador del Administrativo) no entra al Deportivo.

## Estado de deuda: contrato v1

El QR y los listados consultan al Administrativo:

- `GET {AdministrativoApi:BaseUrl}/api/integracion/v1/estado-deuda/dni/{dni}`
- `POST {AdministrativoApi:BaseUrl}/api/integracion/v1/estado-deuda/lote` (para los listados; hasta 500 DNI)

con el **mismo token del usuario** (`Authorization: Bearer ...`). La respuesta trae solo el estado: `habilitado`, `solo_entrenamientos`, `inhabilitado` o `baja`, más `accesoPermitido`. **Nunca** montos ni cantidad de cuotas, y este portal no debe mostrarlos. El contrato completo y el documento OpenAPI están en el repositorio del Administrativo (`docs/integracion`).

### Qué hace el QR

| Estado | Resultado |
|---|---|
| `habilitado` | Pasa, verde. Registra la asistencia (una por día) |
| `solo_entrenamientos` | Pasa, amarillo |
| `inhabilitado` / `baja` | No pasa, rojo. No registra asistencia |
| El Administrativo no responde | **No pasa nadie** (503) y no se registra nada (`AdministrativoApi:SiNoResponde = Denegar`, decisión del club) |
| La ruta v1 no existe en el Administrativo (404 sin mensaje) | Se trata como "no responde" y se registra en el log: revisar `BaseUrl` y la versión del Administrativo |

Los listados muestran "SIN VERIFICAR" en el estado de cuota cuando el Administrativo no responde; el resto del portal sigue funcionando.

## Reglas de escritura en la base compartida

1. **Toda conexión de los DAO se abre con `OpenAuditadaAsync`**, no con `OpenAsync`: así cada cambio queda con su responsable en la auditoría. Una prueba (`DonQrSqlContractTests`) falla si se abre una conexión de otra forma.
2. Los `INSERT` en tablas con trigger de auditoría usan `OUTPUT ... INTO` y no se calculan ids a mano (la base los genera).
3. **Género (Masculino o Femenino) y categoría son obligatorios** para todo jugador; la base los exige. De ellos sale el arancel que se le cobra.
4. **Dar de baja no borra nada**: `DELETE /api/jugadores/{id}` pone `fecha_baja`. Pagos, descuentos, asistencias y ficha médica se conservan. La reincorporación se hace desde el Administrativo.
5. No se puede eliminar una categoría con jugadores o aranceles (409).

## Altas de jugadores y sus cargos

La inscripción y la cuota del mes las genera el Administrativo, con sus reglas (la inscripción es la de su género y en $0 no se cobra; la cuota, desde el día 10). Por eso, **después de grabar al jugador**, `POST api/jugadores` llama a:

- `POST {AdministrativoApi:BaseUrl}/api/integracion/v1/jugadores/{idJugador}/cargos-alta`

con el token del usuario (solo el SuperAdmin y el Administrador (Tesorero) pueden). La llamada es idempotente y la respuesta dice solo **si** se generó cada cargo, nunca montos.

**El alta nunca se deshace por esa llamada.** Si el Administrativo no responde o rechaza, el jugador igual queda creado, la respuesta del alta trae `cargosGenerados: false` y un `avisoCargos` que el formulario muestra, y los cargos salen igual por los mecanismos de siempre: la cuota con la próxima generación mensual del Administrativo y la inscripción al registrar el primer pago. Cuando el Administrativo vuelve se puede repetir la llamada.

## Probar los dos portales juntos

Hay un entorno de prueba que arma la base, aplica la configuración y levanta los dos portales: https://github.com/Atzur1/cacc-unificacion (carpeta `docs`, con la guía paso a paso).
