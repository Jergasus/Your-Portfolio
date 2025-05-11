import React, { useState, useCallback, useRef } from "react";
import RepoSelectorModal from "./RepoSelectorModal";

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
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  
  // Referencia para mantener track del último usuario buscado
  const lastSearchedUsername = useRef("");
  // Textos del componente
  const componentTexts = {    es: {
      title: "Importar desde GitHub",
      description: "Vincula tu cuenta de GitHub para importar automáticamente tus repositorios como proyectos.",
      usernameLabel: "Nombre de usuario de GitHub",
      usernameButton: "Buscar repositorios",
      importButton: "Importar seleccionados",
      selectAll: "Seleccionar todos",
      deselectAll: "Deseleccionar todos",
      loading: "Cargando repositorios...",
      error: "Error al cargar los repositorios. Verifica el nombre de usuario.",
      showReposButton: "Seleccionar repositorios",
      hideReposButton: "Ocultar repositorios",
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
      enterUsername: "Ingresa un nombre de usuario válido",
      selected: "seleccionados",
      allSelected: "Todos seleccionados"
    },    en: {
      title: "Import from GitHub",
      description: "Link your GitHub account to automatically import your repositories as projects.",
      usernameLabel: "GitHub username",
      usernameButton: "Search repositories",
      importButton: "Import selected",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      loading: "Loading repositories...",
      error: "Error loading repositories. Verify the username.",
      showReposButton: "Select repositories",
      hideReposButton: "Hide repositories",
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
      enterUsername: "Enter a valid username",
      selected: "selected",
      allSelected: "All selected"
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
    <div className="github-import-container" style={{
      overflowY: 'auto',
      overflowX: 'hidden', // Previene el scroll horizontal
      maxHeight: 'calc(95vh - 60px)', // Aumentamos el porcentaje de altura para utilizar más espacio
      display: 'flex',
      flexDirection: 'column',
      padding: '5px 0px 20px 0px',
      borderRadius: '20px',
      width: '520px', // Mantenemos el ancho específico de 520px como se solicitó
      margin: '0 auto',
      position: 'relative', // Asegura que los elementos posicionados se comporten correctamente
    }}>
      <div className="d-flex align-items-center justify-content-center" style={{marginTop: '0px', marginBottom: '10px'}}>
        <i className="bi bi-github me-3" style={{ 
          fontSize: '2.5rem', 
          color: '#fff', 
          textShadow: '0 0 15px #3898f1',
          animation: 'pulse 2s infinite ease-in-out'
        }}></i>
        <h4 style={{
          fontWeight: 800,
          fontSize: '1.9rem',
          letterSpacing: 1.2,
          marginBottom: 0,
          color: '#6dd5fa',
          textAlign: 'center',
          marginTop: '10px',
          textShadow: '0 0 18px rgba(0,0,0,0.8)'
        }}>{t.title}</h4>
      </div>      <p className="text-center mb-4" style={{ 
        fontSize: '1.15rem', 
        maxWidth: '90%', 
        margin: '0 auto 1.5rem auto', 
        color: '#e0e0e0',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        lineHeight: '1.4',
        padding: '0 15px'
      }}>{t.description}</p>
      
      <style jsx="true">{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
      
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .repo-list::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .repo-list::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .repo-list::-webkit-scrollbar-thumb {
          background: rgba(56,152,241,0.5);
          border-radius: 4px;
        }
        .repo-list::-webkit-scrollbar-thumb:hover {
          background: rgba(56,152,241,0.7);
        }
          /* Estilos para el placeholder del input */
        .form-control::placeholder {
          color: rgba(109, 213, 250, 0.6);
          font-style: italic;
          opacity: 0.7;
        }
        
        /* Eliminar el borde de selección al hacer clic */
        .form-control:focus {
          outline: none !important;
          box-shadow: none !important;
          border-color: transparent !important;
        }      `}</style><div className="mb-5" style={{ width: '94%', padding: '0 15px' }}>
        <label style={{ fontWeight: 700, marginBottom: 12, display: 'block', color: '#fff', letterSpacing: 0.5, fontSize: '1.2rem' }}>
          {t.usernameLabel}
        </label>        <div 
          style={{ 
            background: 'rgba(35,39,43,0.8)',
            position: 'relative',
            borderRadius: '12px',
            marginBottom: '15px',
            border: '1px solid rgba(56,152,241,0.3)',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)',
            cursor: 'text',
            width: '100%',
            display: 'block'
          }}
          onClick={(e) => {
            // Si el clic no fue en el input, focus en el input
            if (e.target.tagName.toLowerCase() !== 'input') {
              e.currentTarget.querySelector('input').focus();
            }
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>            <i className="bi bi-at" style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#6dd5fa',
              fontSize: '1.4rem',
              textShadow: '0 0 5px rgba(56,152,241,0.5)',
              width: '25px',
              textAlign: 'center',
              pointerEvents: 'none' // Evita que el ícono capture clics
            }}></i>            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              style={{ 
                height: '54px', 
                fontSize: '1.2rem', 
                borderRadius: '12px',
                background: 'rgba(35,39,43,0.8)',
                color: '#e0e0e0',
                border: 'none',
                width: '90%',
                paddingLeft: '42px',
                boxShadow: 'none',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchRepositories();
                }
              }}              onFocus={e => {
                e.target.style.background = 'rgba(35,39,43,0.95)';
                e.target.style.outline = 'none';
                e.target.parentElement.parentElement.style.boxShadow = '0 0 0 2px rgba(56,152,241,0.3)';
              }}
              onBlur={e => {
                e.target.style.background = 'rgba(35,39,43,0.8)';
                e.target.parentElement.parentElement.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.1)';
              }}
              onMouseEnter={e => {
                if (e.target !== document.activeElement) {
                  e.target.style.background = 'rgba(35,39,43,0.9)';
                  e.target.parentElement.parentElement.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px rgba(56,152,241,0.2)';
                }
              }}
              onMouseLeave={e => {
                if (e.target !== document.activeElement) {
                  e.target.style.background = 'rgba(35,39,43,0.8)';
                  e.target.parentElement.parentElement.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.1)';
                }
              }}
            />
          </div>
        </div>        <button 
          onClick={fetchRepositories}
          disabled={loading}
          style={{ 
            width: '100%',
            background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
            color: '#fff',
            fontWeight: 700,
            height: '54px',
            fontSize: '1.15rem',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 0 10px rgba(56,152,241,0.5)',
            margin: '0 auto',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(90deg,#4ba3f7 60%,#84ddfb 100%)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56,152,241,0.8)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(56,152,241,0.5)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}        >
          {loading ? 
            <><i className="bi bi-hourglass-split spinner" style={{animation: 'spin 1.5s linear infinite', marginRight: '20px'}}></i> {t.loading}</> : 
            <><i className="bi bi-search" style={{marginRight: '5px'}}></i> {t.usernameButton}</>
          }
        </button>
        <small style={{ color: '#aaa', display: 'block', marginTop: '10px', fontSize: '1rem', marginBottom: '10px' }}>
          {language === 'es' ? 
            'Introduce el nombre de usuario exacto de GitHub (no la URL ni el nombre completo)' : 
            'Enter the exact GitHub username (not the URL or full name)'}
        </small>      </div>      {error && (
        <div className="alert" role="alert" style={{
          background: 'rgba(220,53,69,0.2)',
          color: '#fff',
          borderRadius: '12px',
          border: '2px solid rgba(220,53,69,0.5)',
          padding: '20px',
          boxShadow: '0 8px 16px rgba(220,53,69,0.25)',
          marginBottom: '25px',
          fontSize: '1.05rem',
          margin: '0 15px'
        }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '2rem', color: '#ff6b6b' }}></i>
            <div>
              <strong style={{color: '#ff8585', fontSize: '1.15rem', display: 'block', marginBottom: '5px'}}>Error:</strong> {error}
              {error.includes('conectar al servidor') && (
                <div className="mt-2">
                  <p className="mb-1">Posibles soluciones:</p>
                  <ul className="mb-2">
                    <li>Verifica que el servidor backend esté funcionando en http://localhost:4000</li>
                    <li>Reinicia la aplicación</li>
                    <li>Asegúrate de que no haya un firewall bloqueando la conexión</li>
                  </ul>                  <button 
                    style={{
                      background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginTop: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 3px 8px rgba(56,152,241,0.3)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'linear-gradient(90deg,#4ba3f7 60%,#84ddfb 100%)';
                      e.currentTarget.style.boxShadow = '0 5px 12px rgba(56,152,241,0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(56,152,241,0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => fetchRepositories()}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i> Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}      {repositories.length > 0 && (
        <>          <div className="d-flex justify-content-between align-items-center mb-4" style={{
              padding: '16px 20px',
              background: 'rgba(35,39,43,0.8)',
              borderRadius: '12px',
              boxShadow: selectedRepos.length > 0 
                ? '0 4px 12px rgba(0,0,0,0.3), 0 0 20px rgba(56,152,241,0.25)'
                : '0 4px 12px rgba(0,0,0,0.3)',
              border: selectedRepos.length > 0 
                ? '2px solid rgba(56,152,241,0.6)' 
                : '1.5px solid rgba(56,152,241,0.3)',
              margin: '0 15px',
              position: 'relative',
              transition: 'border 0.3s, box-shadow 0.3s'
            }}>
              {selectedRepos.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: selectedRepos.length === repositories.length ? '10px' : 'calc(50% - 50px)',
                  background: selectedRepos.length === repositories.length 
                    ? 'linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%)' 
                    : 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)',
                  color: '#fff',
                  padding: '3px 12px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                  animation: selectedRepos.length === repositories.length ? 'pulse 1.5s infinite' : 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  zIndex: 1
                }}>
                  {selectedRepos.length === repositories.length 
                    ? <><i className="bi bi-check2-all"></i> {t.allSelected || 'All selected'}</>
                    : <><i className="bi bi-check2"></i> {selectedRepos.length} / {repositories.length} {t.selected || 'selected'}</>
                  }
                </div>
              )}
            <span style={{
              fontWeight: '600',
              fontSize: '1.25rem',
              color: '#6dd5fa',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="bi bi-github" style={{marginRight: '10px', fontSize: '1.35rem'}}></i>
              {repositories.length} {t.repoCount}
            </span>
            <div className="d-flex align-items-center">
              <div className="me-4">
                <button
                  onClick={() => setAiGeneratedSummary(!aiGeneratedSummary)}
                  title={t.aiSummaryTooltip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: aiGeneratedSummary 
                      ? 'linear-gradient(90deg, #8E2DE2 0%, #4A00E0 100%)' 
                      : 'linear-gradient(90deg, #485563 0%, #29323c 100%)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: aiGeneratedSummary 
                      ? '0 3px 10px rgba(142, 45, 226, 0.4)'
                      : '0 2px 8px rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = aiGeneratedSummary 
                      ? '0 5px 15px rgba(142, 45, 226, 0.6)'
                      : '0 4px 12px rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = aiGeneratedSummary 
                      ? '0 3px 10px rgba(142, 45, 226, 0.4)'
                      : '0 2px 8px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <i className={`bi ${aiGeneratedSummary ? 'bi-robot-fill' : 'bi-robot'}`} 
                     style={{fontSize: '1.1rem'}}></i>
                  {t.aiSummaryLabel}
                  {aiGeneratedSummary && <i className="bi bi-check-circle-fill ms-1" style={{color: '#4dffb8'}}></i>}
                </button>              </div>              <button 
                onClick={() => setIsRepoModalOpen(true)}
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #485563 0%, #29323c 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #586573 0%, #393f48 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #485563 0%, #29323c 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
                }}
              >
                <i className="bi bi-list-check" style={{fontSize: '1.1rem'}}></i>
                {t.showReposButton}
              </button>
              <button 
                onClick={toggleSelectAll}
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  background: selectedRepos.length === repositories.length 
                    ? 'linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%)' 
                    : 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = selectedRepos.length === repositories.length 
                    ? 'linear-gradient(90deg, #ff926f 0%, #fec48b 100%)' 
                    : 'linear-gradient(90deg, #4ba3f7 60%, #84ddfb 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = selectedRepos.length === repositories.length 
                    ? 'linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%)' 
                    : 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
                }}
              >
                <i className={`bi ${selectedRepos.length === repositories.length ? 'bi-square' : 'bi-check-all'}`} 
                   style={{fontSize: '1.1rem', marginRight: '4px'}}></i>                {selectedRepos.length === repositories.length ? t.deselectAll : t.selectAll}
              </button>
            </div>          
          </div>
            
          {/* Resumen de repositorios seleccionados (cuando no se muestra la lista) */}          {selectedRepos.length > 0 && (
            <div style={{ 
              padding: '15px',
              margin: '0 15px 15px 15px',
              background: 'rgba(56,152,241,0.15)',
              borderRadius: '10px',
              border: '1px solid rgba(56,152,241,0.3)',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '1.1rem',
                margin: 0,
                color: '#fff',
                fontWeight: '500'
              }}>
                <i className="bi bi-check2-circle me-2" style={{ color: '#6dd5fa' }}></i>
                {selectedRepos.length} {language === 'es' ? 'repositorios seleccionados' : 'repositories selected'}
              </p>
              
              {/* Solo mostrar algunos repositorios como ejemplo si hay muchos */}
              {selectedRepos.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}>
                  {repositories.filter(repo => selectedRepos.includes(repo.id))
                    .slice(0, 5)
                    .map(repo => (
                      <span key={repo.id} style={{
                        padding: '6px 12px',
                        background: 'rgba(56,152,241,0.3)',
                        borderRadius: '8px',
                        color: '#e0e0e0',
                        fontSize: '0.95rem',
                        border: '1px solid rgba(56,152,241,0.5)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}>
                        <i className="bi bi-github me-1"></i>
                        {repo.name}
                      </span>
                    ))
                  }
                  {selectedRepos.length > 5 && (
                    <span style={{
                      padding: '6px 12px',
                      background: 'rgba(35,39,43,0.8)',
                      borderRadius: '8px',
                      color: '#e0e0e0',
                      fontSize: '0.95rem'
                    }}>
                      <i className="bi bi-plus-lg me-1"></i>
                      {selectedRepos.length - 5} {language === 'es' ? 'más' : 'more'}
                    </span>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => setIsRepoModalOpen(true)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #4ba3f7 60%, #84ddfb 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 12px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.3)';
                }}
              >
                <i className="bi bi-pencil-square"></i>
                {language === 'es' ? 'Modificar selección' : 'Edit selection'}
              </button>
            </div>
          )}
          
          {/* Componente modal para selección de repositorios */}
          <RepoSelectorModal 
            isOpen={isRepoModalOpen}
            onClose={() => setIsRepoModalOpen(false)}
            repositories={repositories}
            selectedRepos={selectedRepos}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            formatDate={formatDate}
            t={t}
            language={language}
          />

          {/* Contenedor de botones centrado, sin causar overflow horizontal */}
          <div style={{
              marginTop: '30px',
              marginBottom: '15px',
              width: '100%',
              maxWidth: '490px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center', 
              gap: '15px',
              margin: '0 auto'
            }}>
            <button
              className="bottom-cancel" 
              onClick={() => onImport(null)}
              style={{
                padding: '12px 16px',
                fontSize: '1.1rem',
                borderRadius: '12px',
                background: 'linear-gradient(90deg,#fff 60%,#e0e7ff 100%)',
                color: '#3898f1',
                fontWeight: '700',
                border: 'none',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                width: '130px',
                cursor: 'pointer',
                textAlign: 'center',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(90deg,#fff 50%,#e0e7ff 100%)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(90deg,#fff 60%,#e0e7ff 100%)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {t.cancel}
            </button>
            <button 
              className="bottom-github-import" 
              onClick={importRepositories}
              disabled={selectedRepos.length === 0}
              style={{
                padding: '12px 16px',
                fontSize: '1.1rem',
                borderRadius: '12px',
                background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                color: '#fff',
                fontWeight: '700',
                border: 'none',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(56,152,241,0.4)',
                opacity: selectedRepos.length === 0 ? 0.5 : 1,
                cursor: selectedRepos.length === 0 ? 'not-allowed' : 'pointer',
                width: '210px',
                textAlign: 'center',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                if (selectedRepos.length > 0) {
                  e.currentTarget.style.background = 'linear-gradient(90deg,#4ba3f7 60%,#84ddfb 100%)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(56,152,241,0.7)';
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(56,152,241,0.4)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <i className="bi bi-github me-2"></i>
              {t.importButton} ({selectedRepos.length})
            </button>
          </div>
          
          {/* Añadimos espacio adicional al final para mejorar la apariencia */}
          <div style={{ height: '20px' }}></div>
        </>
      )}
    </div>
  );
}
