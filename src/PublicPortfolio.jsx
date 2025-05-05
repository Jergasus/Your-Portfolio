import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// import { db } from "./firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
import ProjectCard from "./components/ProjectCard";
import "./App.css";

export default function PublicPortfolio() {
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
        // Obtener el nombre del usuario del primer proyecto (si existe)
        if (data.length > 0 && data[0].userName) {
          setUserName(data[0].userName);
        } else if (data.length > 0 && data[0].uid) {
          setUserName("Usuario: " + data[0].uid.substring(0, 8));
        }
      } catch {
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

  return (
    <div className="container py-4">
      <h1 className="featured-title" style={{marginBottom: 0}}>{userName ? userName : "Portafolio público"}</h1>
      <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: '1rem'}}>
        <h2 className="featured-title mb-0">Proyectos</h2>
      </div>
      {/* Filtro avanzado */}
      <div style={{ maxWidth: 600, margin: '0 auto 2rem auto', background: 'rgba(35,39,43,0.85)', borderRadius: 18, padding: 24, boxShadow: '0 4px 24px #3898f122', color: '#fff' }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>Estado:</label>
          <select
            className="filtro-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ marginBottom: 6 }}
          >
            <option value="">Todos</option>
            <option value="Finalizado">Finalizado</option>
            <option value="En Proceso">En Proceso</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>Tecnologías:</label>
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
                  color: filterTechs.includes(tech) ? '#fff' : '#e0e0e0',
                  borderRadius: 10,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  border: filterTechs.includes(tech) ? '1.5px solid #fff' : '1.5px solid #343434',
                  boxShadow: filterTechs.includes(tech) ? '0 2px 8px #3898f1' : 'none',
                  transition: 'all 0.18s',
                  userSelect: 'none',
                  position: 'relative',
                  outline: filterTechs.includes(tech) ? '2px solid #6dd5fa' : 'none',
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="bottom-google-login" style={{ padding: '0.5rem 1.4rem', fontSize: '1.05rem', borderRadius: 10, background: 'linear-gradient(90deg,#fff 60%,#e0e7ff 100%)', color: '#3898f1', fontWeight: 700, border: 'none', boxShadow: '0 2px 8px rgba(56,152,241,0.10)', transition: 'all 0.18s', cursor: 'pointer', marginRight: 10 }} onClick={() => { setFilterStatus(''); setFilterTechs([]); }}>Limpiar</button>
      </div>
      {loading ? (
        <p style={{color:'#3898f1', fontWeight:700}}>Cargando proyectos...</p>
      ) : (
        <div className="project-list">
          {filteredProjects.length === 0 ? (
            <p>No hay proyectos públicos para este usuario.</p>
          ) : (
            filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} isOwner={false} language="es" texts={{es:{edit:'',delete:'',finished:'Finalizado',inProgress:'En Proceso'}}} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
