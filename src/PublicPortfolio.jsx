import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ProjectCard from "./components/ProjectCard";
import "./App.css";

export default function PublicPortfolio() {
  const { uid } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const q = query(collection(db, "projects"), where("uid", "==", uid));
      const snap = await getDocs(q);
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchProjects();
  }, [uid]);

  return (
    <div className="container py-4">
      <h1 className="featured-title">Portafolio público</h1>
      {loading ? (
        <p style={{color:'#3898f1', fontWeight:700}}>Cargando proyectos...</p>
      ) : (
        <div className="project-list">
          {projects.length === 0 ? (
            <p>No hay proyectos públicos para este usuario.</p>
          ) : (
            projects.map(project => (
              <ProjectCard key={project.id} project={project} isOwner={false} language="es" texts={{es:{edit:'',delete:'',finished:'Finalizado',inProgress:'En Proceso'}}} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
