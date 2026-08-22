# Keues Counter

[![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/HastaCs/Keues-Counter/main/package.json&query=$.version&label=Version&color=blue)](https://github.com/HastaCs/Keues-Counter)
[![Status: MVP](https://img.shields.io/badge/status-MVP-yellow)](https://github.com/HastaCs/Keues)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Leer en español](README.es.md)

The counter (service desk) app for **Keues**, the queue management system. Official website and docs: **[https://www.keues.dev](https://www.keues.dev)**.

Keues Counter runs at each attended counter — butcher, fishmonger, greengrocer… — so the operator can **call the next ticket**, **finish an attendance**, **mark the counter as free** or make **manual number calls**. It is the *action* counterpart of the read-only monitor screens.

> ⚠️ Requires the **[Keues backend](https://github.com/HastaCs/Keues)** to run. It does not work standalone.

---

## Screenshots

| Ticket machine | Set free |
|---|---|
| <img src="screenshots/ticketMachinePanel.png" width="480" alt="Call next / finish"> | <img src="screenshots/setFreePanel.png" width="480" alt="Mark the counter as free"> |

| Manual call | Setup screen |
|---|---|
| <img src="screenshots/callManualPanel.png" width="480" alt="Manual number calls"> | <img src="screenshots/counterConfig.png" width="480" alt="Setup screen"> |

---

## How it works

1. Choose the **server**, a **location**, a **flow** and your **counter**, and give it a **name**.
2. Save: the app connects in real time and shows the panel that matches the flow type.

| Flow type | Panel | What the operator does |
|---|---|---|
| TicketMachine | CallTicket | Call the next ticket / finish the attendance |
| SetFree | SetFree | Mark the counter as free |
| ManualCall | ManualCall | Manual number: +1 / −1 / +10 / −10 |

---

## Features

- **Call next / finish**: serve tickets in order and close the attendance.
- **Free counter**: let the system know the counter is available again.
- **Manual calls**: local counter number with +1 / −1 / +10 / −10 and reset.
- **Real-time connection status** and counter name badges.
- **Persisted configuration**: the setup is remembered between launches.

---

## Quick start

Requires the [Rust toolchain](https://rustup.rs/) and the platform prerequisites for Tauri (see [tauri.app](https://tauri.app/start/prerequisites/)).

```bash
pnpm install
pnpm start
```

On first launch the setup screen opens (server URL, location, flow and counter). The configuration is saved locally, so the next launches go straight to the counter panel.

---

## Releases

Release PRs are generated automatically by [release-please](https://github.com/googleapis/release-please) on every push to `main`. Merging a release PR bumps the version in `package.json` and creates the release tag (`vX.Y.Z`). The Windows installer, its signature and the updater manifest (`latest.json`) are produced by the **Publish** workflow (`Actions → Publish → Run workflow`), which you can trigger manually at any time.

---

## License

Released under the [MIT License](LICENSE).
