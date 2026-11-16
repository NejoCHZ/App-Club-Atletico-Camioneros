/*
  Base de datos portable del repositorio App-Club-Atletico-Camioneros.
  Incluye esquema, relaciones, vistas, datos iniciales, categorías múltiples y credenciales QR.
  Ejecutar en SQL Server Management Studio o mediante sqlcmd con permisos para crear bases.
*/
USE [master]
GO
IF DB_ID(N'ClubCamioneros') IS NOT NULL
BEGIN
    THROW 50001, 'La base ClubCamioneros ya existe. Elimine o renombre la base existente antes de ejecutar este script.', 1;
END
GO
CREATE DATABASE [ClubCamioneros]
GO
ALTER DATABASE [ClubCamioneros] SET RECOVERY SIMPLE
GO
USE [ClubCamioneros]
GO
/****** Object:  Table [dbo].[PAGOS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PAGOS](
	[PK_id_pago] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_jugador] [int] NULL,
	[monto_base] [decimal](18, 2) NULL,
	[FK_id_jugador_descuento] [int] NULL,
	[monto_final] [decimal](18, 2) NULL,
	[fecha_pago] [date] NULL,
	[metodo_pago] [varchar](50) NULL,
	[fecha_vencimiento] [date] NULL,
	[estado] [bit] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_pago] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[VISTA_ESTADO_DEUDA]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* =========================================================================
   VISTA DINAMICA: VISTA_ESTADO_DEUDA
   ========================================================================= */
CREATE VIEW [dbo].[VISTA_ESTADO_DEUDA] AS
SELECT
    FK_id_jugador,
    SUM(monto_final) AS deuda_total,
    COUNT(PK_id_pago) AS cantidad_cuotas_vencidas
