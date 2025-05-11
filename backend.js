import express from 'express';
import fs from 'fs';
import cors from 'cors';
import fetch from 'node-fetch';

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

// Nuevo endpoint para obtener repositorios de GitHub
app.get('/github/repos/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`Buscando repositorios para el usuario: ${username}`);
      // Verificar primero si el usuario existe
    try {
      console.log(`Verificando usuario: ${username}`);
      
      const userResponse = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Your-Portfolio App'
        }
      });
      
      console.log(`Respuesta API usuario: ${userResponse.status}`);
      
      if (!userResponse.ok) {
        // Si no se encuentra el usuario, devolver un 404 con mensaje informativo
        if (userResponse.status === 404) {
          console.error(`Usuario no encontrado: ${username}`);
          return res.status(404).send(`Usuario "${username}" no encontrado en GitHub`);
        } else {
          const errorText = await userResponse.text();
          console.error(`Error al verificar usuario: ${username}, status: ${userResponse.status}, respuesta: ${errorText}`);
          return res.status(userResponse.status).send(`Error al verificar usuario: ${errorText}`);
        }
      }
      
      const userData = await userResponse.json();
      console.log(`Usuario encontrado: ${userData.login}, repos públicos: ${userData.public_repos}`);
      
      if (userData.public_repos === 0) {
        // Si el usuario no tiene repositorios públicos, devolver un array vacío
        return res.json([]);
      }
    } catch (userError) {
      console.error(`Error al verificar usuario: ${userError.message}`);
      return res.status(500).send(`Error al verificar usuario: ${userError.message}`);
    }
      // Obtener repositorios básicos
    console.log(`Obteniendo repositorios para: ${username}`);
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Your-Portfolio App'
      }
    });
    
    console.log(`Respuesta API repos: ${reposResponse.status}`);
    
    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error(`GitHub API error en repos: ${reposResponse.status}, respuesta: ${errorText}`);
      return res.status(reposResponse.status).send(`GitHub API error: ${errorText}`);
    }
    
    const repos = await reposResponse.json();
    console.log(`Repositorios obtenidos: ${repos.length}`);
    
    // Enriquecer los datos con información adicional como lenguajes y temas
    const enrichedRepos = await Promise.all(repos.map(async (repo) => {
      try {        // Obtener los temas (topics) del repositorio
        const topicsResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/topics`, {
          headers: { 
            'Accept': 'application/vnd.github.mercy-preview+json',
            'User-Agent': 'Your-Portfolio App'
          }
        });
        
        let topics = [];
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          topics = topicsData.names || [];
        }
        
        return {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          topics: topics,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          stargazers_count: repo.stargazers_count,
          fork: repo.fork
        };
      } catch (error) {
        // Si hay error al obtener información adicional, devolver el repo básico
        return {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          topics: [],
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          stargazers_count: repo.stargazers_count,
          fork: repo.fork
        };
      }
    }));
    
    // Filtrar repositorios que son forks si es necesario
    // const filteredRepos = enrichedRepos.filter(repo => !repo.fork);
    
    res.json(enrichedRepos);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`============================================`);
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📂 GitHub API endpoint: http://localhost:${PORT}/github/repos/{username}`);
  console.log(`============================================`);
});