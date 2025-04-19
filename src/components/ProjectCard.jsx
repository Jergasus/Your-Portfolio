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
      style={{ textDecoration: "none", cursor: 'pointer', position: 'relative' }}
      onClick={handleCardClick}
    >
      {/* Badge de estado en la esquina superior izquierda */}
      <span
        className="badge-tech"
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          zIndex: 2,
          background: project.status === 'En Proceso' ? 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)' : 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '6px 18px',
          borderRadius: 14,
          letterSpacing: '0.7px',
          boxShadow: '0 0 15px #ffffff61',
          border: '2px solid #ffffff',
          minWidth: 110,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {project.status || 'Finalizado'}
      </span>
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
          <div className="d-flex justify-content-center mt-2" style={{ gap: '1.2rem', display: 'flex' }}>
            <button
              className="bottom-edit d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            >
              Editar
            </button>
            <button
              className="bottom-delete d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
