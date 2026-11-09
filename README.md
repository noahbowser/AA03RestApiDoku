# Task-API

REST-API zur Verwaltung von Aufgaben (Tasks) mit Express. Dokumentiert mit **OpenAPI 3.1** und **Swagger UI**.
Die Daten werden nur im Arbeitsspeicher gehalten und gehen beim Neustart verloren.

## Installation und Start

Voraussetzung: Node.js 18 oder neuer.

```bash
npm install     # Abhängigkeiten installieren
npm start       # Server starten (Standard-Port 3000)
```

Anderer Port: `PORT=4000 npm start` (Windows PowerShell: `$env:PORT=4000; npm start`).

## API-Dokumentation

| Was                          | URL                                     |
|------------------------------|-----------------------------------------|
| Swagger UI (interaktiv)      | http://localhost:3000/api-docs          |
| OpenAPI-Spezifikation (JSON) | http://localhost:3000/api-docs.json     |

### Endpunkte

| Methode | Pfad          | Funktion                       |
|---------|---------------|--------------------------------|
| GET     | `/tasks`      | Alle Aufgaben abrufen          |
| POST    | `/tasks`      | Neue Aufgabe erstellen         |
| GET     | `/tasks/{id}` | Eine Aufgabe abrufen           |
| PUT     | `/tasks/{id}` | Aufgabe vollständig ersetzen   |
| PATCH   | `/tasks/{id}` | Aufgabe als erledigt markieren |
| DELETE  | `/tasks/{id}` | Aufgabe löschen                |

Details zu Eingaben, Statuscodes und Fehlern: [`docs/api-overview.md`](docs/api-overview.md).

## API testen

**In der Swagger UI:**
1. Server starten und http://localhost:3000/api-docs öffnen.
2. Einen Endpunkt aufklappen → **Try it out** klicken.
3. Parameter bzw. Request-Body anpassen (bei POST gibt es mehrere Beispiele im Dropdown) → **Execute**.
4. Unter *Server response* stehen Statuscode und Body, darüber der passende `curl`-Befehl.

**Automatisch per Script:** Server starten, dann in einem zweiten Terminal:

```bash
npm run verify
```

Das Script führt alle Testfälle aus und prüft Statuscodes und Antworten gegen die OpenAPI-Spezifikation.
Die Ergebnisse stehen in [`docs/test-results.md`](docs/test-results.md), das Video in `docs/test-results.mp4`.

## Wo und wie die Dokumentation gepflegt wird

```
server.js                 Express-App mit allen Routen
src/docs/swagger.js       OpenAPI-Grunddaten (Version 3.1, info, servers) + Einbindung von Swagger UI
src/docs/tasks.yaml       Pfade, Parameter, Responses und Schemas (components)
scripts/verify-docs.js    Testscript: Implementierung ↔ Dokumentation
docs/                     API-Übersicht und Testergebnisse
```

- Alle Endpunkte und Schemas werden **an einer Stelle** in `src/docs/tasks.yaml` beschrieben.
  `swagger-jsdoc` liest beim Start alle `*.yaml`-Dateien in `src/docs/` ein.
- Wiederverwendbare Teile liegen unter `components` (`Task`, `CreateTaskRequest`, `UpdateTaskRequest`,
  `ApiError`, Parameter `TaskId`, Response `NotFound`) und werden per `$ref` eingebunden.
- **Wird eine Route geändert, muss im selben Commit auch `tasks.yaml` angepasst werden.**
  Danach `npm run verify` laufen lassen.
- Spezifikation exportieren und validieren (Zusatzaufgabe):

  ```bash
  npm run export:openapi                 # erzeugt openapi.json
  npx @redocly/cli lint openapi.json     # validiert die Spezifikation
  ```
