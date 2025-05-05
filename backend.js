import express from 'express';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const DATA_FILE = './projects.json';

// Leer datos del archivo JSON
function readData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Escribir datos al archivo JSON
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Obtener proyectos de un usuario
app.get('/projects/:uid', (req, res) => {
  const data = readData();
  const { uid } = req.params;
  res.json(data[uid] || []);
});

// Guardar proyectos de un usuario
app.post('/projects/:uid', (req, res) => {
  const data = readData();
  const { uid } = req.params;
  const { projects } = req.body;
  data[uid] = projects;
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));