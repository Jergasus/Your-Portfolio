import React from "react";
import { projects as projectData } from "./data/projects";
import ProjectCard from "./components/ProjectCard";
import "./App.css";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import miFiltro from './assets/filtro.png';

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github: '', status: '' });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  // Obtener todas las tecnologías únicas de los proyectos
  const allTechnologies = Array.from(new Set(projects.flatMap(p => Array.isArray(p.technologies) ? p.technologies : (p.technologies || '').split(',').map(t => t.trim()).filter(Boolean))));
  const [filterTechs, setFilterTechs] = useState([]);

  // Filtrado de proyectos según el estado y tecnologías seleccionadas
  const filteredProjects = projects.filter(p => {
    const statusOk = !filterStatus || p.status === filterStatus;
    const techsOk = filterTechs.length === 0 || (Array.isArray(p.technologies) ? filterTechs.every(ft => p.technologies.includes(ft)) : false);
    return statusOk && techsOk;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "projects"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(userProjects);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description || !newProject.technologies || !newProject.github || !newProject.status) return;
    setShowForm(false);
    setEditId(null);
    setEditingField(null);
    setLoading(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        technologies: newProject.technologies.split(",").map(t => t.trim()),
        uid: user.uid,
        createdAt: new Date(),
        status: newProject.status || 'Finalizado'
      });
      setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };


  const handleEdit = (project) => {
    setEditId(project.id);
    setNewProject({
      title: project.title,
      description: project.description,
      technologies: project.technologies.join(", "),
      github: project.github,
      status: project.status || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este proyecto?")) {
      await deleteDoc(doc(db, "projects", id));
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editId) return;
    // Validar todos los campos antes de actualizar
    if (!newProject.title || !newProject.description || !newProject.technologies || !newProject.github || !newProject.status) return;
    setShowForm(false);
    setEditId(null);
    setEditingField(null);
    setLoading(true);
    try {
      await updateDoc(doc(db, "projects", editId), {
        title: newProject.title,
        description: newProject.description,
        technologies: newProject.technologies.split(",").map(t => t.trim()),
        github: newProject.github,
        uid: user.uid,
        status: newProject.status
      });
      setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Cierra el modal automáticamente cuando se agrega un nuevo proyecto
  useEffect(() => {
    if (showForm && !editId && projects.length > 0 && !Object.values(newProject).some(v => v)) {
      setShowForm(false);
      setEditingField(null);
    }
  }, [projects]);

  // Variable para guardar el scrollY fuera del render
  const lastScrollY = React.useRef(0);

  return (
    <div className="container py-4">
      <header className="main-header text-center text-white py-4 mb-5" style={{paddingTop: '0.2rem'}}>
        <h1 className="display-4 fw-bold mb-2">Your Portfolio</h1>
        {user ? (
          <>
            <div className="logout-section d-flex flex-column align-items-center justify-content-center p-5 rounded shadow">
            <img src="/vite.svg" alt="Logo" style={{ width: 80, marginBottom: 5 }} />
            <p className="mb-4" style={{ color: '#e0e0e0'}}>Bienvenido,</p>
            <p className="name-google" style={{ color: '#fff', fontSize: '2.2rem'}}>{user.displayName || user.email}</p>
            <button className="bottom-google-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
          </>
        ) : (
          <div className="login-section d-flex flex-column align-items-center justify-content-center p-5 rounded shadow">
            <img src="/vite.svg" alt="Logo" style={{ width: 80, marginBottom: 5 }} />
            <p className="mb-4" style={{ color: '#e0e0e0' }}>Crea y gestiona tu portafolio profesional en minutos.<br/>Inicia sesión para comenzar.</p>
            <button className="bottom-google-login" onClick={handleLogin}>
              Iniciar sesión con Google
            </button>
          </div>
        )}
        {/* ...puedes agregar aquí enlaces o más info... */}
      </header>
      {user && (
        <section>
          <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: '1rem'}}>
            <h2 className="featured-title mb-0">Proyectos</h2>
          </div>
          {/* Filtro avanzado con icono */}
          {showFilter && (
            <div style={{
              position: 'fixed', // Cambiado de absolute a fixed
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(35,39,43,0.85)',
              color: '#fff',
              borderRadius: 22,
              boxShadow: '0 8px 32px 0 rgba(13,110,253,0.22)',
              padding: 32,
              minWidth: 320,
              zIndex: 2000,
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(56,152,241,0.18)',
              fontFamily: 'inherit',
              transition: 'all 0.25s',
              maxWidth: '95vw',
            }}>
              <h4 style={{
                fontWeight: 800,
                fontSize: '1.3rem',
                letterSpacing: 1,
                marginBottom: 18,
                color: '#6dd5fa', // azul más claro
                textAlign: 'center',
                textShadow: '0 0 12px #000' // luminosidad blanca
              }}>Filtrar Proyectos</h4>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#fff', letterSpacing: 0.5 }}>Estado:</label>
                <select
                  className="filtro-select"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="" style={{color:'#23272b'}}>Todos</option>
                  <option value="En Proceso" style={{color:'#23272b'}}>En Proceso</option>
                  <option value="Finalizado" style={{color:'#23272b'}}>Finalizado</option>
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
                      onMouseEnter={e => {
                        if (!filterTechs.includes(tech)) {
                          e.currentTarget.style.background = 'rgba(56,152,241,0.18)';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.boxShadow = '0 0 0 3px #6dd5fa88';
                          e.currentTarget.style.border = '1.5px solid #6dd5fa';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!filterTechs.includes(tech)) {
                          e.currentTarget.style.background = 'rgba(52,52,52,0.7)';
                          e.currentTarget.style.color = '#e0e0e0';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.border = '1.5px solid #343434';
                        }
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
                }} onClick={() => { setFilterStatus(''); setFilterTechs([]); }}>Limpiar</button>
                <button type="button" className="bottom-google-login" style={{
                  padding: '0.5rem 1.4rem',
                  fontSize: '1.05rem',
                  borderRadius: 10,
                  background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 2px 8px #3898f1',
                  transition: 'all 0.18s',
                  cursor: 'pointer',
                }} onClick={() => setShowFilter(false)}>Cerrar</button>
              </div>
            </div>
          )}
          {/* Modal para agregar/editar proyecto */}
          {(showForm || editId) && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(35,39,43,0.85)',
              color: '#fff',
              borderRadius: 22,
              boxShadow: '0 8px 32px 0 rgba(13,110,253,0.22)',
              padding: 32,
              minWidth: 480,
              width: 520,
              zIndex: 2000,
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(56,152,241,0.18)',
              fontFamily: 'inherit',
              transition: 'all 0.25s',
              maxWidth: '95vw',
            }}>
              <h3 className="mb-3" style={{
                color: '#6dd5fa',
                fontWeight: 800,
                fontSize: '1.5rem',
                letterSpacing: 1,
                marginBottom: 18,
                textAlign: 'center',
                textShadow: '0 0 12px #000'
              }}>{editId ? 'Editar Proyecto' : 'Agregar Proyecto'}</h3>
              <form onSubmit={editId ? handleUpdateProject : handleAddProject} className="d-flex flex-column align-items-center" style={{width: '100%'}}>
                {['title', 'description', 'technologies', 'github'].map((field) => (
                  <EditableButtonInput
                    key={field}
                    value={newProject[field]}
                    onChange={handleInputChange}
                    name={field}
                    placeholder={
                      field === 'title' ? 'Título' :
                      field === 'description' ? 'Descripción' :
                      field === 'technologies' ? 'Tecnologías (separadas por coma)' :
                      'Enlace a GitHub'
                    }
                    style={{ borderRadius: 10, fontSize: '1.1rem', marginBottom: 14, width: '100%', background: 'rgba(255,255,255,0.10)', border: '1.5px solid #3898f1', color: '#fff' }}
                    autoFocus={showForm && !editId && field === 'title'}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    disabled={showForm && !editId && loading}
                  />
                ))}
                <select
                  name="status"
                  value={newProject.status}
                  onChange={handleInputChange}
                  style={{
                    borderRadius: 10,
                    fontSize: '1.1rem',
                    marginBottom: 16,
                    width: '100%',
                    padding: '0.7rem 1.2rem',
                    fontWeight: 700,
                    color: !newProject.status ? '#888' : '#23272b',
                    background: !newProject.status ? 'rgba(255,255,255,0.10)' : '#fff',
                    border: '1.5px solid #3898f1',
                    boxShadow: '0 2px 8px rgba(56,152,241,0.08)',
                    outline: 'none',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                  }}
                >
                  <option value="" disabled hidden>Estado del proyecto</option>
                  <option value="Finalizado" style={{ fontWeight: 'bold' }}>Finalizado</option>
                  <option value="En Proceso" style={{ fontWeight: 'bold' }}>En Proceso</option>
                </select>
                <div className="d-flex w-100 justify-content-center mt-3" style={{ gap: 40, marginTop: 18, justifyContent: 'center', display: 'flex' }}>
                  <button
                    type="submit"
                    className="bottom-google-login d-flex align-items-center justify-content-center gap-2 px-4 py-2"
                    disabled={loading || !newProject.title || !newProject.description || !newProject.technologies || !newProject.github || !newProject.status}
                    style={{
                      padding: '0.5rem 1.4rem',
                      fontSize: '1.05rem',
                      borderRadius: 10,
                      background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      border: 'none',
                      boxShadow: '0 2px 8px #3898f1',
                      transition: 'all 0.18s',
                      cursor: 'pointer',
                      opacity: (loading || !newProject.title || !newProject.description || !newProject.technologies || !newProject.github || !newProject.status) ? 0.5 : 1,
                      pointerEvents: (loading || !newProject.title || !newProject.description || !newProject.technologies || !newProject.github || !newProject.status) ? 'none' : 'auto',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,110,253,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    {editId ? 'Actualizar Proyecto' : 'Agregar Proyecto'}
                  </button>
                  <button
                    type="button"
                    className="bottom-google-login d-flex align-items-center justify-content-center gap-2 px-4 py-2"
                    onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '', status: '' }); }}
                    style={{
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
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,110,253,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
              <button onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '', status: '' }); }} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, textShadow: '0 0 8px #3898f1' }} title="Cerrar">×</button>
            </div>
          )}
          {/* Botón para abrir el modal */}
          <div className="d-flex justify-content-center mb-4" style={{ marginLeft: '32rem'}}>
            <button
              className="bottom-add d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              onClick={() => {
                setShowForm(true);
                setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
                setEditingField(null);
              }}
            >
              Agregar Proyecto
            </button>

            <button
              className="filtro-btn filtro-btn-custom"
              style={{
                marginLeft: '29rem',
                boxShadow: showFilter ? '0 0 0 3px #3898f1' : 'none',
                background: 'transparent'
              }}
              onClick={() => setShowFilter(f => !f)}
              title="Filtrar proyectos"
            >
              <img src={miFiltro} alt="Filtrar" width={36} height={36} />
            </button>
          </div>
          {(loading && (showForm || editId)) ? (
            <p>Cargando proyectos...</p>
          ) : (
            <div className="project-list">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={user && user.uid === project.uid}
                />
              ))}
              {filteredProjects.length === 0 && <p>No tienes proyectos aún.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EditableButtonInput({ value, onChange, name, placeholder, style, autoFocus, editingField, setEditingField }) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (autoFocus) {
      setEditing(true);
      setEditingField(name);
    }
  }, [autoFocus, name, setEditingField]);

  React.useEffect(() => {
    if (editing && inputRef.current && editingField === name) {
      if (name === 'title' && autoFocus) {
        inputRef.current.focus({ preventScroll: true });
        inputRef.current.select();
      } else {
        inputRef.current.focus({ preventScroll: true });
      }
    }
  }, [editing, name, autoFocus, editingField]);

  const handleButtonClick = () => {
    setEditing(true);
    setEditingField(name);
  };

  const handleBlur = () => {
    setEditing(false);
    setEditingField(null);
  };

  return (
    <div style={{ width: '100%' }}>
      {editing && editingField === name ? (
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{
            ...style,
            background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
            color: '#23272b',
            border: '2px solid #dadce0',
            padding: '0.7rem 1.2rem',
            fontWeight: 600,
            fontSize: '1.15rem',
            boxShadow: '0 8px 24px rgba(13,110,253,0.18)',
            transition: 'background 0.18s, box-shadow 0.18s, border 0.18s',
            outline: 'none',
            borderRadius: 12,
            transform: 'translateY(3px) scale(1.05)',
            maxWidth: '100%',
            width: '90%'
          }}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const fields = ['title', 'description', 'technologies', 'github'];
              const idx = fields.indexOf(name);
              if (idx !== -1 && idx < fields.length - 1) {
                handleBlur();
                setTimeout(() => {
                  if (typeof window !== 'undefined') {
                    const nextBtn = document.querySelector(`button[name='${fields[idx+1]}']`);
                    if (nextBtn) nextBtn.click();
                  }
                }, 0);
              } else if (name === 'github') {
                // Si es el último campo, dispara el submit del formulario
                if (inputRef.current) {
                  let form = inputRef.current.form;
                  if (form) form.requestSubmit();
                }
                // El cierre del modal se maneja solo en handleAddProject
              }
            }
          }}
        />
      ) : (
        <button
          type="button"
          name={name}
          className="bottom-google-login d-flex align-items-center justify-content-start gap-2 px-4 py-2 mb-2 editable-btn-input"
          style={{
            ...style,
            width: '100%',
            justifyContent: 'flex-start',
            background: 'linear-gradient(90deg, #fff 60%, #e0e7ff 100%)',
            color: value ? '#23272b' : '#888',
            border: '2px solid #dadce0',
            fontWeight: 600,
            textAlign: 'left',
            fontSize: '1.15rem',
            borderRadius: 12,
            boxShadow: value ? '0 4px 16px rgba(13,110,253,0.10)' : 'none',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={handleButtonClick}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {value || <span style={{ color: '#888' }}>{placeholder}</span>}
          </span>
        </button>
      )}
    </div>
  );
}

export default App;
