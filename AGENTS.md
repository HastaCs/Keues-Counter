# AGENTS.md

Contexto del proyecto para agentes y colaboradores. Léelo antes de tocar código.

## Qué es

**Keues-Counter** es el frontend del **puesto de mostrador** (counter) del sistema de gestión de colas **Keues**. Se ejecuta en una pantalla en cada puesto (carnicería, pescadería, verdulería, etc.) y permite:

- Elegir ubicación → flujo → puesto y guardar esa configuración en disco (archivo JSON local vía backend Rust).
- Llamar al siguiente turno y finalizarlo (flujo *TicketMachine*).
- Avisar que el puesto queda libre (flujo *SetFree*).
- Llamada manual de números (+1/−1/+10/−10, número local del puesto, flujo *ManualCall*).

Es una app de **Tauri 2 + React + Vite**. Se conecta a un backend ASP.NET (la API de Keues) que reenvía eventos al proyecto **Monitor** (aún no existe; los endpoints de SetFree/ManualCall devuelven 404 hasta que el usuario los cree).

La **TicketMachine** (máquina de tickets del mismo sistema) es **otro proyecto: solo lectura, NO tocar**.

## Idioma (obligatorio)

**La app es solo en inglés.** Todos los textos y labels visibles, comentarios, mensajes de error y nombres de identificadores (variables, funciones, métodos IPC) deben estar en inglés. No añadir strings ni comentarios en español; cualquier texto nuevo de UI se escribe en inglés. Al tocar código, mantener los nombres ya existentes en inglés (p.ej. `saveConfiguration`/`loadConfiguration`, `showConfig`, `counterName`, `selectedFlowType`).

## Stack

- Tauri 2 (backend Rust en `src-tauri/`), React 19, Vite 8, TypeScript 6, Mantine 9 (UI) + tabler-icons, @emotion/react.
- Scripts (`package.json`):
  - `pnpm dev` → Vite (renderer en `localhost:11220`).
  - `pnpm start` → `tauri dev` (arranca Vite + la app Tauri). **Es el comando normal del usuario.**
  - `pnpm build` → renderer (`dist/`).
  - `pnpm dist` → `tauri build` → compila todo y genera el instalador **NSIS**.
- Verificación obligatoria tras tocar código (sin errores):
  - `pnpm exec tsc -b`
  - `pnpm exec eslint .`
  - `pnpm exec vite build`
  - `cargo check` y `cargo clippy` en `src-tauri/`

## Flujo de dominio (validado contra API real en `localhost:5125`)

**Location → Flows + Counters.**

- **Location** (`/api/locations`): establecimiento. Campos: `id`, `name`, `color`.
- **Flow** (`/api/flows?locationId=X`): árbol de menús. Contiene `flowJson` (JSON del árbol); los nodos de tipo `ticket` tienen un `queueId`. `getFlowQueueIds(flow)` extrae esos `queueId`s. Campos: `id`, `name`, `flowType`, `flowJson`.
- **Counter** (`/api/counters?locationId=X`): puesto físico. Campos: `id`, `name`, `code`, `color`, `queues: string[]` (colas asignadas al puesto).
- El puesto llama turnos de sus colas. El filtro del selector de puestos usa `counter.queues ∩ queueIds del flujo`.

## Contrato API (keuesApi.ts)

Todas las listas vienen envueltas en `{data: [...]}`. Usar `json.data`.

- `GET /api/locations` → `{data: [Location]}`
- `GET /api/flows?locationId=X` → `{data: [Flow]}`
- `GET /api/flows/{id}` → **objeto directo** (no `{data}`). Usarlo siempre para el `flowJson` fresco (nunca un flujo guardado en estado React, puede estar obsoleto).
- `GET /api/counters?locationId=X` → `{data: [Counter]}`
- `POST .../call-next-ticket` → body `{counterId, flowId}`; respuesta `{ticketId, code}` o `null` si no hay turnos.
- `POST .../attend-ticket` → body `{counterId, ticketId, flowId}` → 200.
- `POST .../set-free` → body `{counterId, flowId}`. Ruta aún **stub**: devuelve 404. `setCounterFree` lanza error si `!ok`; el panel SetFree la llama aunque falle.
- `POST .../call-manual-ticket` → body `{code, flowId, locationId, counterId}`. Ruta aún **stub**: devuelve 404. `manualCall` lanza error si `!ok`; el panel ManualCall la llama aunque falle.

### FlowType (enum .NET)

