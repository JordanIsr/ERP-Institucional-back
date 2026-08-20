# ERP Institucional — flujo académico

## Roles

- **Administrador:** periodos, catálogos, carreras, mallas, niveles, asignaturas, carreras por periodo, paralelos, cupos y docentes.
- **Secretaría:** estudiantes nuevos, solicitudes, documentos y matrícula oficial.
- **Docente:** registro de NP1, NP2 y recuperación.
- **Estudiante:** solicitud de matrícula e historial propio.

## Regla principal

Periodo y carrera se crean como ramas independientes. `periodo_carrera` las relaciona y conserva la versión histórica de la malla, centro y jornada. Al crear una asociación sin `versionMallaId`, el backend hereda la malla `ACTIVA` de la carrera.

## Preparación de matrícula

La oferta inicial consolida carrera, periodo, jornada, centro, malla, paralelos, ocupados y disponibles. Un paralelo solo está listo cuando contiene todas las asignaturas del nivel con docente y conserva al menos un cupo disponible.

## Verificación

```powershell
npm install
npm run build
npm test -- --runInBand
npm run start:dev
```
