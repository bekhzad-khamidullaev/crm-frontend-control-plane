# Telephony Settings Spec: WebSocket + Internal Numbers

## 1) Scope
This spec defines two admin sections for telephony integration settings:
- WebSocket / realtime transport settings.
- Internal numbers mapping for CRM users.

Goal: remove ambiguity in setup flow and provide implementation-ready UI + API contract.

## 2) What exists now (fact-based)
Current backend/frontend contracts:
- `GET/PATCH /api/voip/system-settings/current/` for global telephony runtime settings (`ami_*`, `incoming_*`, `webrtc_*`, `telephony_route_mode`, `telephony_provider`, `forward_*`).
- `GET /api/voip/internal-numbers/` and `GET /api/voip/internal-numbers/{id}/` are read-only in API (`ReadOnlyModelViewSet`).
- `GET /api/profiles/me/telephony-credentials/` and `PATCH /api/profiles/me/telephony-credentials/` exist for per-user telephony credentials endpoint.

Important constraint:
- Full CRUD for internal number assignment is not available via current public API. For admin editing, backend extension is required.

## 3) IA (Information Architecture)
Entry points:
- Integrations modal: `/integrations` -> "Настройка телефонии"
- Dedicated page: `/telephony` (recommended for advanced admin)

Sections inside Telephony Settings:
1. `Connection` (existing)
2. `Routing` (existing)
3. `WebSocket & Realtime` (new explicit section)
4. `Internal Numbers` (new explicit section)

## 4) Antd component structure

## 4.1 WebSocket & Realtime section
Top-level layout:
- `Card title="WebSocket и realtime"`
- `Alert type="info"` with short explanation.
- `Form layout="vertical"` for settings.
- `Space` for action buttons.
- `Divider` + diagnostics panel.

Fields and components:
- `ws_enabled`: `Switch` (label: "Включить realtime WebSocket")
- `ws_url`: `Input` (placeholder `wss://pbx.example.com/ws/calls/`)
- `ws_auth_mode`: `Select` (`token`, `query_token`, `none`)
- `ws_token`: `Input.Password` (visible only for `token`)
- `ws_reconnect_enabled`: `Switch`
- `ws_reconnect_max_attempts`: `InputNumber` (min 0, max 100)
- `ws_reconnect_base_delay_ms`: `InputNumber` (min 100, max 60000)
- `ws_reconnect_max_delay_ms`: `InputNumber` (min 100, max 120000)
- `ws_heartbeat_interval_sec`: `InputNumber` (min 5, max 120)
- `ws_heartbeat_timeout_sec`: `InputNumber` (min 5, max 120)
- `incoming_enabled`: `Switch` (reuse existing)
- `incoming_popup_ttl_ms`: `InputNumber` (reuse existing)
- `incoming_poll_interval_ms`: `InputNumber` (reuse existing fallback polling)

Actions:
- `Button type="default"` -> `Проверить WebSocket`
- `Button type="default"` -> `Проверить fallback polling`
- `Button type="primary"` -> `Сохранить`

Diagnostics block:
- `Descriptions size="small"`:
  - Transport status (`connected|connecting|degraded|offline`)
  - Last connect time
  - Last event time
  - Last heartbeat RTT
  - Reconnect attempts
- `Table` for recent errors:
  - columns: `time`, `code`, `reason`, `hint`

## 4.2 Internal Numbers section
Top-level layout:
- `Card title="Внутренние номера пользователей"`
- `Alert type="warning"` for conflict rules.
- `Space` with filters and bulk actions.
- `Table` editable rows.
- `Drawer` for add/edit row.

Toolbar:
- `Input.Search` for user/extension
- `Select` filter by status (`active`, `inactive`, `conflict`, `unassigned`)
- `Button` -> `Синхронизировать из PBX`
- `Button` -> `Проверить конфликты`
- `Button type="primary"` -> `Добавить назначение`

Table columns:
- `user` (CRM user full name)
- `number` (extension)
- `display_name`
- `sip_uri` (read-only)
- `active` (`Switch` with confirm)
- `status` (`Tag`: `ok`, `conflict`, `missing_in_pbx`, `inactive_user`)
- `actions` (`Редактировать`, `Удалить`)

Drawer form fields:
- `user_id`: `Select` (remote search)
- `number`: `Input`
- `display_name`: `Input`
- `active`: `Switch`

Validation UX:
- Inline error text under field.
- Save blocked if extension conflicts.
- Conflict badge in table row.

## 5) Frontend module split
Recommended files:
- `src/components/telephony/TelephonyRealtimeSettingsCard.jsx`
- `src/components/telephony/InternalNumbersAdminTable.jsx`
- `src/components/telephony/InternalNumberEditDrawer.jsx`
- `src/lib/api/telephonySettings.js` (optional thin wrapper over `lib/api/telephony.js`)

State boundaries:
- Realtime settings form state is isolated from internal numbers state.
- Save actions are independent (separate submit buttons and loading flags).

## 6) API contract

## 6.1 Current API (can implement immediately)

A) Read/write system telephony settings:
- `GET /api/voip/system-settings/current/`
- `PATCH /api/voip/system-settings/current/`

