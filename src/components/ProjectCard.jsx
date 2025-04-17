import React from "react";

export default function ProjectCard({ project, onEdit, onDelete, isOwner }) {
  const handleCardClick = (e) => {
    // Evita que los botones de editar/eliminar disparen el enlace
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    window.open(project.github, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card mb-4 shadow-sm border-0 d-flex flex-column justify-content-between align-items-stretch text-center h-100 project-link"
      style={{ textDecoration: "none", cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      <div className="card-body d-flex flex-column justify-content-between align-items-stretch text-center h-100 p-0 w-100">
        <h5
          className="card-title d-flex align-items-center justify-content-center mb-3 w-100"
          style={{
            marginTop: 0,
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: '1.8rem'
          }}
        >
          <i className="bi bi-code-slash me-2 text-primary"></i> {project.title}
        </h5>
        <p className="card-text mb-3 flex-grow-1 w-100">{project.description}</p>
        <div className="mb-3 w-100 d-flex flex-wrap justify-content-center">
          {project.technologies.map((tech, idx) => (
            <span key={idx} className="badge-tech" style={{ fontSize: '0.9rem' }}>{tech}</span>
          ))}
        </div>
        {isOwner && (
          <div className="d-flex justify-content-center gap-2 mt-2">
            <button className="btn btn-warning btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(project); }}>Editar</button>
            <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}>Eliminar</button>
          </div>
        )}
      </div>
    </div>
  );
}
