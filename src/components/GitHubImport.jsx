import React, { useState, useCallback, useRef } from "react";

// Sistema de caché simple para respuestas de GitHub
const githubCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Componente para importar proyectos desde GitHub
export default function GitHubImport({ onImport, language, texts, user }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState(false);
  
  // Referencia para mantener track del último usuario buscado
  const lastSearchedUsername = useRef("");

  // Textos del componente
  const componentTexts = {
    es: {
      title: "Importar desde GitHub",
      description: "Vincula tu cuenta de GitHub para importar automáticamente tus repositorios como proyectos.",
      usernameLabel: "Nombre de usuario de GitHub",
      usernameButton: "Buscar repositorios",
      importButton: "Importar seleccionados",
      selectAll: "Seleccionar todos",
      deselectAll: "Deseleccionar todos",
      loading: "Cargando repositorios...",
      error: "Error al cargar los repositorios. Verifica el nombre de usuario.",
      noRepos: "No se encontraron repositorios para este usuario.",
      importSuccess: "Proyectos importados correctamente.",
      repoCount: "repositorios encontrados",
      cancel: "Cancelar",
      statusFinished: "Finalizado",
      close: "Cerrar",
      aiSummaryLabel: "Generar descripciones con IA",
      aiSummaryTooltip: "Mejora la descripción de tus repositorios utilizando inteligencia artificial",
      stars: "estrellas",
      updated: "Actualizado",
      techsUsed: "Tecnologías utilizadas",
      noDescription: "Sin descripción",
      enterUsername: "Ingresa un nombre de usuario válido"
    },
    en: {
      title: "Import from GitHub",
      description: "Link your GitHub account to automatically import your repositories as projects.",
      usernameLabel: "GitHub username",
      usernameButton: "Search repositories",
      importButton: "Import selected",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      loading: "Loading repositories...",
      error: "Error loading repositories. Verify the username.",
      noRepos: "No repositories found for this user.",
      importSuccess: "Projects imported successfully.",
      repoCount: "repositories found",
      cancel: "Cancel",
      statusFinished: "Finished",
      close: "Close",
      aiSummaryLabel: "Generate descriptions with AI",
      aiSummaryTooltip: "Enhance your repository descriptions using artificial intelligence",
      stars: "stars",
      updated: "Updated",
      techsUsed: "Technologies used",
      noDescription: "No description",
      enterUsername: "Enter a valid username"
    }
  };

  const t = componentTexts[language] || componentTexts.es;
  
  // Función para buscar repositorios de GitHub (memoizada con useCallback)
  const fetchRepositories = useCallback(async () => {
    // Limpiar el nombre de usuario (quitar espacios, etc)
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError(t.enterUsername);
      return;
    }

    // Si hay una URL completa, extraer solo el nombre de usuario
    let cleanUsername = trimmedUsername;
    if (cleanUsername.includes('/')) {
      const parts = cleanUsername.split('/');
      cleanUsername = parts[parts.length - 1];
    }
      // Actualizar la referencia del último usuario buscado (conservando mayúsculas y minúsculas)
    lastSearchedUsername.current = cleanUsername;
    
    setLoading(true);
    setError(null);
    setRepositories([]);
      // Verificar la caché (usando clave sensible a mayúsculas/minúsculas)
    const cacheKey = cleanUsername;
    if (githubCache[cacheKey] && (Date.now() - githubCache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log(`Usando datos en caché para ${cacheKey}`);
      const cachedData = githubCache[cacheKey].data;
      setRepositories(cachedData);
      setSelectedRepos(cachedData.map(repo => repo.id));
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Buscando repositorios para el usuario: ${cleanUsername}`);
      
      // Intentar obtener los repositorios del usuario
      const response = await fetch(`http://localhost:4000/github/repos/${cleanUsername}`);
      
      console.log(`Respuesta de la API: Status ${response.status}`);
      
      if (!response.ok) {
        // Obtener el texto del error para mostrar información más detallada
        const errorText = await response.text();
        console.error(`Error en la API: ${response.status}`, errorText);
        
        if (response.status === 404) {
          setError(`No se encontró el usuario "${cleanUsername}" en GitHub. Por favor, verifica que el nombre de usuario sea correcto.`);
        } else {
          setError(`Error al obtener repositorios (${response.status}): ${errorText}`);
        }
        return;
      }
      
      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = await response.json();
        console.log(`Repositorios obtenidos: ${data.length}`);
      } catch (jsonError) {
        console.error("Error al parsear la respuesta JSON:", jsonError);
        setError(`Error al procesar la respuesta del servidor: ${jsonError.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        setError(t.noRepos);
        return;
      }
      
      // Ordenar repositorios por estrellas (más populares primero)
      const sortedData = [...data].sort((a, b) => b.stargazers_count - a.stargazers_count);
        // Guardar en caché (usando clave sensible a mayúsculas/minúsculas)
      githubCache[cacheKey] = {
        data: sortedData,
        timestamp: Date.now()
      };
      
      // Solo actualizar el estado si este es el último nombre de usuario buscado
      if (cacheKey === lastSearchedUsername.current) {
        setRepositories(sortedData);
        setSelectedRepos(sortedData.map(repo => repo.id));
      }
    } catch (err) {
      console.error("Error al buscar repositorios:", err);
      
      // Si es un error de conexión, mostrar un mensaje más específico
      if (err.message && (err.message.includes('NetworkError') || err.message.includes('Failed to fetch'))) {
        setError(`No se pudo conectar al servidor. Asegúrate de que el servidor backend está en ejecución en http://localhost:4000`);
      } else {
        setError(`${t.error} (${err.message || 'Error desconocido'})`);
      }
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [username, t]);

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para importar los repositorios seleccionados
  const importRepositories = async () => {
    if (selectedRepos.length === 0) return;
    
    const selectedRepositories = repositories.filter(repo => 
      selectedRepos.includes(repo.id)
    );
    
    // Convertir repositorios a formato de proyecto
    const newProjects = selectedRepositories.map(repo => {
      // Recoger todas las tecnologías mencionadas (lenguaje principal + tópicos)
      let techs = [];
      if (repo.language) {
        techs.push(repo.language);
      }
      if (repo.topics && repo.topics.length > 0) {
        // Filtrar solo los tópicos que podrían ser tecnologías (eliminar temas genéricos)
        const techTopics = repo.topics.filter(topic => 
          !['project', 'website', 'app', 'application', 'portfolio'].includes(topic.toLowerCase())
        );
        techs = [...techs, ...techTopics];
      }
      
      // Si no hay tecnologías detectadas, agregar "GitHub" como tecnología por defecto
      if (techs.length === 0) {
        techs = ["GitHub"];
      }
      
      return {
        title: repo.name.replace(/-/g, ' ').replace(/_/g, ' '),
        description: repo.description || "",
        technologies: techs,
        github: repo.html_url,
        status: t.statusFinished,
        id: Date.now().toString() + "-" + repo.id,
        uid: user.uid,
        createdAt: new Date().toISOString()
      };
    });
    
    onImport(newProjects);
  };

  // Manejar selección de repositorio
  const toggleSelect = (id) => {
    setSelectedRepos(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(repoId => repoId !== id)
        : [...prevSelected, id]
    );
  };

  // Seleccionar o deseleccionar todos
  const toggleSelectAll = () => {
    setSelectedRepos(selectedRepos.length === repositories.length 
      ? [] 
      : repositories.map(repo => repo.id));
  };
  // Función eliminada: setTestUsername

  return (
    <div className="github-import-container p-4">
      <h4 style={{
        fontWeight: 800,
        fontSize: '1.5rem',
        letterSpacing: 1,
        marginBottom: 18,
        color: '#6dd5fa',
        textAlign: 'center',
        textShadow: '0 0 12px #000'
      }}>{t.title}</h4>

      <p className="text-center mb-4">{t.description}</p>
      
      <div className="mb-4">        <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>
          {t.usernameLabel}
        </label>
        <div className="d-flex">
          <input 
            type="text" 
            className="form-control" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="username"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchRepositories();
              }
            }}
          />
          <button 
            className="btn btn-primary ms-2" 
            onClick={fetchRepositories}
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? <i className="bi bi-hourglass-split me-2 spinner"></i> : <i className="bi bi-search me-2"></i>} {loading ? t.loading : t.usernameButton}
          </button>
        </div>        <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>
          Introduce el nombre de usuario exacto de GitHub (no la URL ni el nombre completo)
        </small>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: '1.5rem' }}></i>
            <div>
              <strong>Error:</strong> {error}
              {error.includes('conectar al servidor') && (
                <div className="mt-2">
                  <p className="mb-1">Posibles soluciones:</p>
                  <ul className="mb-2">
                    <li>Verifica que el servidor backend esté funcionando en http://localhost:4000</li>
                    <li>Reinicia la aplicación</li>
                    <li>Asegúrate de que no haya un firewall bloqueando la conexión</li>
                  </ul>
                  <button 
                    className="btn btn-sm btn-outline-light" 
                    onClick={() => fetchRepositories()}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {repositories.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{repositories.length} {t.repoCount}</span>
            <div className="d-flex align-items-center">
              <div className="form-check me-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="aiSummaryCheck"
                  checked={aiGeneratedSummary}
                  onChange={() => setAiGeneratedSummary(!aiGeneratedSummary)}
                />
                <label className="form-check-label" htmlFor="aiSummaryCheck" title={t.aiSummaryTooltip}>
                  <i className="bi bi-robot me-1"></i> {t.aiSummaryLabel}
                </label>
              </div>
              <button 
                className="btn btn-outline-primary btn-sm" 
                onClick={toggleSelectAll}
              >
                {selectedRepos.length === repositories.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
          </div>

          <div className="repo-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {repositories.map(repo => (
              <div 
                key={repo.id} 
                className="repo-item p-3 d-flex"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSelect(repo.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedRepos.includes(repo.id)} 
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(repo.id);
                  }}
                  className="mt-1 me-3"
                />
                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong style={{ fontSize: '1.1rem', color: '#6dd5fa' }}>{repo.name.replace(/-/g, ' ').replace(/_/g, ' ')}</strong>
                    <div>
                      <span className="badge bg-dark me-2" title="Stars">
                        <i className="bi bi-star-fill me-1"></i> {repo.stargazers_count}
                      </span>
                      <span className="badge bg-secondary" title={t.updated}>
                        <i className="bi bi-clock-history me-1"></i> {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                  <p className="mb-2 small" style={{ color: '#e0e0e0', fontStyle: repo.description ? 'normal' : 'italic' }}>
                    {repo.description || t.noDescription}
                  </p>
                  
                  {(repo.language || (repo.topics && repo.topics.length > 0)) && (
                    <div>
                      <small style={{ color: '#9e9e9e' }}>{t.techsUsed}:</small>
                      <div className="tech-tags mt-1">
                        {repo.language && (
                          <span className="badge bg-primary me-1">
                            <i className="bi bi-code-slash me-1"></i> {repo.language}
                          </span>
                        )}
                        {repo.topics && repo.topics.map(topic => (
                          <span key={topic} className="badge bg-info me-1">
                            <i className="bi bi-hash"></i> {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button 
              className="bottom-cancel" 
              onClick={() => onImport(null)}
            >
              {t.cancel}
            </button>
            <button 
              className="bottom-github-import" 
              onClick={importRepositories}
              disabled={selectedRepos.length === 0}
            >
              <i className="bi bi-github me-2"></i>
              {t.importButton} ({selectedRepos.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}
