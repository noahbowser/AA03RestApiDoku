// Prüft die Testfälle aus dem Assignment gegen den laufenden Server
// und vergleicht Statuscode und Antwortstruktur mit der OpenAPI-Dokumentation.
// Start: zuerst `npm start`, dann `npm run verify` in einem zweiten Terminal.
const { openapiSpec } = require('../src/docs/swagger');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const schemas = openapiSpec.components.schemas;

// Einfache Schema-Prüfung: Pflichtfelder vorhanden und Typen korrekt
function matchesSchema(obj, name) {
  const s = schemas[name];
  if (typeof obj !== 'object' || obj === null) return false;
  return s.required.every(k => k in obj) &&
    Object.entries(s.properties).every(([k, p]) => !(k in obj) ||
      (p.type === 'integer' ? Number.isInteger(obj[k]) : typeof obj[k] === p.type));
}

// Dokumentierte Statuscodes einer Operation aus der Spezifikation lesen
function documentedCodes(method, path) {
  return Object.keys(openapiSpec.paths[path][method].responses).map(Number);
}

const future = '2099-12-31';
const cases = [
  { name: 'Alle Aufgaben abrufen', method: 'get', path: '/tasks', url: '/tasks', expect: 200,
    check: b => Array.isArray(b) && b.every(t => matchesSchema(t, 'Task')) },
  { name: 'Aufgabe mit gültigen Daten erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 201,
    body: { title: 'Testaufgabe', description: 'via Script', dueDate: future },
    check: b => matchesSchema(b, 'Task') && b.done === false },
  { name: 'Aufgabe ohne title erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 400,
    body: { dueDate: future }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'Aufgabe mit vorhandenem Titel erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 409,
    body: { title: 'Testaufgabe', dueDate: future }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'Aufgabe mit ungültigem dueDate erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 400,
    body: { title: 'Ungültig', dueDate: 'kein-datum' }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'Aufgabe mit dueDate in der Vergangenheit erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 400,
    body: { title: 'Vergangen', dueDate: '2020-01-01' }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'Aufgabe mit ungültigem JSON erstellen', method: 'post', path: '/tasks', url: '/tasks', expect: 400,
    rawBody: '{kein json', check: b => matchesSchema(b, 'ApiError') },
  { name: 'Nicht vorhandene Aufgabe abrufen', method: 'get', path: '/tasks/{id}', url: '/tasks/999', expect: 404,
    check: b => matchesSchema(b, 'ApiError') },
  { name: 'Bestehende Aufgabe abrufen', method: 'get', path: '/tasks/{id}', url: '/tasks/1', expect: 200,
    check: b => matchesSchema(b, 'Task') && b.id === 1 },
  { name: 'Bestehende Aufgabe vollständig ersetzen', method: 'put', path: '/tasks/{id}', url: '/tasks/1', expect: 200,
    body: { title: 'Ersetzt', dueDate: '2026-11-30' },
    check: b => matchesSchema(b, 'Task') && b.title === 'Ersetzt' && b.description === '' && b.done === false },
  { name: 'PUT ohne dueDate', method: 'put', path: '/tasks/{id}', url: '/tasks/1', expect: 400,
    body: { title: 'X' }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'PUT auf unbekannte ID', method: 'put', path: '/tasks/{id}', url: '/tasks/999', expect: 404,
    body: { title: 'X', dueDate: future }, check: b => matchesSchema(b, 'ApiError') },
  { name: 'Aufgabe als erledigt markieren', method: 'patch', path: '/tasks/{id}', url: '/tasks/1', expect: 200,
    check: b => matchesSchema(b, 'Task') && b.done === true },
  { name: 'PATCH auf unbekannte ID', method: 'patch', path: '/tasks/{id}', url: '/tasks/999', expect: 404,
    check: b => matchesSchema(b, 'ApiError') },
  { name: 'Bestehende Aufgabe löschen', method: 'delete', path: '/tasks/{id}', url: '/tasks/1', expect: 204,
    check: (b, raw) => raw === '' },
  { name: 'Gelöschte Aufgabe erneut löschen', method: 'delete', path: '/tasks/{id}', url: '/tasks/1', expect: 404,
    check: b => matchesSchema(b, 'ApiError') }
];

(async () => {
  let failed = 0;
  console.log('| # | Testfall | Request | Erwartet | Tatsächlich | Ergebnis |');
  console.log('|---|----------|---------|----------|-------------|----------|');
  for (const [i, c] of cases.entries()) {
    const res = await fetch(BASE + c.url, {
      method: c.method.toUpperCase(),
      headers: c.body || c.rawBody ? { 'Content-Type': 'application/json' } : {},
      body: c.rawBody ?? (c.body ? JSON.stringify(c.body) : undefined)
    });
    const raw = await res.text();
    let body; try { body = JSON.parse(raw); } catch { body = null; }
    const documented = documentedCodes(c.method, c.path).includes(res.status);
    const ok = res.status === c.expect && documented && c.check(body, raw);
    if (!ok) failed++;
    const req = `${c.method.toUpperCase()} ${c.url}${c.rawBody ? ' ' + c.rawBody : c.body ? ' ' + JSON.stringify(c.body) : ''}`;
    console.log(`| ${i + 1} | ${c.name} | \`${req}\` | ${c.expect} | ${res.status} | ${ok ? '✅' : '❌'} |`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} Tests bestanden.`);
  process.exit(failed ? 1 : 0);
})();
