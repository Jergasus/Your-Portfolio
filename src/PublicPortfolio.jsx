
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// import { db } from "./firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
import ProjectCard from "./components/ProjectCard";
import "./App.css";

export default function PublicPortfolio() {
  // Estado para el idioma (igual que en App.jsx)
  const [language, setLanguage] = useState('es');
  const { uid } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTechs, setFilterTechs] = useState([]);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/projects/${uid}`);
        const data = await res.json();
        setProjects(data);
        setLoading(false);
        // Obtener el nombre de usuario de GitHub del primer proyecto
        if (data.length > 0 && data[0].github) {
          // Extrae el nombre de usuario de la URL de GitHub
          const match = data[0].github.match(/github\.com\/([^\/]+)/i);
          if (match) {
            setUserName(match[1]);
          } else {
            setUserName("Usuario público");
          }
        } else if (data.length > 0 && data[0].uid) {
          setUserName("Usuario: " + data[0].uid.substring(0, 8));
        }
      } catch (e) {
        setProjects([]);
        setLoading(false);
      }
    }
    fetchProjects();
  }, [uid]);

  // Obtener todas las tecnologías únicas de los proyectos
  const allTechnologies = Array.from(new Set(projects.flatMap(p => Array.isArray(p.technologies) ? p.technologies : (p.technologies || '').split(',').map(t => t.trim()).filter(Boolean))));

  // Filtrado de proyectos según el estado y tecnologías seleccionadas
  const filteredProjects = projects.filter(p => {
    const statusOk = !filterStatus || p.status === filterStatus;
    const techsOk = filterTechs.length === 0 || (Array.isArray(p.technologies) ? filterTechs.every(ft => p.technologies.includes(ft)) : false);
    return statusOk && techsOk;
  });

  // Textos multilenguaje
  const texts = {
    es: {
      publicPortfolio: 'Portafolio público',
      projects: 'Proyectos',
      filterProjects: 'Filtrar Proyectos',
      status: 'Estado:',
      all: 'Todos',
      finished: 'Finalizado',
      inProgress: 'En Proceso',
      technologies: 'Tecnologías:',
      clear: 'Limpiar',
      loading: 'Cargando proyectos...',
      noProjects: 'No hay proyectos públicos para este usuario.'
    },
    en: {
      publicPortfolio: 'Public Portfolio',
      projects: 'Projects',
      filterProjects: 'Filter Projects',
      status: 'Status:',
      all: 'All',
      finished: 'Finished',
      inProgress: 'In Progress',
      technologies: 'Technologies:',
      clear: 'Clear',
      loading: 'Loading projects...',
      noProjects: 'No public projects for this user.'
    }
  };

  return (
    <div className="container py-4">
      {/* Botón de traducir en la esquina superior derecha */}
      <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 3000 }}>
        <button
          onClick={() => setLanguage(prev => prev === 'es' ? 'en' : 'es')}
          className="bottom-translate"
          title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {language === 'es' ? 'EN' : 'ES'}
        </button>
      </div>
      <h1 className="featured-title" style={{marginBottom: 0}}>{userName ? userName : texts[language].publicPortfolio}</h1>
      <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: '1rem'}}>
        <h2 className="featured-title mb-0" style={{ marginTop: '20px' }}>{texts[language].projects}</h2>
      </div>
      {/* Filtro avanzado idéntico al modo edición, sin botón de cerrar */}
      <div
        className="modal-fade modal-fade-in"
        style={{
          position: 'relative',
          margin: '0 auto 2rem auto',
          background: 'rgba(35,39,43,0.85)',
          color: '#fff',
          borderRadius: 22,
          boxShadow: '0 8px 32px 0 rgba(13,110,253,0.22)',
          padding: 32,
          marginTop: '17px',
          minWidth: 320,
          width: 520,
          border: '1.5px solid rgba(56,152,241,0.18)',
          fontFamily: 'inherit',
          transition: 'all 0.25s',
          maxWidth: '95vw',
        }}
      >
        <h4 style={{
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: 1,
          marginBottom: 18,
          color: '#6dd5fa',
          textAlign: 'center',
          textShadow: '0 0 12px #000'
        }}>{texts[language].filterProjects}</h4>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>{texts[language].status}</label>
          <select
            className="filtro-select"
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value);
              e.target.blur();
            }}
            style={{ marginBottom: 6 }}
          >
            <option value="" style={{color:'#23272b', fontWeight: 'bold'}}>{texts[language].all}</option>
            <option value="Finalizado" style={{ fontWeight: 'bold' }}>{texts[language].finished}</option>
            <option value="En Proceso" style={{ fontWeight: 'bold' }}>{texts[language].inProgress}</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>{texts[language].technologies}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {allTechnologies.map(tech => (
              <div
                key={tech}
                onClick={() => setFilterTechs(f => f.includes(tech) ? f.filter(t => t !== tech) : [...f, tech])}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: filterTechs.includes(tech) ? 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)' : 'rgba(52,52,52,0.7)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  border: filterTechs.includes(tech) ? '1.5px solid #fff' : '1.5px solid #3898f1',
                  boxShadow: filterTechs.includes(tech) ? '0 2px 8px #3898f1' : 'none',
                  transition: 'all 0.18s',
                  userSelect: 'none',
                  position: 'relative',
                  outline: filterTechs.includes(tech) ? '2px solid #6dd5fa' : 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = filterTechs.includes(tech)
                    ? 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)'
                    : 'rgba(56,152,241,0.18)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = filterTechs.includes(tech)
                    ? '0 2px 8px #3898f1'
                    : '0 0 0 3px #6dd5fa88';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = filterTechs.includes(tech)
                    ? 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)'
                    : 'rgba(52,52,52,0.7)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = filterTechs.includes(tech)
                    ? '0 2px 8px #3898f1'
                    : 'none';
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
        <div className="d-flex justify-content-between" style={{gap: 70, marginTop: 18, justifyContent: 'center', display: 'flex'}}>
          <button type="button" className="bottom-google-login" style={{
            padding: '0.5rem 1.4rem',
            fontSize: '1.05rem',
            borderRadius: 10,
            background: 'linear-gradient(90deg,#fff 60%,#e0e7ff 100%)',
            color: '#3898f1',
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 2px 8px rgba(56,152,241,0.10)',
            transition: 'all 0.18s',
            cursor: 'pointer',
          }} onClick={() => { setFilterStatus(''); setFilterTechs([]); }}>{texts[language].clear}</button>
        </div>
      </div>
      {loading ? (
        <p style={{color:'#3898f1', fontWeight:700}}>{texts[language].loading}</p>
      ) : (
        <div className="project-list">
          {filteredProjects.length === 0 ? (
            <p>{texts[language].noProjects}</p>
          ) : (
            filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} isOwner={false} language={language} texts={{es:{edit:'',delete:'',finished:'Finalizado',inProgress:'En Proceso'},en:{edit:'',delete:'',finished:'Finished',inProgress:'In Progress'}}} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
