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
          <div className="d-flex justify-content-center mt-2" style={{ gap: '1.2rem', display: 'flex' }}>
            <button
              className="bottom-edit d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              style={{ transition: 'opacity 0.2s, box-shadow 0.2s' }}
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,110,253,0.18)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              Editar
            </button>
            <button
              className="bottom-delete d-flex align-items-center justify-content-center gap-2 px-4 py-2"
              style={{ transition: 'opacity 0.2s, box-shadow 0.2s' }}
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,110,253,0.18)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
