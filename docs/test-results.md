# Testergebnisse – Abgleich Dokumentation ↔ Implementierung

Das Video `docs/test-results.mp4` zeigt die Tests in der Swagger UI (`/api-docs`).
Diese Tabelle ist das schriftliche Protokoll dazu. Sie wurde mit `npm run verify` erzeugt.
Das Script prüft Statuscode, ob der Code in der OpenAPI-Spezifikation dokumentiert ist, und ob der
Response-Body zum Schema (`Task` bzw. `ApiError`) passt.

> Server vor dem Testen frisch starten, da die Daten nur im Speicher liegen.

| # | Testfall | Request | Erwartet | Tatsächlich | Ergebnis |
|---|----------|---------|----------|-------------|----------|
| 1 | Alle Aufgaben abrufen | `GET /tasks` | 200 | 200 | ✅ |
| 2 | Aufgabe mit gültigen Daten erstellen | `POST /tasks {"title":"Testaufgabe","description":"via Script","dueDate":"2099-12-31"}` | 201 | 201 | ✅ |
| 3 | Aufgabe ohne title erstellen | `POST /tasks {"dueDate":"2099-12-31"}` | 400 | 400 | ✅ |
| 4 | Aufgabe mit vorhandenem Titel erstellen | `POST /tasks {"title":"Testaufgabe","dueDate":"2099-12-31"}` | 409 | 409 | ✅ |
| 5 | Aufgabe mit ungültigem dueDate erstellen | `POST /tasks {"title":"Ungültig","dueDate":"kein-datum"}` | 400 | 400 | ✅ |
| 6 | Aufgabe mit dueDate in der Vergangenheit erstellen | `POST /tasks {"title":"Vergangen","dueDate":"2020-01-01"}` | 400 | 400 | ✅ |
| 7 | Aufgabe mit ungültigem JSON erstellen | `POST /tasks {kein json` | 400 | 400 | ✅ |
| 8 | Nicht vorhandene Aufgabe abrufen | `GET /tasks/999` | 404 | 404 | ✅ |
| 9 | Bestehende Aufgabe abrufen | `GET /tasks/1` | 200 | 200 | ✅ |
| 10 | Bestehende Aufgabe vollständig ersetzen | `PUT /tasks/1 {"title":"Ersetzt","dueDate":"2026-11-30"}` | 200 | 200 | ✅ |
| 11 | PUT ohne dueDate | `PUT /tasks/1 {"title":"X"}` | 400 | 400 | ✅ |
| 12 | PUT auf unbekannte ID | `PUT /tasks/999 {"title":"X","dueDate":"2099-12-31"}` | 404 | 404 | ✅ |
| 13 | Aufgabe als erledigt markieren | `PATCH /tasks/1` | 200 | 200 | ✅ |
| 14 | PATCH auf unbekannte ID | `PATCH /tasks/999` | 404 | 404 | ✅ |
| 15 | Bestehende Aufgabe löschen | `DELETE /tasks/1` | 204 | 204 | ✅ |
| 16 | Gelöschte Aufgabe erneut löschen | `DELETE /tasks/1` | 404 | 404 | ✅ |

16/16 Tests bestanden.

## Gefundene Abweichungen und Korrekturen

| Abweichung | Korrektur |
|------------|-----------|
| Ungültiges JSON im Body (z. B. `{kein json`) lieferte zwar `400`, aber als HTML-Fehlerseite mit Stacktrace statt im dokumentierten Format `{ "error": ... }`. | Error-Handler in `server.js` ergänzt, der `400` mit `{ "error": "Request-Body ist kein gültiges JSON." }` antwortet. Fall in der Doku (POST/PUT → `400`) und im Testscript ergänzt. |

## Bewusst so dokumentiertes Verhalten (keine Fehler)

- `PUT` prüft nicht, ob `dueDate` in der Zukunft liegt, und gibt bei doppeltem Titel kein `409` zurück.
- `PATCH` ignoriert einen allfälligen Request-Body und setzt nur `done = true`.
- Nicht-numerische IDs (z. B. `/tasks/abc`) ergeben `404`.
