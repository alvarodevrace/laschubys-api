# Protocol RX — Migración `20260908000000_add_gateway_order_id`

**Fecha:** 2026-09-08
**Actor:** KIMICO (orquestador) + subagente general (ejecución)
**Repositorio:** alvarodevrace/laschubys-api

## 1. DISEÑO — qué cambia exactamente

- `ALTER TABLE laschubys.donations ADD COLUMN gateway_order_id text;`
- `CREATE INDEX idx_donations_gateway_order_id ON laschubys.donations(gateway_order_id) WHERE gateway_order_id IS NOT NULL;`
- Nueva columna nullable (sin `NOT NULL`, sin default) → no rompe filas existentes ni inserts actuales.
- Propósito: persistir el PayPal order ID (ej. `0TH933110Y6246920`) al crear la orden, para poder resolver la donación en `capture` cuando PayPal no retorna `custom_id`.
- Código asociado: `createOrder` guarda `gatewayOrderId`; `capture` busca por `custom_id` → fallback `findByGatewayOrderId`.

## 2. PRE-MORTEM — 3 escenarios de fallo

1. **La columna ya existe** (migración corrida dos veces): `ALTER TABLE ... ADD COLUMN` fallaría con `duplicate column`. Mitigación: se verificó antes de aplicar (`information_schema.columns` → 0 filas); la migración es idempotente solo si se aplica una vez, estándar del proyecto.
2. **Índice parcial bloquea inserts** o degrada rendimiento: el índice es solo sobre `gateway_order_id` (bajo cardinalidad al inicio) y `WHERE IS NOT NULL` lo mantiene pequeño; no afecta el path de inserts porque es una columna más en la fila.
3. **Rollback necesario**: la columna es aditiva y nullable; un rollback es `ALTER TABLE ... DROP COLUMN gateway_order_id` + `DROP INDEX`, sin pérdida de datos existentes (las filas viejas tienen NULL).

## 3. CONTRATO — cómo verificar éxito

- `information_schema.columns` → la columna `gateway_order_id` existe en `laschubys.donations`.
- `\d laschubys.donations` → índice `idx_donations_gateway_order_id` presente.
- E2E sandbox: crear orden → aprobar en PayPal → captura → **front muestra confirmación** (antes: 500 `invalid input syntax for type uuid`).
- `bun run typecheck` + `bun run test` (29/29) en el repo.
- Smoke prod tras deploy: `POST /api/donations/paypal/capture` con un order id real retorna `{status: 'COMPLETED'}`.