- `0` = **TicketMachine**: botón "Call next" + "Finish".
- `1` = **SetFree**: solo botón "Mark as free" (endpoint aún no existe → 404).
- `2` = **ManualCall**: +1/−1/+10/−10, número local del puesto (endpoint aún no existe → 404).

## Estructura

- `src-tauri/src/main.rs`: comandos `load_config`/`save_config` (JSON en el dir de config de la app, `deviceId` con `uuid`), `get_proxy_base`/`set_proxy_target` y registro del plugin updater.
- `src-tauri/src/proxy.rs`: reverse-proxy local HTTP+WebSocket en `127.0.0.1:<puerto>` que reenvía al servidor real (evita mixed content/CORS desde el WebView).
- `src/main.tsx`: `MantineProvider` con `forceColorScheme="light"` (theme claro forzado).
- `src/App.tsx`: carga la config → si existe va directo a `CounterPanel`; estado `showConfig` para volver a Configuración sin perder la config en memoria; `onSaved` guarda y vuelve al panel. **Dueño de la conexión SignalR**: se conecta con la config y se reconecta en cada cambio de config (al guardar, aunque el usuario haya cambiado location/flow); la conexión se mantiene viva mientras se está en Configuración.
- `src/types/config.ts`: `AppConfiguration` (`server, locationId, flowId, counterId, flowType, locationName?, flowName?, counterName?, counterCode?, deviceName?, deviceId?`).
- `src/types/models.ts`: `Location`, `Counter`, `Ticket`, `Flow`, `FlowNode`.
- `src/api/appBridge.ts`: bridge con el backend Tauri (`saveConfiguration`/`loadConfiguration`/updater vía `invoke` y `@tauri-apps/plugin-updater`).
- `src/api/net.ts`: `isTauri`, `proxyBase`, `serverBase` y `configureTarget` (el frontend apunta al proxy local).
- `src/api/keuesApi.ts`: toda la lógica de llamadas a la API (`getLocations`, `getFlows`, `getFlow`, `getCounters`, `getFlowQueueIds`, `callNext`, `attendTicket`, stubs `setCounterFree`, `manualCall`).
- `src/constants/app.ts`: `APP_VERSION` importado de `package.json` (sube la versión al publicar; hoy `1.0.0`).
- `src/components/config/ConfigScreen.tsx`: selector Ubicación→Flujo→Puesto. Pre-rellena desde `initialConfig`; `changeFlow` usa `getFlow` fresco + `getCounters` en `Promise.all` y filtra puestos por colas; guarda nombres (`locationName/flowName/counterName/counterCode`) además de IDs; botón "Back" (`onCancel`).
- `src/components/flows/`: `CounterPanel.tsx` (despachador por `flowType`, badge del puesto abajo-izquierda, badge de estado SignalR, botón "Settings" arriba-derecha, `VersionBadge`), `CallTicketPanel.tsx`, `SetFreePanel.tsx`, `ManualCallPanel.tsx`.
- `src/components/VersionBadge.tsx`: badge `v{APP_VERSION}` abajo a la derecha (para que soporte identifique la versión).

## Diseño visual (paneles de puesto)

Los paneles del counter siguen estos principios de diseño: **fondo claro**, cards blancas y colores oscuros de alto contraste para los datos importantes. Es la paleta oficial del puesto de mostrador.

### Principios generales

- **Fondo claro** (`#f8f9fa` — gris muy claro, casi blanco).
- Cards blancas (`#ffffff`) con sombra suave y borde `#e5e7eb`.
- Números y datos importantes en **colores oscuros** con alto contraste.
- Tipografía grande y legible (el operador debe ver el turno de un vistazo).
- Paleta única en todos los paneles (azul `#2563eb` + azul oscuro `#1a1a2e`), independientemente del tipo de flujo.

### Paleta de colores

| Uso | Color |
|---|---|
| Fondo principal | `#f8f9fa` |
| Fondo cards | `#ffffff` |
| Turno actual / número grande | `#1a1a2e` (azul muy oscuro) |
| Acento principal (gradientes) | `#2563eb` → `#3b82f6` (azul) |
| Puesto que atiende | `#374151` (gris oscuro) |
| Texto secundario / labels | `#6b7280` |
| Texto muy tenue (estado vacío) | `#d1d5db` |
| Bordes y separadores | `#e5e7eb` |
| Badge conexión conectado | verde Mantine |
| Badge conexión desconectado | rojo Mantine |