Payload example (current supported fields):
```json
{
  "ami_host": "10.0.0.20",
  "ami_port": 5038,
  "ami_username": "crm_ami",
  "ami_secret": "***",
  "ami_use_ssl": true,
  "ami_connect_timeout": 5,
  "ami_reconnect_delay": 5,
  "incoming_enabled": true,
  "incoming_poll_interval_ms": 4000,
  "incoming_popup_ttl_ms": 20000,
  "telephony_route_mode": "bridge",
  "telephony_provider": "Asterisk",
  "webrtc_stun_servers": "stun:stun.l.google.com:19302",
  "webrtc_turn_enabled": false,
  "webrtc_turn_server": "",
  "webrtc_turn_username": "",
  "webrtc_turn_password": "",
  "forward_unknown_calls": false,
  "forward_url": "",
  "forwarding_allowed_ip": ""
}
```

B) Read internal numbers (current read-only):
- `GET /api/voip/internal-numbers/?page=1&page_size=50&search=200`
- `GET /api/voip/internal-numbers/{id}/`

Response example:
```json
{
  "id": 17,
  "number": "205",
  "display_name": "Sales Agent 205",
  "user_name": "Иван Петров",
  "sip_uri": "sip:205@pbx.local",
  "active": true
}
```

C) Read/write per-user telephony credentials:
- `GET /api/profiles/me/telephony-credentials/`
- `PATCH /api/profiles/me/telephony-credentials/`

## 6.2 Required backend extension (to satisfy full admin flow)

### 6.2.1 WebSocket config endpoints
Add explicit endpoints to avoid overloading unrelated fields:
- `GET /api/voip/realtime-settings/current/`
- `PATCH /api/voip/realtime-settings/current/`
- `POST /api/voip/realtime-settings/test/`

Proposed payload:
```json
{
  "ws_enabled": true,
  "ws_url": "wss://pbx.example.com/ws/calls/",
  "ws_auth_mode": "token",
  "ws_token": "***",
  "ws_reconnect_enabled": true,
  "ws_reconnect_max_attempts": 15,
  "ws_reconnect_base_delay_ms": 1000,
  "ws_reconnect_max_delay_ms": 15000,
  "ws_heartbeat_interval_sec": 20,
  "ws_heartbeat_timeout_sec": 10,
  "polling_fallback_enabled": true,
  "incoming_poll_interval_ms": 4000
}
```

Test response example:
```json
{
  "ok": true,
  "status": "connected",
  "latency_ms": 82,
  "server_version": "asterisk-20",
  "checked_at": "2026-03-24T09:30:00Z"
}
```

### 6.2.2 Internal numbers admin CRUD endpoints
Change read-only viewset to managed viewset (admin/operator with permission):
- `GET /api/voip/internal-numbers/`
- `POST /api/voip/internal-numbers/`
- `PATCH /api/voip/internal-numbers/{id}/`
- `DELETE /api/voip/internal-numbers/{id}/`
- `POST /api/voip/internal-numbers/validate/`
- `POST /api/voip/internal-numbers/sync/`

Create payload:
```json
{
  "user": 42,
  "number": "205",
  "display_name": "Sales Agent 205",
  "active": true
}
```

Create/patch response:
```json
{
  "id": 17,
  "user": 42,
  "user_name": "Иван Петров",
  "number": "205",
  "display_name": "Sales Agent 205",
  "sip_uri": "sip:205@pbx.local",
  "active": true,
  "status": "ok",
  "warnings": []
}
```

Validation payload:
```json
{
  "number": "205",
  "user": 42
}
```

Validation response:
```json
{
  "valid": false,
  "errors": [
    {
      "field": "number",
      "code": "duplicate_extension",
      "message": "Внутренний номер уже назначен пользователю 'Оператор 1'"
    }
  ]
}
```

## 7) Permissions (RBAC)
- View settings: `voip.view_voipsettings` or admin.
- Update settings: `voip.change_voipsettings`.
- View internal numbers: `voip.view_internalnumber`.
- Manage internal numbers: `voip.change_internalnumber` (newly enforced for CRUD).

Frontend gating:
- Hide Save buttons if no write permission.
- Keep diagnostics visible in read-only mode.

## 8) Validation rules (strict)
WebSocket:
- `ws_url` must be `ws://` or `wss://`.
- heartbeat timeout must be `< interval * 2`.
- reconnect max delay must be `>= base delay`.

Internal numbers:
- `number` regex: `^\d{3,6}$` (or server-specific pattern).
- Unique active extension per PBX server.
- One active internal number per active CRM user (unless multi-device mode is explicitly enabled).

## 9) Implementation sequence
1. Frontend: add two cards/sections with current read-only + current system-settings write.
2. Backend: add realtime-settings endpoint and internal-number CRUD/validate/sync.
3. Frontend: enable write mode and conflict handling UI.
4. QA: end-to-end checks with test call scenario.

## 10) Acceptance criteria
- Admin can configure realtime transport and verify connection from UI.
- Admin can assign/change/remove internal numbers from UI.
- Duplicate extension conflict is blocked with clear inline message.
- On incoming call, assigned user receives popup and flow continues to card/lead handling.
- All critical actions are covered by audit log entries (create/update/delete/test).
