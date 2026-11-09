# Reflexion – Assignment 03: OpenAPI und Swagger UI

## 1. Was ist der Unterschied zwischen OpenAPI und Swagger UI?

**OpenAPI** ist eine Spezifikation, also ein Standard dafür, wie man eine REST-API maschinenlesbar beschreibt
(in YAML oder JSON): Pfade, Methoden, Parameter, Request-Bodies, Responses und Schemas.
**Swagger UI** ist ein Werkzeug, das eine solche OpenAPI-Datei einliest und daraus eine interaktive Webseite
erzeugt. Dort kann man die Endpunkte lesen und mit „Try it out“ direkt testen.
Kurz gesagt: OpenAPI ist der Inhalt bzw. das Format, Swagger UI ist die Darstellung davon.
In meinem Projekt erzeugt `swagger-jsdoc` aus `tasks.yaml` die OpenAPI-Spezifikation, und `swagger-ui-express`
zeigt sie unter `/api-docs` an.

## 2. Warum müssen Request- und Response-Payloads separat beschrieben werden?

Weil sie unterschiedlich aufgebaut sind. Beim Erstellen schickt der Client z. B. keine `id`, und
`description` und `done` sind optional (`CreateTaskRequest`). In der Antwort ist die `id` dagegen immer
vorhanden und alle Felder sind gesetzt (`Task`). Ausserdem hat jeder Statuscode eine eigene Antwort:
Bei `201` kommt ein Task zurück, bei `400`/`409` ein `ApiError`, bei `204` gar nichts.
Würde man nur ein Schema verwenden, wäre die Doku ungenau: Entweder müsste der Client scheinbar eine
`id` mitsenden, oder die Antwort würde so aussehen, als könnten Felder fehlen.

## 3. Weshalb enthält eine erfolgreiche Antwort mit Status 204 No Content keinen JSON-Body?

`204 No Content` bedeutet laut HTTP-Standard genau, dass die Anfrage erfolgreich war und **kein Inhalt**
zurückgesendet wird. Eine 204-Antwort darf keinen Body haben. Bei `DELETE /tasks/{id}` gibt es nach
dem Löschen auch nichts Sinnvolles mehr zurückzugeben, der Statuscode allein sagt dem Client „hat geklappt“.
Deshalb hat die 204-Antwort in meiner Doku nur eine `description` und kein `content`.

## 4. Welche Vorteile bieten zentrale Schemas und `$ref`?

- **Keine Duplikate:** Das `Task`-Schema ist einmal definiert und wird in fünf Responses verwendet,
  `ApiError` in allen Fehlerantworten.
- **Einfachere Wartung:** Kommt ein neues Feld dazu, ändere ich es an einer Stelle und alle Endpunkte
  sind aktuell.
- **Konsistenz:** Alle Endpunkte beschreiben dasselbe Objekt garantiert gleich.
- **Bessere Lesbarkeit:** Die Endpunkte bleiben kurz, und Swagger UI zeigt die Schemas zusätzlich
  gesammelt im Bereich „Schemas“ an.

Ich habe nicht nur Schemas, sondern auch den Path-Parameter (`TaskId`) und die 404-Antwort (`NotFound`)
unter `components` abgelegt und per `$ref` wiederverwendet.

## 5. Wie haben Sie sichergestellt, dass die Dokumentation zum tatsächlichen Verhalten Ihrer API passt?

1. **Code analysiert statt Annahmen übernommen:** Für jede Route habe ich im Code nachgeschaut, welche
   Statuscodes und Meldungen wirklich zurückkommen (`docs/api-overview.md`). Dabei sind Unterschiede
   aufgefallen, z. B. dass PUT kein `409` kennt und das Datum nicht in der Zukunft liegen muss.
   Das habe ich so dokumentiert und nicht einfach von POST übernommen.
2. **Manuell in Swagger UI getestet:** Alle sechs Endpunkte und alle Testfälle aus dem Assignment mit
   „Try it out“ ausgeführt (siehe Video `docs/test-results.mp4`).
3. **Automatisch geprüft:** Das Script `scripts/verify-docs.js` (`npm run verify`) führt 16 Testfälle aus
   und prüft, ob der Statuscode stimmt, ob er in der Spezifikation dokumentiert ist und ob der Body zum
   Schema passt.
4. **Spezifikation validiert:** Mit Redocly CLI (`npx @redocly/cli lint openapi.json`) geprüft, dass die
   Datei gültiges OpenAPI 3.1 ist.

Dabei habe ich eine Abweichung gefunden: Ungültiges JSON im Body gab eine HTML-Seite statt `ApiError`
zurück. Ich habe einen Error-Handler ergänzt, damit alle Fehler das dokumentierte Format haben.

## 6. Welche Quellen haben Sie verwendet?

| Quelle | Nutzen |
|--------|--------|
| [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0) | Referenz für `paths`, `parameters`, `requestBody`, `responses`, `components` und `$ref`. Hier habe ich auch nachgesehen, dass in 3.1 Beispiele im Schema als `examples` (Array) angegeben werden. |
| [OpenAPI – Getting Started](https://learn.openapis.org/) | Verständlicher Überblick über den Aufbau einer OpenAPI-Beschreibung. |
| [Swagger – Basic Structure](https://swagger.io/docs/specification/v3_0/basic-structure/) | Einstieg mit Beispielen, wie Request-Bodies und Responses beschrieben werden (Beispiele sind 3.0, ich habe sie auf 3.1 angepasst). |
| [swagger-ui-express (npm)](https://www.npmjs.com/package/swagger-ui-express) | Wie Swagger UI mit `swaggerUi.serve` und `swaggerUi.setup()` in Express eingebunden wird. |
| [swagger-jsdoc (GitHub)](https://github.com/Surnet/swagger-jsdoc) | Wie die OpenAPI-Definition aus der Basiskonfiguration und YAML-Dateien (`apis`) zusammengebaut wird. |
| [MDN – HTTP 204 No Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204) | Bestätigung, dass eine 204-Antwort keinen Body enthält. |
| Claude (KI-Assistent) | Unterstützung beim Strukturieren der YAML-Datei und beim Schreiben des Testscripts. Die Ergebnisse habe ich selbst getestet und überprüft. |
