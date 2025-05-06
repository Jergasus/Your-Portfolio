import React from "react";
import { projects as projectData } from "./data/projects";
import ProjectCard from "./components/ProjectCard";
import "./App.css";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
// import { db } from "./firebase";
// import { collection, addDoc, query, where, getDocs, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import miFiltro from './assets/filtro.png';

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github: '', status: '' });
  const [editId, setEditId] = useState(null);
  // Estados para animación de modales
  const [showFilter, setShowFilter] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  // Obtener todas las tecnologías únicas de los proyectos
  const allTechnologies = Array.from(new Set(projects.flatMap(p => Array.isArray(p.technologies) ? p.technologies : (p.technologies || '').split(',').map(t => t.trim()).filter(Boolean))));
  const [filterTechs, setFilterTechs] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Validación avanzada de formularios
  const validateProject = (project) => {
    const errors = {};
    if (!project.title.trim()) errors.title = 'El título es obligatorio.';
    if (!project.description.trim()) errors.description = 'La descripción es obligatoria.';
    if (!project.status) errors.status = 'El estado es obligatorio.';
    // Validar tecnologías
    const techs = project.technologies.split(',').map(t => t.trim()).filter(Boolean);
    if (techs.length === 0) errors.technologies = 'Debes ingresar al menos una tecnología.';
    if (new Set(techs).size !== techs.length) errors.technologies = 'No repitas tecnologías.';
    // Validar GitHub
    if (!project.github.trim()) {
      errors.github = 'El enlace de GitHub es obligatorio.';
    } else if (!/^https:\/\/(www\.)?github\.com\/.+/.test(project.github.trim())) {
      errors.github = 'El enlace debe ser una URL válida de GitHub.';
    }
    return errors;
  };

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
    fetch(`http://localhost:4000/projects/${user.uid}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    const errors = validateProject(newProject);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowForm(false);
    setEditId(null);
    setEditingField(null);
    setLoading(true);

    const projectToAdd = {
      ...newProject,
      technologies: newProject.technologies.split(",").map(t => t.trim()),
      id: Date.now().toString(),
      uid: user.uid,
      createdAt: new Date(),
      status: newProject.status || 'Finalizado'
    };
    const updatedProjects = [...projects, projectToAdd];
    await saveProjects(updatedProjects);
    setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
    setFormErrors({});
    setLoading(false);
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
    const updatedProjects = projects.filter(p => p.id !== id);
    await saveProjects(updatedProjects);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editId) return;
    const errors = validateProject(newProject);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowForm(false);
    setEditId(null);
    setEditingField(null);
    setLoading(true);

    const updatedProjects = projects.map(p =>
      p.id === editId
        ? {
            ...p,
            title: newProject.title,
            description: newProject.description,
            technologies: newProject.technologies.split(",").map(t => t.trim()),
            github: newProject.github,
            status: newProject.status,
          }
        : p
    );
    await saveProjects(updatedProjects);
    setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
    setFormErrors({});
    setLoading(false);
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
  const [language, setLanguage] = useState('es');

  const texts = {
    es: {
      welcome: 'Bienvenido,',
      createManage: 'Crea y gestiona tu portafolio profesional en minutos.\nInicia sesión para comenzar.',
      login: 'Iniciar sesión con Google',
      logout: 'Cerrar sesión',
      projects: 'Proyectos',
      filterProjects: 'Filtrar Proyectos',
      status: 'Estado:',
      all: 'Todos',
      inProgress: 'En Proceso',
      finished: 'Finalizado',
      technologies: 'Tecnologías:',
      clear: 'Limpiar',
      close: 'Cerrar',
      addProject: 'Agregar Proyecto',
      editProject: 'Editar Proyecto',
      add: 'Agregar Proyecto',
      update: 'Actualizar Proyecto',
      cancel: 'Cancelar',
      noProjects: 'No tienes proyectos aún.',
      projectStatus: 'Estado del proyecto',
      title: 'Título',
      description: 'Descripción',
      techPlaceholder: 'Tecnologías (separadas por coma)',
      github: 'Enlace a GitHub',
      loading: 'Cargando proyectos...',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    en: {
      welcome: 'Welcome,',
      createManage: 'Create and manage your professional portfolio in minutes.\nSign in to get started.',
      login: 'Sign in with Google',
      logout: 'Sign out',
      projects: 'Projects',
      filterProjects: 'Filter Projects',
      status: 'Status:',
      all: 'All',
      inProgress: 'In Progress',
      finished: 'Finished',
      technologies: 'Technologies:',
      clear: 'Clear',
      close: 'Close',
      addProject: 'Add Project',
      editProject: 'Edit Project',
      add: 'Add Project',
      update: 'Update Project',
      cancel: 'Cancel',
      noProjects: 'You have no projects yet.',
      projectStatus: 'Project status',
      title: 'Title',
      description: 'Description',
      techPlaceholder: 'Technologies (comma separated)',
      github: 'GitHub link',
      loading: 'Loading projects...',
      edit: 'Edit',
      delete: 'Delete',
    }
  };

  // Animación para proyectos agregados/eliminados
  const [animatedIds, setAnimatedIds] = useState([]);
  useEffect(() => {
    // Detecta ids nuevos (proyectos recién agregados)
    const currentIds = projects.map(p => p.id);
    const nuevos = currentIds.filter(id => !animatedIds.includes(id));
    // Si hay nuevos, primero los dejamos fuera (fade-out), luego los agregamos (fade-in)
    if (nuevos.length > 0) {
      setAnimatedIds(prev => prev.filter(id => currentIds.includes(id)));
      setTimeout(() => {
        setAnimatedIds(currentIds);
      }, 50); // 50ms para permitir el render fade-out -> fade-in
    } else {
      // Si no hay nuevos, simplemente sincroniza (por ejemplo, tras borrar)
      setAnimatedIds(currentIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.map(p => p.id).join(",")]);

  // Copiar enlace público
  const handleCopyPublicLink = () => {
    if (user) {
      const url = `${window.location.origin}/public/${user.uid}`;
      navigator.clipboard.writeText(url);
      alert('¡Enlace público copiado!');
    }
  };

  const saveProjects = async (newProjects) => {
    await fetch(`http://localhost:4000/projects/${user.uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: newProjects }),
    });
    setProjects(newProjects);
  };

  return (
    <div className="container py-4">
      <header className="main-header text-center text-white py-4 mb-5" style={{paddingTop: '0.2rem', position: 'relative'}}>
        <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 3000 }}>
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="bottom-translate"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            disabled={formModalVisible && (showForm || editId)}
            style={formModalVisible && (showForm || editId) ? { pointerEvents: 'none', opacity: 0.5 } : {}}
          >
            {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
        {/* Enlace público en la esquina inferior derecha del header */}
        {user && (
          <div style={{ position: 'absolute', bottom: 18, right: 32, zIndex: 3000 }}>
            <button
              className="bottom-public-link"
              onClick={handleCopyPublicLink}
              title="Copiar enlace público"
              disabled={formModalVisible && (showForm || editId)}
              style={formModalVisible && (showForm || editId) ? { pointerEvents: 'none', opacity: 0.5 } : {}}
            >
              <i className="bi bi-link-45deg" style={{marginRight: 6}}></i> Enlace público
            </button>
          </div>
        )}
        <h1 className="display-4 fw-bold mb-2">Your Portfolio</h1>
        {user ? (
          <>
            <div className="logout-section d-flex flex-column align-items-center justify-content-center p-5 rounded shadow">
            <img src="/vite.svg" alt="Logo" style={{ width: 80, marginBottom: 5 }} />
            <p className="mb-4" style={{ color: '#e0e0e0'}}>{texts[language].welcome}</p>
            <p className="name-google" style={{ color: '#fff', fontSize: '2.2rem'}}>{user.displayName || user.email}</p>
            <button className="bottom-google-logout" onClick={handleLogout}>
              {texts[language].logout}
            </button>
          </div>
          </>
        ) : (
          <div className="login-section d-flex flex-column align-items-center justify-content-center p-5 rounded shadow">
            <img src="/vite.svg" alt="Logo" style={{ width: 80, marginBottom: 5 }} />
            <p className="mb-4" style={{ color: '#e0e0e0' }}>{texts[language].createManage}</p>
            <button className="bottom-google-login" onClick={handleLogin}>
              {texts[language].login}
            </button>
          </div>
        )}
        {/* ...puedes agregar aquí enlaces o más info... */}
      </header>
      {user && (
        <section>
          <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: '1rem'}}>
            <h2 className="featured-title mb-0">{texts[language].projects}</h2>
          </div>
          {/* Filtro avanzado con icono */}
          {filterModalVisible && (
            <div
              className={`modal-fade ${showFilter ? 'modal-fade-in' : 'modal-fade-out'}`}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                background: 'rgba(35,39,43,0.32)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <div style={{
                background: 'rgba(35,39,43,0.85)',
                color: '#fff',
                borderRadius: 22,
                boxShadow: '0 8px 32px 0 rgba(13,110,253,0.22)',
                padding: 32,
                minWidth: 480,
                width: 520,
                border: '1.5px solid rgba(56,152,241,0.18)',
                fontFamily: 'inherit',
                transition: 'all 0.25s',
                maxWidth: '95vw',
                position: 'relative',
              }}>
                <button onClick={() => setShowFilter(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, textShadow: '0 0 8px #3898f1' }} title={texts[language].close}>×</button>
                <h4 style={{
                  fontWeight: 800,
                  fontSize: '1.5rem', // Cambiado de 1.3rem a 1.5rem para igualar tamaño
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
                    onChange={e => setFilterStatus(e.target.value)}
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
                  }} onClick={() => { setFilterStatus(''); setFilterTechs([]); }}>{texts[language].clear}</button>
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
                  }} onClick={() => setShowFilter(false)}>{texts[language].close}</button>
                </div>
              </div>
            </div>
          )}
          {/* Modal para agregar/editar proyecto */}
          {formModalVisible && (
            <div
              className={`modal-fade ${showForm || editId ? 'modal-fade-in' : 'modal-fade-out'}`}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                background: 'rgba(35,39,43,0.32)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <div style={{
                background: 'rgba(35,39,43,0.85)',
                color: '#fff',
                borderRadius: 22,
                boxShadow: '0 8px 32px 0 rgba(13,110,253,0.22)',
                padding: 32,
                minWidth: 480,
                width: 520,
                border: '1.5px solid rgba(56,152,241,0.18)',
                fontFamily: 'inherit',
                transition: 'all 0.25s',
                maxWidth: '95vw',
                position: 'relative',
              }}>
                <h3 className="mb-3" style={{
                  color: '#6dd5fa',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: 1,
                  marginBottom: 18,
                  textAlign: 'center',
                  textShadow: '0 0 12px #000'
                }}>{editId ? texts[language].editProject : texts[language].addProject}</h3>
                <form onSubmit={editId ? handleUpdateProject : handleAddProject} className="d-flex flex-column align-items-center" style={{width: '100%'}}>
                  {/* Primero el estado */}
                  <div className="editable-field-container" style={{ width: '100%', marginBottom: 16 }}>
                    <select
                      className="filtro-select"
                      name="status"
                      value={newProject.status}
                      onChange={handleInputChange}
                      style={{
                        borderRadius: 10,
                        fontSize: '1.1rem',
                        width: '100%',
                        background: 'rgba(255,255,255,0.10)',
                        border: '1.5px solid #3898f1',
                        color: '#fff',
                        padding: '0.7rem 1.2rem',
                        fontWeight: 600,
                        marginBottom: 0
                      }}
                    >
                      <option value="" disabled hidden>{texts[language].projectStatus}</option>
                      <option value="Finalizado" style={{ fontWeight: 'bold' }}>{texts[language].finished}</option>
                      <option value="En Proceso" style={{ fontWeight: 'bold' }}>{texts[language].inProgress}</option>
                    </select>
                    {formErrors.status && <div style={{color:'#ffb3b3', fontWeight:600, marginBottom:10}}>{formErrors.status}</div>}
                  </div>
                  {/* Después los campos */}
                  {['title', 'description', 'technologies', 'github'].map((field, idx) => (
                    <div key={field} className="editable-field-container">
                      <EditableButtonInput
                        value={newProject[field]}
                        onChange={handleInputChange}
                        name={field}
                        placeholder={
                          field === 'title' ? texts[language].title :
                          field === 'description' ? texts[language].description :
                          field === 'technologies' ? texts[language].techPlaceholder :
                          texts[language].github
                        }
                        style={{ borderRadius: 10, fontSize: '1.1rem', width: '100%', background: 'rgba(255,255,255,0.10)', border: '1.5px solid #3898f1', color: '#fff' }}
                        autoFocus={showForm && !editId && field === 'title'}
                        editingField={editingField}
                        setEditingField={setEditingField}
                        disabled={showForm && !editId && loading}
                      />
                      {formErrors[field] && <div style={{color:'#ffb3b3', fontWeight:600, marginBottom:10}}>{formErrors[field]}</div>}
                    </div>
                  ))}
                  <div className="d-flex w-100 justify-content-center mt-3" style={{ gap: 40, marginTop: 18, justifyContent: 'center', display: 'flex' }}>
                    <button
                      type="submit"
                      className="bottom-google-logout d-flex align-items-center justify-content-center gap-2 px-4 py-2"
                      // El botón siempre está activo
                      style={{
                        padding: '0.5rem 1.4rem',
                        fontSize: '1.05rem',
                        borderRadius: 10,
                        background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                        transition: 'all 0.18s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0px 20px #3898f1'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                      {editId ? texts[language].update : texts[language].add}
                    </button>
                    <button
                      type="button"
                      className="bottom-google-logout d-flex align-items-center justify-content-center gap-2 px-4 py-2"
                      onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '', status: '' }); }}
                      style={{
                        padding: '0.5rem 1.4rem',
                        fontSize: '1.05rem',
                        borderRadius: 10,
                        background: 'linear-gradient(90deg,#fff 60%,#e0e7ff 100%)',
                        color: '#3898f1',
                        fontWeight: 700,
                        border: 'none',
                        transition: 'all 0.18s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0px 20px #fff'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                      {texts[language].cancel}
                    </button>
                  </div>
                </form>
                <button onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '', status: '' }); }} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, textShadow: '0 0 8px #3898f1' }} title={texts[language].close}>×</button>
              </div>
            </div>
          )}
          {/* Botón para abrir el modal */}
          <div className="d-flex justify-content-center mb-4" style={{ marginLeft: '32rem'}}>
          <button
            className="bottom-add d-flex align-items-center justify-content-center gap-2 px-4 py-2"
            onClick={() => {
              setShowForm(true);
              setFormModalVisible(true); // Asegura que el modal se monte
              setNewProject({ title: '', description: '', technologies: '', github: '', status: '' });
              setEditingField(null);
            }}
          >
            {texts[language].addProject}
          </button>

          <button
            className="filtro-btn filtro-btn-custom"
            style={{
              marginLeft: '29rem',
              boxShadow: showFilter ? '0 0 0 3px #3898f1' : 'none',
              background: 'transparent'
            }}
            onClick={() => {
              setShowFilter(f => {
                if (!f) setFilterModalVisible(true); // Asegura que el modal se monte
                return !f;
              });
            }}
            title={texts[language].filterProjects}
          >
            <img src={miFiltro} alt="Filtrar" width={36} height={36} />
          </button>
        </div>
          {/* Mensaje de no proyectos justo debajo de los botones */}
          {filteredProjects.length === 0 && !loading && (
            <div style={{ textAlign: 'center', marginBottom: '2rem', fontWeight: 600, color: '#000', fontSize: '1.2rem' }}>
              {texts[language].noProjects}
            </div>
          )}
          {loading && (
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'120px'}}>
          {/* Eliminado el texto de Cargando proyectos... */}
        </div>
      )}
          <div className="project-list animate-fade">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`project-anim ${animatedIds.includes(project.id) ? 'fade-in' : 'fade-out'}`}
                style={{transition: 'all 0.5s'}}>
                <ProjectCard
                  project={project}
                  onEdit={handleEdit}
                  onDelete={async (id) => {
                    setAnimatedIds(ids => ids.filter(pid => pid !== id));
                    setTimeout(() => handleDelete(id), 400);
                  }}
                  isOwner={user && user.uid === project.uid}
                  language={language}
                  texts={texts}
                />
              </div>
            ))}
          </div>
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
          onBlur={e => { handleBlur(); e.target.style.border = '2px solid #3898f1'; }}
          placeholder={placeholder}
          style={{
            ...style,
            background: '#111',
            color: '#fff',
            border: '2px solid #3898f1',
            padding: '0.7rem 1.2rem',
            fontWeight: 600,
            fontSize: '1.15rem',
            boxShadow: 'none',
            transition: 'border 0.18s',
            outline: 'none',
            borderRadius: 10,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            minHeight: 0,
            height: '44px',
            lineHeight: '1.15',
            transform: 'none',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
            textAlign: 'left',
            fontFamily: 'inherit',
            letterSpacing: 0,
            wordSpacing: 0,
            fontStyle: 'normal',
            fontVariant: 'normal',
            fontStretch: 'normal',
            verticalAlign: 'middle',
            // Para evitar movimiento: font smoothing y appearance
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            appearance: 'none',
          }}
          tabIndex={0}
          autoFocus
          onFocus={e => {
            e.target.style.border = '2px solid #6dd5fa';
            if (e.target.value) {
              e.target.setSelectionRange(0, e.target.value.length);
            }
          }}
          onMouseEnter={e => e.target.style.border = '2px solid #6dd5fa'}
          onMouseLeave={e => e.target.style.border = '2px solid #3898f1'}
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
                if (inputRef.current) {
                  let form = inputRef.current.form;
                  if (form) form.requestSubmit();
                }
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
            background: '#111',
            color: value ? '#fff' : '#888',
            border: '2px solid #3898f1',
            fontWeight: 600,
            textAlign: 'left',
            fontSize: '1.15rem',
            borderRadius: 10,
            boxShadow: 'none',
            transition: 'border 0.18s',
            position: 'relative',
            overflow: 'hidden',
            transform: 'none',
            minWidth: 0,
            minHeight: 0,
            height: '44px',
            lineHeight: '1.15',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
            padding: '0.7rem 1.2rem',
            fontFamily: 'inherit',
            letterSpacing: 0,
            wordSpacing: 0,
            fontStyle: 'normal',
            fontVariant: 'normal',
            fontStretch: 'normal',
            verticalAlign: 'middle',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            appearance: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.border = '2px solid #6dd5fa'}
          onMouseLeave={e => e.currentTarget.style.border = '2px solid #3898f1'}
          onClick={handleButtonClick}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
            {value || <span style={{ color: '#888' }}>{placeholder}</span>}
          </span>
        </button>
      )}
    </div>
  );
}

export default App;
