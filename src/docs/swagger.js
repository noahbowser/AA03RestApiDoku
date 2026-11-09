const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basis-Definition (OpenAPI 3.1). Pfade und Schemas kommen aus den YAML-Dateien.
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Task-API',
      version: '1.0.0',
      description: 'REST-API zur Verwaltung von Aufgaben (Tasks). Die Daten werden nur im Arbeitsspeicher gehalten.',
      license: { name: 'MIT', identifier: 'MIT' }
    },
    servers: [{ url: '/', description: 'Aktueller Server' }],
    // Die API verwendet keine Authentifizierung
    security: [],
    tags: [{ name: 'Tasks', description: 'Aufgaben verwalten' }]
  },
  // swagger-jsdoc liest alle YAML-Dateien in diesem Ordner ein
  apis: [path.join(__dirname, '*.yaml')]
};

const openapiSpec = swaggerJsdoc(options);

// Swagger UI unter /api-docs und die rohe Spezifikation unter /api-docs.json bereitstellen
function setupSwagger(app) {
  app.get('/api-docs.json', (req, res) => res.json(openapiSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
}

module.exports = { setupSwagger, openapiSpec };