FROM PAGOS
WHERE estado = 0 AND fecha_vencimiento < GETDATE()
GROUP BY FK_id_jugador;
GO
/****** Object:  Table [dbo].[ASISTENCIAS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ASISTENCIAS](
	[PK_id_asistencia] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_jugador] [int] NULL,
	[FK_id_staff] [int] NULL,
	[fecha_hora] [datetime] NULL,
	[estado_acceso] [varchar](50) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_asistencia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CATEGORIAS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CATEGORIAS](
	[PK_id_categoria] [int] IDENTITY(1,1) NOT NULL,
	[nombre_categoria] [varchar](100) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FICHAS_MEDICAS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FICHAS_MEDICAS](
	[PK_id_ficha_medica] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_jugador] [int] NULL,
	[obra_social] [varchar](150) NULL,
	[numero_afiliado_os] [int] NULL,
	[grupo_sanguineo] [varchar](10) NULL,
	[factor] [char](1) NULL,
	[antecedentes_salud] [varchar](255) NULL,
	[medicamentos_cronicos] [varchar](255) NULL,
	[condiciones_cronicas] [varchar](255) NULL,
	[apto_fisico_vencimiento] [date] NULL,
	[observaciones] [varchar](255) NULL,
	[fecha_actualizacion] [datetime] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_ficha_medica] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HISTORIAL_PARTIDOS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HISTORIAL_PARTIDOS](
	[PK_id_partido] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_categoria] [int] NULL,
	[fecha_partido] [date] NULL,
	[rival] [varchar](100) NULL,
	[condicion_localia] [varchar](20) NULL,
	[resultado] [varchar](20) NULL,
	[observaciones] [varchar](255) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_partido] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[JUGADORES]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[JUGADORES](
	[PK_id_jugador] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_persona] [int] NULL,
	[FK_id_categoria] [int] NULL,
	[club_origen] [varchar](100) NULL,
	[ficha_medica_liga] [bit] NULL,
	[posicion_cancha] [varchar](50) NULL,
	[peso] [decimal](5, 2) NULL,
	[altura] [decimal](4, 2) NULL,
	[pie_habil] [varchar](20) NULL,
	[grupo_sanguineo] [varchar](5) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_jugador] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[JUGADORES_DESCUENTOS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[JUGADORES_DESCUENTOS](
	[PK_id_jugador_descuento] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_jugador] [int] NULL,
	[FK_id_descuento] [int] NULL,
	[estado_activo] [bit] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_jugador_descuento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[JUGADORES_PARTIDOS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[JUGADORES_PARTIDOS](
	[PK_id_jugador_partido] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_partido] [int] NULL,
	[FK_id_jugador] [int] NULL,
	[minutos_jugados] [int] NULL,
	[goles] [int] NULL,
	[tarjetas_amarillas] [int] NULL,
	[tarjeta_roja] [bit] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_jugador_partido] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[JUGADORES_RESPONSABLES]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[JUGADORES_RESPONSABLES](
	[PK_id_jugador_responsable] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_responsable] [int] NULL,
	[FK_id_jugador] [int] NULL,
	[parentesco] [varchar](50) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_jugador_responsable] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PERSONAS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PERSONAS](
	[PK_id_persona] [int] IDENTITY(1,1) NOT NULL,
	[genero] [varchar](50) NULL,
	[fecha_de_nacimiento] [date] NULL,
	[dni] [varchar](20) NULL,
	[nombre] [varchar](100) NULL,
	[apellido] [varchar](100) NULL,
	[domicilio] [varchar](255) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_persona] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RESPONSABLES]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RESPONSABLES](
	[PK_id_responsable] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_persona] [int] NULL,
	[email] [varchar](255) NULL,
	[telefono] [varchar](50) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_responsable] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ROLES]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ROLES](
	[PK_id_rol] [int] IDENTITY(1,1) NOT NULL,
	[nombre_rol] [varchar](100) NULL,
	[permisos] [varchar](255) NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[STAFF]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[STAFF](
	[PK_id_staff] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_usuario] [int] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_staff] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[STAFF_CATEGORIAS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[STAFF_CATEGORIAS](
	[PK_id_staff_categoria] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_staff] [int] NULL,
	[FK_id_categoria] [int] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_staff_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TIPOS_DESCUENTO]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TIPOS_DESCUENTO](
	[PK_id_descuento] [int] IDENTITY(1,1) NOT NULL,
	[tipo_descuento] [varchar](100) NULL,
	[porcentaje] [int] NULL,
	[fecha_inicio] [date] NULL,
	[fecha_fin] [date] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_descuento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[USUARIOS]    Script Date: 10/4/2026 8:40:22 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[USUARIOS](
	[PK_id_usuario] [int] IDENTITY(1,1) NOT NULL,
	[FK_id_persona] [int] NULL,
	[FK_id_rol] [int] NULL,
	[email] [varchar](255) NULL,
	[contrasenia] [varchar](255) NULL,
	[activo] [bit] NULL,
PRIMARY KEY CLUSTERED
(
	[PK_id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[CATEGORIAS] ON

INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (1, N'AFA 20067')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (2, N'Pt  AFA 2008')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (3, N'Pt  AFA 2009')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (4, N'Pt  AFA 2010')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (5, N'Pt  AFA 2011')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (6, N'Pt  AFA 2012')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (7, N'Pt  preAFA 2013')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (8, N'Pt  preAFA 2014')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (9, N'Pt  preAFA 2015')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (10, N'Pt 2016')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (11, N'Pt 2017')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (12, N'Cebollitas')
INSERT [dbo].[CATEGORIAS] ([PK_id_categoria], [nombre_categoria]) VALUES (13, N'Femenino')
SET IDENTITY_INSERT [dbo].[CATEGORIAS] OFF
GO
SET IDENTITY_INSERT [dbo].[FICHAS_MEDICAS] ON

INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (1, 11, NULL, NULL, N'0', N'+', N'Asma leve controlada.', NULL, N'Esguince tobillo derecho (15/03/2025). Desgarro isquiotibial (22/10/2024). DWADAD. ADAD (21/09/2026).', NULL, N'Apto para competencia. Requiere calentamiento extendido.', NULL)
INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (2, 22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (3, 23, NULL, NULL, NULL, NULL, N'asma', NULL, N'esguince (23/09/2026). adwadad. desgarro (22/07/2025).', NULL, N'toma ibuprofeno', NULL)
INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (4, 32, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (8, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[FICHAS_MEDICAS] ([PK_id_ficha_medica], [FK_id_jugador], [obra_social], [numero_afiliado_os], [grupo_sanguineo], [factor], [antecedentes_salud], [medicamentos_cronicos], [condiciones_cronicas], [apto_fisico_vencimiento], [observaciones], [fecha_actualizacion]) VALUES (9, 37, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
SET IDENTITY_INSERT [dbo].[FICHAS_MEDICAS] OFF
GO
SET IDENTITY_INSERT [dbo].[HISTORIAL_PARTIDOS] ON

INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (1, 1, CAST(N'2026-08-15' AS Date), N'Club Las Palmas', NULL, N'G 2-1', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (2, 1, CAST(N'2026-08-22' AS Date), N'General Paz Juniors', NULL, N'E 1-1', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (101, 1, CAST(N'2026-03-21' AS Date), N'Almirante Brown', N'Visitante', N'P 2-6', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (102, 1, CAST(N'2026-05-30' AS Date), N'Ituzaingó', N'Local', N'G 1-0', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (103, 1, CAST(N'2026-07-02' AS Date), N'Alumni', N'Local', N'G 2-0', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (104, 1, CAST(N'2026-08-01' AS Date), N'Racing de Córdoba', N'Local', N'G 2-1', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (105, 1, CAST(N'2026-08-31' AS Date), N'Deportivo Laferrere', N'Visitante', N'P 0-1', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (106, 1, CAST(N'2026-09-08' AS Date), N'Dock Sud', N'Local', N'G 1-0', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (107, 1, CAST(N'2026-09-12' AS Date), N'Luján', N'Visitante', N'G 3-1', NULL)
INSERT [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido], [FK_id_categoria], [fecha_partido], [rival], [condicion_localia], [resultado], [observaciones]) VALUES (108, 1, CAST(N'2026-09-19' AS Date), N'Argentino de Rosario', N'Local', N'G 2-0', NULL)
SET IDENTITY_INSERT [dbo].[HISTORIAL_PARTIDOS] OFF
GO
SET IDENTITY_INSERT [dbo].[JUGADORES] ON

INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (11, 11, 1, N'Club Local', 1, N'DELANTERO', CAST(72.50 AS Decimal(5, 2)), CAST(1.77 AS Decimal(4, 2)), N'Derecho', N'0+')
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (12, 12, 1, N'Club Local', 1, N'Defensor', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (13, 13, 1, N'Club Local', 1, N'Mediocampista', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (14, 14, 1, N'Club Local', 1, N'Arquero', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (15, 15, 2, N'Club Local', 1, N'Defensor', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (16, 16, 2, N'Club Local', 1, N'Mediocampista', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (17, 17, 2, N'Club Local', 1, N'Delantero', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (18, 18, 2, N'Club Local', 1, N'Arquero', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (19, 19, 3, N'Club Local', 1, N'Defensor', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (20, 20, 13, N'Club Local', 1, N'Delantera', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (22, 1003, 1, NULL, 0, N'DELANTERO', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (23, 1004, 1, NULL, 1, N'DELANTERO', NULL, CAST(1.77 AS Decimal(4, 2)), NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (32, 1013, 13, N'Camioneros', 1, N'ARQUERO', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (36, 1020, 3, N'Camioneros', 1, N'DEFENSOR', NULL, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES] ([PK_id_jugador], [FK_id_persona], [FK_id_categoria], [club_origen], [ficha_medica_liga], [posicion_cancha], [peso], [altura], [pie_habil], [grupo_sanguineo]) VALUES (37, 1022, 13, N'Camioneros', 1, N'ARQUERO', NULL, NULL, NULL, NULL)
SET IDENTITY_INSERT [dbo].[JUGADORES] OFF
GO
SET IDENTITY_INSERT [dbo].[JUGADORES_PARTIDOS] ON

INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (101, 101, 11, 10, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (102, 102, 11, 20, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (103, 103, 11, 50, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (104, 104, 11, 5, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (105, 105, 11, 45, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (106, 106, 11, 90, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (107, 107, 11, 60, NULL, NULL, NULL)
INSERT [dbo].[JUGADORES_PARTIDOS] ([PK_id_jugador_partido], [FK_id_partido], [FK_id_jugador], [minutos_jugados], [goles], [tarjetas_amarillas], [tarjeta_roja]) VALUES (108, 108, 11, 90, NULL, NULL, NULL)
SET IDENTITY_INSERT [dbo].[JUGADORES_PARTIDOS] OFF
GO
SET IDENTITY_INSERT [dbo].[JUGADORES_RESPONSABLES] ON

INSERT [dbo].[JUGADORES_RESPONSABLES] ([PK_id_jugador_responsable], [FK_id_responsable], [FK_id_jugador], [parentesco]) VALUES (1, 1, 36, N'PADRE')
INSERT [dbo].[JUGADORES_RESPONSABLES] ([PK_id_jugador_responsable], [FK_id_responsable], [FK_id_jugador], [parentesco]) VALUES (2, 2, 37, N'tio')
SET IDENTITY_INSERT [dbo].[JUGADORES_RESPONSABLES] OFF
GO
SET IDENTITY_INSERT [dbo].[PERSONAS] ON

INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1, N'Masculino', CAST(N'2007-03-15' AS Date), N'47265479', N'JULIAN', N'ARRASCAETA', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (2, N'Masculino', CAST(N'2007-06-20' AS Date), N'47473488', N'SANTINO DAVID', N'BARRETO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (3, N'Masculino', CAST(N'2007-01-10' AS Date), N'47001022', N'LUCIANO', N'CAMMERTONI', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (4, N'Masculino', CAST(N'2007-09-05' AS Date), N'47249871', N'AGUSTÍN', N'CAMPOS', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (5, N'Masculino', CAST(N'2008-02-12' AS Date), N'48126446', N'AGUSTÍN', N'ALESSANDRINI', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (6, N'Masculino', CAST(N'2008-04-18' AS Date), N'48537550', N'BENJAMÍN ALEJO', N'ALLENDE', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (7, N'Masculino', CAST(N'2008-07-22' AS Date), N'48754845', N'BAUTISTA', N'ARGÜELLO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (8, N'Masculino', CAST(N'2008-11-30' AS Date), N'48533629', N'KEVIN GUSTAVO', N'ARGÜELLO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (9, N'Masculino', CAST(N'2009-03-11' AS Date), N'49112233', N'LUCAS', N'GÓMEZ', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (10, N'Femenino', CAST(N'2006-05-14' AS Date), N'46112233', N'MARTINA', N'PEREYRA', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (11, N'Masculino', CAST(N'2009-07-16' AS Date), N'47265479', N'JULIAN', N'ARRASCAETA', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (12, N'Masculino', CAST(N'2007-06-20' AS Date), N'47473488', N'SANTINO DAVID', N'BARRETO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (13, N'Masculino', CAST(N'2007-01-10' AS Date), N'47001022', N'LUCIANO', N'CAMMERTONI', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (14, N'Masculino', CAST(N'2007-09-05' AS Date), N'47249871', N'AGUSTÍN', N'CAMPOS', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (15, N'Masculino', CAST(N'2008-02-12' AS Date), N'48126446', N'AGUSTÍN', N'ALESSANDRINI', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (16, N'Masculino', CAST(N'2008-04-18' AS Date), N'48537550', N'BENJAMÍN ALEJO', N'ALLENDE', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (17, N'Masculino', CAST(N'2008-07-22' AS Date), N'48754845', N'BAUTISTA', N'ARGÜELLO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (18, N'Masculino', CAST(N'2008-11-30' AS Date), N'48533629', N'KEVIN GUSTAVO', N'ARGÜELLO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (19, N'Masculino', CAST(N'2009-03-11' AS Date), N'49586213', N'MÁXIMO VALENTÍN', N'ABREGÚ', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (20, N'Femenino', CAST(N'2003-09-02' AS Date), N'45092372', N'YAMILA ELIZABETH', N'BELIS CABALLERO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (21, N'Masculino', CAST(N'1980-01-01' AS Date), N'25111222', N'Mariano', N'Zárate', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (22, N'Masculino', CAST(N'1975-05-12' AS Date), N'22333444', N'Rubén', N'Del Olmo', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (23, N'Masculino', CAST(N'1988-09-20' AS Date), N'32444555', N'Sebastián', N'Crespo', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1003, NULL, CAST(N'2019-04-02' AS Date), N'44720266', N'lucas', N'cornejo', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1004, NULL, CAST(N'2001-08-21' AS Date), N'321423423', N'facundo', N'zabala', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1013, NULL, CAST(N'2003-01-22' AS Date), N'44241234', N'Flavia', N'Degani', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1020, NULL, CAST(N'2009-02-22' AS Date), N'312412412', N'Enzo', N'Mendoza', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1021, NULL, NULL, N'123123132', N'Nejo', N'CORNEJO', NULL)
INSERT [dbo].[PERSONAS] ([PK_id_persona], [genero], [fecha_de_nacimiento], [dni], [nombre], [apellido], [domicilio]) VALUES (1022, NULL, CAST(N'2009-03-02' AS Date), N'14342423', N'dwadad', N'dwadwad', NULL)
SET IDENTITY_INSERT [dbo].[PERSONAS] OFF
GO
SET IDENTITY_INSERT [dbo].[RESPONSABLES] ON

INSERT [dbo].[RESPONSABLES] ([PK_id_responsable], [FK_id_persona], [email], [telefono]) VALUES (1, 1021, N'Lucas.nejo5@gmail.com', N'02954649786')
INSERT [dbo].[RESPONSABLES] ([PK_id_responsable], [FK_id_persona], [email], [telefono]) VALUES (2, 1003, N'adewdawd@gmail.com', N'02954649786')
SET IDENTITY_INSERT [dbo].[RESPONSABLES] OFF
GO
SET IDENTITY_INSERT [dbo].[ROLES] ON

INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (1, N'Administrador (Tesorero)', N'ACCESO_TOTAL')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (2, N'Administrativo', N'FINANZAS_PAGOS_DEUDA')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (3, N'Médico', N'SALUD_FICHAS_MEDICAS')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (4, N'Director Técnico', N'DEPORTIVO_CATEGORIA')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (5, N'Don QR', N'ASISTENCIA_SEMAFORO_QR')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (6, N'Preparador Físico', N'DEPORTIVO_CATEGORIA_FISICO')
INSERT [dbo].[ROLES] ([PK_id_rol], [nombre_rol], [permisos]) VALUES (7, N'Coordinador', N'DEPORTIVO_GENERAL')
SET IDENTITY_INSERT [dbo].[ROLES] OFF
GO
SET IDENTITY_INSERT [dbo].[STAFF] ON

INSERT [dbo].[STAFF] ([PK_id_staff], [FK_id_usuario]) VALUES (21, 21)
INSERT [dbo].[STAFF] ([PK_id_staff], [FK_id_usuario]) VALUES (22, 22)
INSERT [dbo].[STAFF] ([PK_id_staff], [FK_id_usuario]) VALUES (23, 23)
SET IDENTITY_INSERT [dbo].[STAFF] OFF
GO
SET IDENTITY_INSERT [dbo].[USUARIOS] ON

INSERT [dbo].[USUARIOS] ([PK_id_usuario], [FK_id_persona], [FK_id_rol], [email], [contrasenia], [activo]) VALUES (21, 21, 1, N'mzarate', N'$2a$11$e90NjeQtkxL.zEP7Eb3LwuxMkOR/iwf.yF1P78hCBh3wefMFALORW', 1)
INSERT [dbo].[USUARIOS] ([PK_id_usuario], [FK_id_persona], [FK_id_rol], [email], [contrasenia], [activo]) VALUES (22, 22, 7, N'rdelolmo', N'$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 1)
INSERT [dbo].[USUARIOS] ([PK_id_usuario], [FK_id_persona], [FK_id_rol], [email], [contrasenia], [activo]) VALUES (23, 23, 3, N'screspo', N'$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 1)
SET IDENTITY_INSERT [dbo].[USUARIOS] OFF
GO
ALTER TABLE [dbo].[ASISTENCIAS]  WITH CHECK ADD  CONSTRAINT [FK_ASISTENCIAS_JUGADORES] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[ASISTENCIAS] CHECK CONSTRAINT [FK_ASISTENCIAS_JUGADORES]
GO
ALTER TABLE [dbo].[ASISTENCIAS]  WITH CHECK ADD  CONSTRAINT [FK_ASISTENCIAS_STAFF] FOREIGN KEY([FK_id_staff])
REFERENCES [dbo].[STAFF] ([PK_id_staff])
GO
ALTER TABLE [dbo].[ASISTENCIAS] CHECK CONSTRAINT [FK_ASISTENCIAS_STAFF]
GO
ALTER TABLE [dbo].[FICHAS_MEDICAS]  WITH CHECK ADD  CONSTRAINT [FK_FICHAS_MEDICAS_JUGADORES] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[FICHAS_MEDICAS] CHECK CONSTRAINT [FK_FICHAS_MEDICAS_JUGADORES]
GO
ALTER TABLE [dbo].[HISTORIAL_PARTIDOS]  WITH CHECK ADD  CONSTRAINT [FK_HISTORIAL_CATEGORIA] FOREIGN KEY([FK_id_categoria])
REFERENCES [dbo].[CATEGORIAS] ([PK_id_categoria])
GO
ALTER TABLE [dbo].[HISTORIAL_PARTIDOS] CHECK CONSTRAINT [FK_HISTORIAL_CATEGORIA]
GO
ALTER TABLE [dbo].[JUGADORES]  WITH CHECK ADD  CONSTRAINT [FK_JUGADORES_CATEGORIAS] FOREIGN KEY([FK_id_categoria])
REFERENCES [dbo].[CATEGORIAS] ([PK_id_categoria])
GO
ALTER TABLE [dbo].[JUGADORES] CHECK CONSTRAINT [FK_JUGADORES_CATEGORIAS]
GO
ALTER TABLE [dbo].[JUGADORES]  WITH CHECK ADD  CONSTRAINT [FK_JUGADORES_PERSONAS] FOREIGN KEY([FK_id_persona])
REFERENCES [dbo].[PERSONAS] ([PK_id_persona])
GO
ALTER TABLE [dbo].[JUGADORES] CHECK CONSTRAINT [FK_JUGADORES_PERSONAS]
GO
ALTER TABLE [dbo].[JUGADORES_DESCUENTOS]  WITH CHECK ADD  CONSTRAINT [FK_JUGDESC_JUGADORES] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[JUGADORES_DESCUENTOS] CHECK CONSTRAINT [FK_JUGDESC_JUGADORES]
GO
ALTER TABLE [dbo].[JUGADORES_DESCUENTOS]  WITH CHECK ADD  CONSTRAINT [FK_JUGDESC_TIPODESC] FOREIGN KEY([FK_id_descuento])
REFERENCES [dbo].[TIPOS_DESCUENTO] ([PK_id_descuento])
GO
ALTER TABLE [dbo].[JUGADORES_DESCUENTOS] CHECK CONSTRAINT [FK_JUGDESC_TIPODESC]
GO
ALTER TABLE [dbo].[JUGADORES_PARTIDOS]  WITH CHECK ADD  CONSTRAINT [FK_JUGPART_JUGADOR] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[JUGADORES_PARTIDOS] CHECK CONSTRAINT [FK_JUGPART_JUGADOR]
GO
ALTER TABLE [dbo].[JUGADORES_PARTIDOS]  WITH CHECK ADD  CONSTRAINT [FK_JUGPART_PARTIDO] FOREIGN KEY([FK_id_partido])
REFERENCES [dbo].[HISTORIAL_PARTIDOS] ([PK_id_partido])
GO
ALTER TABLE [dbo].[JUGADORES_PARTIDOS] CHECK CONSTRAINT [FK_JUGPART_PARTIDO]
GO
ALTER TABLE [dbo].[JUGADORES_RESPONSABLES]  WITH CHECK ADD  CONSTRAINT [FK_JugRes_JUGADORES] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[JUGADORES_RESPONSABLES] CHECK CONSTRAINT [FK_JugRes_JUGADORES]
GO
ALTER TABLE [dbo].[JUGADORES_RESPONSABLES]  WITH CHECK ADD  CONSTRAINT [FK_JugRes_RESPONSABLES] FOREIGN KEY([FK_id_responsable])
REFERENCES [dbo].[RESPONSABLES] ([PK_id_responsable])
GO
ALTER TABLE [dbo].[JUGADORES_RESPONSABLES] CHECK CONSTRAINT [FK_JugRes_RESPONSABLES]
GO
ALTER TABLE [dbo].[PAGOS]  WITH CHECK ADD  CONSTRAINT [FK_PAGOS_JUGADORES] FOREIGN KEY([FK_id_jugador])
REFERENCES [dbo].[JUGADORES] ([PK_id_jugador])
GO
ALTER TABLE [dbo].[PAGOS] CHECK CONSTRAINT [FK_PAGOS_JUGADORES]
GO
ALTER TABLE [dbo].[PAGOS]  WITH CHECK ADD  CONSTRAINT [FK_PAGOS_JUGDESC] FOREIGN KEY([FK_id_jugador_descuento])
REFERENCES [dbo].[JUGADORES_DESCUENTOS] ([PK_id_jugador_descuento])
GO
ALTER TABLE [dbo].[PAGOS] CHECK CONSTRAINT [FK_PAGOS_JUGDESC]
GO
ALTER TABLE [dbo].[RESPONSABLES]  WITH CHECK ADD  CONSTRAINT [FK_RESPONSABLES_PERSONAS] FOREIGN KEY([FK_id_persona])
REFERENCES [dbo].[PERSONAS] ([PK_id_persona])
GO
ALTER TABLE [dbo].[RESPONSABLES] CHECK CONSTRAINT [FK_RESPONSABLES_PERSONAS]
GO
ALTER TABLE [dbo].[STAFF]  WITH CHECK ADD  CONSTRAINT [FK_STAFF_USUARIOS] FOREIGN KEY([FK_id_usuario])
REFERENCES [dbo].[USUARIOS] ([PK_id_usuario])
GO
ALTER TABLE [dbo].[STAFF] CHECK CONSTRAINT [FK_STAFF_USUARIOS]
GO
ALTER TABLE [dbo].[STAFF_CATEGORIAS]  WITH CHECK ADD  CONSTRAINT [FK_STAFFCAT_CATEGORIAS] FOREIGN KEY([FK_id_categoria])
REFERENCES [dbo].[CATEGORIAS] ([PK_id_categoria])
GO
ALTER TABLE [dbo].[STAFF_CATEGORIAS] CHECK CONSTRAINT [FK_STAFFCAT_CATEGORIAS]
GO
ALTER TABLE [dbo].[STAFF_CATEGORIAS]  WITH CHECK ADD  CONSTRAINT [FK_STAFFCAT_STAFF] FOREIGN KEY([FK_id_staff])
REFERENCES [dbo].[STAFF] ([PK_id_staff])
GO
ALTER TABLE [dbo].[STAFF_CATEGORIAS] CHECK CONSTRAINT [FK_STAFFCAT_STAFF]
GO
ALTER TABLE [dbo].[USUARIOS]  WITH CHECK ADD  CONSTRAINT [FK_USUARIOS_PERSONAS] FOREIGN KEY([FK_id_persona])
REFERENCES [dbo].[PERSONAS] ([PK_id_persona])
GO
ALTER TABLE [dbo].[USUARIOS] CHECK CONSTRAINT [FK_USUARIOS_PERSONAS]
GO
ALTER TABLE [dbo].[USUARIOS]  WITH CHECK ADD  CONSTRAINT [FK_USUARIOS_ROLES] FOREIGN KEY([FK_id_rol])
REFERENCES [dbo].[ROLES] ([PK_id_rol])
GO
ALTER TABLE [dbo].[USUARIOS] CHECK CONSTRAINT [FK_USUARIOS_ROLES]
GO
USE [master]
GO
ALTER DATABASE [ClubCamioneros] SET  READ_WRITE
GO

USE [ClubCamioneros]
GO
IF COL_LENGTH(N'dbo.CATEGORIAS', N'asociacion') IS NULL
BEGIN
    ALTER TABLE [dbo].[CATEGORIAS] ADD [asociacion] [varchar](50) NULL;
    EXEC(N'UPDATE [dbo].[CATEGORIAS]
           SET [asociacion] = CASE
               WHEN [nombre_categoria] LIKE ''%AFA%'' THEN ''AFA''
               ELSE ''Liga Cordobesa''
           END;');
END
GO
IF OBJECT_ID(N'dbo.JUGADORES_CATEGORIAS', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[JUGADORES_CATEGORIAS]
    (
        [PK_id_jugador_categoria] [int] IDENTITY(1,1) NOT NULL,
        [FK_id_jugador] [int] NOT NULL,
        [FK_id_categoria] [int] NOT NULL,
        [fecha_asignacion] [datetime] NULL
            CONSTRAINT [DF_JUGADORES_CATEGORIAS_fecha_asignacion] DEFAULT (GETDATE()),
        CONSTRAINT [PK_JUGADORES_CATEGORIAS] PRIMARY KEY CLUSTERED ([PK_id_jugador_categoria]),
        CONSTRAINT [UQ_JUGADORES_CATEGORIAS] UNIQUE ([FK_id_jugador], [FK_id_categoria]),
        CONSTRAINT [FK_JUGCAT_JUGADORES] FOREIGN KEY ([FK_id_jugador])
            REFERENCES [dbo].[JUGADORES] ([PK_id_jugador]),
        CONSTRAINT [FK_JUGCAT_CATEGORIAS] FOREIGN KEY ([FK_id_categoria])
            REFERENCES [dbo].[CATEGORIAS] ([PK_id_categoria])
    );

    INSERT INTO [dbo].[JUGADORES_CATEGORIAS] ([FK_id_jugador], [FK_id_categoria])
    SELECT [PK_id_jugador], [FK_id_categoria]
    FROM [dbo].[JUGADORES]
    WHERE [FK_id_categoria] IS NOT NULL;
END
GO


USE [ClubCamioneros]
GO
-- Extensión requerida por la funcionalidad de credenciales QR.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
IF COL_LENGTH(N'dbo.ASISTENCIAS', N'observaciones') IS NULL
    ALTER TABLE dbo.ASISTENCIAS ADD observaciones NVARCHAR(500) NULL;
IF OBJECT_ID(N'dbo.CREDENCIALES_QR', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.CREDENCIALES_QR(
  id_credencial UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CREDENCIALES_QR PRIMARY KEY,
  FK_id_persona INT NOT NULL,
  activa BIT NOT NULL CONSTRAINT DF_CREDENCIALES_QR_activa DEFAULT(1),
  fecha_emision DATETIME2 NOT NULL CONSTRAINT DF_CREDENCIALES_QR_fecha_emision DEFAULT(SYSUTCDATETIME()),
  fecha_revocacion DATETIME2 NULL,
  CONSTRAINT FK_CREDENCIALES_QR_PERSONAS FOREIGN KEY(FK_id_persona) REFERENCES dbo.PERSONAS(PK_id_persona)
 );
END;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.CREDENCIALES_QR') AND name=N'UX_CREDENCIALES_QR_PERSONA_ACTIVA')
 CREATE UNIQUE INDEX UX_CREDENCIALES_QR_PERSONA_ACTIVA ON dbo.CREDENCIALES_QR(FK_id_persona) WHERE activa=1 AND fecha_revocacion IS NULL;
GO
