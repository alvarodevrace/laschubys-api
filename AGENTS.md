# AGENTS.md — Las Chubys Backend

> Instrucciones de proyecto para Kimi Code operando en `LasChubys-Back`.
> Lee siempre `../../KIMI.md`, `../../agents/KIMI-AGENTS.md` y `../../vault/laschubys/00-Index/INDEX.md` antes de este archivo.

## Proyecto

| Campo            | Valor                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Nombre           | Las Chubys — Backend                                                                                                           |
| Repo             | https://github.com/alvarodevrace/laschubys-api                                                                                 |
| Stack            | NestJS 11, Supabase (Postgres 15), Supabase Auth, class-validator, class-transformer, cache-manager, throttler, helmet, Sentry |
| Package manager  | Bun                                                                                                                            |
| Rama default     | `main`                                                                                                                         |
| Rama integración | `develop`                                                                                                                      |

## Agentes que operan aquí

| Agente     | Rol en este proyecto                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| KIMI-TRIN  | Orquestador. Abre/mergea PRs, coordina QA, nunca aprueba su propio PR.       |
| KIMI-PIXEL | Dueño del código NestJS. Implementa módulos, servicios, DTOs, guards.        |
| KIMI-LINK  | Integra workflows de n8n cuando el backend expone webhooks o consume APIs.   |
| KIMI-NOVA  | QA: tests unitarios/e2e, typecheck, build. Nunca modifica código productivo. |

## Stack y convenciones técnicas

- NestJS 11 con Fastify adapter si está configurado; de lo contrario, seguir el adapter actual.
- Módulos por dominio bajo `src/modules/`.
- DTOs con `class-validator` + `class-transformer`.
- Auth vía Supabase Auth / tokens de sesión; guards validan sesión contra Supabase.
- Interceptores para logging/errores.
- Servicio de Supabase con service role key solo en backend; nunca exponer al frontend.
- Estructura actual:
  ```
  src/
    modules/     # admin, auth, checkout, comments, contact, content, health, supabase
    shared/      # config, csrf, http, types
  ```
- No lógica de negocio en controllers; controllers delegan a services.
- Manejo de errores centralizado; no devolver stack traces en producción.

## Scripts obligatorios antes de entregar

```bash
bun run typecheck
bun run test
bun run build
```

## Flujo Git (LEY DE RAMAS)

```
rama feature (feature/LCH-N-nombre) → commits locales → build/test OK
→ push feature/LCH-N-nombre
→ PR feature → develop
→ NOVA QA pass + CI verde
→ Álvaro aprueba → merge a develop
→ PR develop → main
→ Álvaro aprueba → merge → deploy Dokploy
```

- Nunca push directo a `main` ni `develop`.
- Nunca merge a `develop` sin QA de NOVA.
- Nombres de rama: `feature/LCH-N-nombre-corto`.
- TRIN nunca aprueba su propio PR; solo Álvaro aprueba.

## Reglas de frontera

- PIXEL no modifica schema de Supabase sin seguir `Protocol RX` de `../../agents/KIMI-AGENTS.md`.
- LINK no toca lógica de negocio; solo integraciones n8n/webhooks.
- NOVA solo reporta; si encuentra bug, crea ticket/comentario y asigna a PIXEL.
- Cambios RLS/RPC críticos requieren pre-mortem y aprobación de TRIN/Álvaro.

## Memoria del proyecto

- Decisiones técnicas: `../../vault/laschubys/20-Tech/decisions/`.
- Especificaciones de producto: `../../vault/laschubys/30-Product/specs/`.
- Log diario: `../../vault/laschubys/10-Log/LOG.md`.
