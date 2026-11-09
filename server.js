const express = require("express");
const { setupSwagger } = require("./src/docs/swagger");
const app = express();

app.use(express.json());

// Swagger UI unter /api-docs
setupSwagger(app);

// Transient in-memory task list
let tasks = [
  {
    id: 1,
    title: "Beispielaufgabe",
    description: "Dies ist eine Beispielbeschreibung.",
    dueDate: "2025-08-31",
    done: false,
  },
];

// Hilfsfunktion für ID-Generierung
let nextId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;

// GET /tasks - returns all tasks as JSON
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// POST /tasks - fügt eine neue Aufgabe hinzu
app.post("/tasks", (req, res) => {
  const { title, description = "", dueDate, done = false } = req.body;

  // Validierung: Titel und Fälligkeitsdatum müssen vorhanden sein
  if (!title || !dueDate) {
    return res
      .status(400)
      .json({ error: "title und dueDate sind erforderlich." });
  }

  // Validierung: dueDate muss ein gültiges Datum in der Zukunft sein
  const due = new Date(dueDate);
  const now = new Date();
  if (isNaN(due.getTime()) || due <= now) {
    return res
      .status(400)
      .json({ error: "dueDate muss ein gültiges Datum in der Zukunft sein." });
  }

  // Validierung: Titel muss eindeutig sein
  if (tasks.some((task) => task.title === title)) {
    return res
      .status(409)
      .json({ error: "Eine Aufgabe mit diesem Titel existiert bereits." });
  }

  // Neue Aufgabe erstellen
  const newTask = {
    id: nextId++,
    title,
    description,
    dueDate,
    done,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// GET /tasks/:id - gibt eine Aufgabe mit der angegebenen ID zurück
app.get("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Aufgabe nicht gefunden." });
  }

  res.json(task);
});

// DELETE /tasks/:id - löscht die Aufgabe mit der angegebenen ID
app.delete("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Aufgabe nicht gefunden." });
  }

  tasks.splice(index, 1);
  res.sendStatus(204); // No Content
});

// PUT /tasks/:id - ersetzt eine vollständige Aufgabe mit der angegebenen ID
app.put("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description = "", dueDate, done = false } = req.body;

  // Validierung: Titel und Fälligkeitsdatum müssen vorhanden sein
  if (!title || !dueDate) {
    return res
      .status(400)
      .json({ error: "title und dueDate sind erforderlich." });
  }

  // Validierung: dueDate muss ein gültiges Datum sein
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) {
    return res
      .status(400)
      .json({ error: "dueDate muss ein gültiges Datum sein." });
  }

  // Aufgabe suchen
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Aufgabe nicht gefunden." });
  }

  // Aufgabe ersetzen
  tasks[index] = {
    id,
    title,
    description,
    dueDate,
    done,
  };

  res.json(tasks[index]);
});

// PATCH /tasks/:id - markiert eine Aufgabe als erledigt (done = true)
app.patch("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Aufgabe nicht gefunden." });
  }

  task.done = true;
  res.json(task);
});

// Fehlerbehandlung: ungültiges JSON im Request-Body im ApiError-Format beantworten
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request-Body ist kein gültiges JSON." });
  }
  next(err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tasklist API listening on port ${PORT}`);
});
