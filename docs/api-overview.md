# API-Übersicht – Task-API

Basis-URL: `http://localhost:3000`  
Datenformat: JSON (`Content-Type: application/json`)  
Datenhaltung: transient (In-Memory-Array, geht beim Neustart verloren)

## Datenmodell `Task`

| Feld          | Typ     | Pflicht (POST/PUT) | Standardwert | Bemerkung                              |
|---------------|---------|--------------------|--------------|----------------------------------------|
| `id`          | integer | – (vom Server)     | fortlaufend  | Wird vom Server vergeben (`nextId++`)  |
| `title`       | string  | ja                 | –            | Muss bei POST eindeutig sein           |
| `description` | string  | nein               | `""`         |                                        |
| `dueDate`     | string  | ja                 | –            | Datum, z. B. `2026-12-31` (ISO 8601)   |
| `done`        | boolean | nein               | `false`      |                                        |

Fehlerantworten haben immer die Form `{ "error": "<Meldung>" }`.

## Endpunkte

| Methode | URL           | Erwartete Eingaben                                                                 | Erfolgreiche Antwort                      | Mögliche Fehler |
|---------|---------------|------------------------------------------------------------------------------------|-------------------------------------------|-----------------|
| GET     | `/tasks`      | –                                                                                  | `200 OK` – Array aller Tasks              | – |
| POST    | `/tasks`      | Body: `title`*, `dueDate`*, `description`, `done`                                   | `201 Created` – neu erstellter Task       | `400` (title/dueDate fehlt, dueDate ungültig oder nicht in der Zukunft), `409` (Titel existiert bereits) |
| GET     | `/tasks/:id`  | Path: `id` (integer)                                                                | `200 OK` – der Task                       | `404` (Task nicht gefunden) |
| DELETE  | `/tasks/:id`  | Path: `id` (integer)                                                                | `204 No Content` – leerer Body            | `404` (Task nicht gefunden) |
| PUT     | `/tasks/:id`  | Path: `id`; Body: `title`*, `dueDate`*, `description`, `done`                       | `200 OK` – ersetzter Task                 | `400` (title/dueDate fehlt, dueDate ungültig), `404` (Task nicht gefunden) |
| PATCH   | `/tasks/:id`  | Path: `id`; **kein Body**                                                           | `200 OK` – Task mit `done: true`          | `404` (Task nicht gefunden) |

\* = Pflichtfeld

## Beobachtungen aus der Implementierung

- **Statuscodes für Erfolg:** Die vorherige Aufgabe legte diese nicht überall fest. Implementiert sind
  `201` für POST (neue Ressource erstellt), `200` mit Task im Body für GET/PUT/PATCH (Client sieht den
  aktuellen Zustand direkt) und `204` ohne Body für DELETE (nach dem Löschen gibt es nichts zurückzugeben).
- **Prüfreihenfolge bei POST:** zuerst Pflichtfelder (`400`), dann Datum (`400`), dann Titel-Duplikat (`409`).
- **PUT ist weniger streng als POST:** `dueDate` muss nur ein gültiges Datum sein, nicht in der Zukunft.
  Ein doppelter Titel führt bei PUT **nicht** zu `409`. Bei PUT wird zuerst der Body validiert (`400`) und erst
  danach die ID gesucht (`404`). Fehlende optionale Felder werden auf `""` bzw. `false` zurückgesetzt
  (vollständiges Ersetzen).
- **PATCH** erwartet keinen Request-Body; ein mitgeschickter Body wird ignoriert. Der Endpunkt setzt nur
  `done = true`.
- **IDs:** Die ID wird mit `parseInt` gelesen. Nicht-numerische IDs (z. B. `/tasks/abc`) führen daher zu
  `404` statt `400`.
- **Ungültiges JSON** im Body wird von `express.json()` mit `400` beantwortet, allerdings mit einer
  HTML-Fehlerseite und nicht im Format `{ "error": ... }`. → **Korrigiert in Schritt 5**
  (siehe `docs/test-results.md`).
- Datentypen werden nicht geprüft (z. B. `done: "ja"` wird übernommen). Die Doku beschreibt die erwarteten Typen.