### CallTicketPanel (flowType 0)

- Card blanca centrada, `p="xl"`, `shadow="md"`, `w=450`.
- Número del turno actual: `fontSize: 96`, `fw=900`, color `#1a1a2e`.
- Label "Current ticket" debajo, `size="sm"` `c="dimmed"`.
- Botón "Call next": `size="xl"`, gradiente azul `#2563eb` → `#3b82f6`.
- Botón "Finish": `size="xl"`, `color="red"`, `disabled` si no hay turno activo.
- Errores en `Alert` (rojo si hay turno activo, amarillo si no hay turnos).

### SetFreePanel (flowType 1)

- Card blanca centrada, `p="xl"`, `shadow="md"`, `w=450`, contenido centrado.
- Botón "Mark as free": circular (`radius="100%"`, 180×180), gradiente azul `#2563eb` → `#3b82f6`.
- Mensaje de éxito en `Alert` azul.

### ManualCallPanel (flowType 2)

- Card blanca centrada, `p="xl"`, `shadow="md"`, `w=450`, contenido centrado.
- Número actual: `fontSize: 96`, `fw=900`, color `#1a1a2e`.
- Botones `+1`/`−1` y `+10`/`−10` en `SimpleGrid` circular: ±1 `variant="default"` borde `#1a1a2e`, ±10 gradiente azul `#2563eb` → `#3b82f6`.
- Botón "Reset to 1": `variant="outline"`, `color="dark"`.
- Errores en `Alert` amarillo.

### Elementos comunes (gestionados desde CounterPanel)

| Elemento | Posición | Detalle |
|---|---|---|
| Badge del puesto | Fijo abajo-izquierda | `variant="light"` azul |
| VersionBadge | Fijo abajo-derecha | `v{APP_VERSION}`, badge outline gris |
| Botón "Settings" | Fijo arriba-derecha | `variant="default"`, `IconSettings` 16px |
| Badge status SignalR | Fijo abajo-izquierda junto al puesto | verde/rojo/naranja/amarillo según estado |

## Persistencia (config local)

- El backend Rust guarda la config en **`app_config_dir()/config.json`** → en Linux `~/.config/com.keues.counter/config.json`.
- La config es el objeto JSON directo (sin clave envolvente); incluye `deviceId` (UUID v4 generado/validado por Rust).
- Migración automática del formato Electron: si no hay config nueva, se lee `~/.config/keues-counter/config.json` (clave `config`) y se importa una vez.
- La config guardada puede ser vieja (sin `counterName`): `CounterPanel` hace fallback buscando el puesto en la API, y al re-guardar se persisten los nombres.

## Red / proxy

- El frontend **no** llama directo al servidor: apunta al reverse-proxy local de Rust (`http://127.0.0.1:<puerto>`, ver `src/api/net.ts`), que reenvía HTTP + WebSocket a la IP real (`configureTarget`).
- Esto evita mixed content/CORS cuando el servidor está en otra IP (`http://IP_LAN`); funciona igual en Linux y Windows.

## Entorno / gotchas

- Para compilar/ejecutar Tauri en Linux se requieren los paquetes `-dev` (libwebkit2gtk-4.1-dev, libgtk-3-dev, etc.) y la toolchain de Rust.
- El updater (`tauri-plugin-updater`) requiere un par de claves de firma (`tauri signer generate`); la privada va como secreto en CI y la pública en `tauri.conf.json` (`plugins.updater.pubkey`).
- `APP_VERSION` (frontend) sale de `package.json`; la versión del instalador/updater sale de `src-tauri/tauri.conf.json`. Mantener ambas sincronizadas al publicar.
- Releases: **manuales** con Release Please (`npx release-please release-pr` / `release`). No hay GitHub Actions. La config está en `release-please-config.json` + `.release-please-manifest.json` y sincroniza `package.json`, `src-tauri/tauri.conf.json` y `src-tauri/Cargo.toml`.
- Endpoints de SetFree/ManualCall aún no existen: esperar error 404, es esperado.

## Datos actuales de la API (ejemplo real)

- Location `e557056d-8183-4eeb-8f7e-213c7aa5fa17` (carnicería Sevilla) con counters: CARNICERIA (cola `615832e3`=CARNE), PESCADERÍA (`7922bc27`), Verdura y fruta (`aaf95964`).
- Flujos: "n" (flowType 0), "manual" (flowType 2), "estoy libre" (flowType 1, apunta a la cola de verdura `aaf95964`).
