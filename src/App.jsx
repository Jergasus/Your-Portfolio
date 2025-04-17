import React from "react";
import { projects as projectData } from "./data/projects";
import ProjectCard from "./components/ProjectCard";
import "./App.css";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github: '' });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
    if (!newProject.title || !newProject.description || !newProject.github) return;
    await addDoc(collection(db, "projects"), {
      ...newProject,
      technologies: newProject.technologies.split(",").map(t => t.trim()),
      uid: user.uid,
      createdAt: new Date()
    });
    setNewProject({ title: '', description: '', technologies: '', github: '' });
  };

  const handleEdit = (project) => {
    setEditId(project.id);
    setNewProject({
      title: project.title,
      description: project.description,
      technologies: project.technologies.join(", "),
      github: project.github
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
    await updateDoc(doc(db, "projects", editId), {
      title: newProject.title,
      description: newProject.description,
      technologies: newProject.technologies.split(",").map(t => t.trim()),
      github: newProject.github
    });
    setEditId(null);
    setNewProject({ title: '', description: '', technologies: '', github: '' });
  };

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
          <h2 className="featured-title">Tus Proyectos</h2>
          {/* Modal para agregar/editar proyecto */}
          {(showForm || editId) && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,34,40,0.55)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ background: '#23272b', borderRadius: 18, boxShadow: '0 8px 32px rgba(13,110,253,0.18)', padding: 32, minWidth: 340, maxWidth: 420, width: '90%', position: 'relative' }}>
                <h3 className="mb-3" style={{ color: '#fff', fontWeight: 600 }}>{editId ? 'Editar Proyecto' : 'Agregar Proyecto'}</h3>
                <form onSubmit={editId ? handleUpdateProject : handleAddProject} className="d-flex flex-column align-items-center">
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
                      style={{ borderRadius: 8, fontSize: '1.1rem', marginBottom: 12, width: '100%' }}
                    />
                  ))}
                  <div className="d-flex gap-2 w-100 justify-content-center mt-3">
                    <button type="submit" className="bottom-google-login d-flex align-items-center justify-content-center gap-2 px-4 py-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{ width: 24, height: 24 }} />
                      {editId ? 'Actualizar Proyecto' : 'Agregar Proyecto'}
                    </button>
                    <button type="button" className="bottom-google-login d-flex align-items-center justify-content-center gap-2 px-4 py-2" onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '' }); }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Cancelar" style={{ width: 24, height: 24 }} />
                      Cancelar
                    </button>
                  </div>
                </form>
                <button onClick={() => { setEditId(null); setShowForm(false); setNewProject({ title: '', description: '', technologies: '', github: '' }); }} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }} title="Cerrar">×</button>
              </div>
            </div>
          )}
          {/* Botón para abrir el modal */}
          {!showForm && !editId && (
            <div className="d-flex justify-content-center mb-4">
              <button className="bottom-google-login d-flex align-items-center justify-content-center gap-2 px-4 py-2" onClick={() => setShowForm(true)}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Agregar" style={{ width: 24, height: 24 }} />
                Agregar Proyecto
              </button>
            </div>
          )}
          {loading ? (
            <p>Cargando proyectos...</p>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={user && user.uid === project.uid}
                />
              ))}
              {projects.length === 0 && <p>No tienes proyectos aún.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EditableButtonInput({ value, onChange, name, placeholder, style }) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Si el mouse sale del área del input o botón, vuelve al estado normal
  const handleMouseLeave = () => {
    setEditing(false);
  };

  return (
    <div style={{ width: '100%' }} onMouseLeave={handleMouseLeave} ref={wrapperRef}>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={() => setEditing(false)}
          placeholder={placeholder}
          style={{
            ...style,
            background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
            color: '#23272b',
            border: '2px solid #0d6efd',
            padding: '0.7rem 1.2rem',
            fontWeight: 600,
            fontSize: '1.15rem',
            boxShadow: '0 4px 16px rgba(13,110,253,0.10)',
            transition: 'all 0.2s',
            outline: 'none',
            borderRadius: 12,
          }}
        />
      ) : (
        <button
          type="button"
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
          onMouseEnter={() => setEditing(true)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://cdn-icons-png.flaticon.com/512/1828/1828911.png" alt="edit" style={{ width: 20, height: 20, opacity: 0.7 }} />
            {value || <span style={{ color: '#888' }}>{placeholder}</span>}
          </span>
        </button>
      )}
    </div>
  );
}

export default App;
