import React, { useRef, useEffect } from "react";

// Componente modal para selección de repositorios
export default function RepoSelectorModal({ 
  isOpen, 
  onClose, 
  repositories, 
  selectedRepos, 
  toggleSelect, 
  toggleSelectAll,
  formatDate,
  t,
  language
}) {
  // Referencia para el modal para poder detectar clics fuera del contenido
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Efecto para añadir/quitar eventos cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Previene el scroll en el body cuando el modal está abierto
      
      // Añadir handler para tecla escape
      const handleEscKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.body.style.overflow = 'auto'; // Restaura el scroll al cerrar
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  // Manejador de clics en el overlay del modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="repo-modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        ref={contentRef}
        className="repo-modal-content"
        style={{
          backgroundColor: 'rgba(25, 28, 32, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56,152,241,0.3)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid rgba(56,152,241,0.4)',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header del modal */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid rgba(56,152,241,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(35,39,43,0.8)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-github" style={{
              fontSize: '1.8rem',
              color: '#6dd5fa',
              textShadow: '0 0 10px rgba(56,152,241,0.6)'
            }}></i>
            <h2 style={{
              margin: 0,
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              {t.showReposButton}
            </h2>
            <div style={{
              background: selectedRepos.length === repositories.length 
                ? 'linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%)' 
                : 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              {selectedRepos.length} / {repositories.length} {t.selected}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={toggleSelectAll}
              style={{
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
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
              }}
            >
              <i className={`bi ${selectedRepos.length === repositories.length ? 'bi-square' : 'bi-check-all'}`} 
                 style={{fontSize: '1.1rem'}}></i>
              {selectedRepos.length === repositories.length ? t.deselectAll : t.selectAll}
            </button>
          
            <button
              onClick={onClose}
              style={{
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
              <i className="bi bi-x-lg" style={{fontSize: '1.1rem'}}></i>
              {language === 'es' ? 'Aceptar' : 'Accept'}
            </button>
          </div>
        </div>
        
        {/* Contenido del modal - Lista de repositorios */}
        <div style={{
          overflowY: 'auto',
          padding: '15px',
          flexGrow: 1
        }}>
          <div className="repo-list" style={{ 
            borderRadius: '14px',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.25)',
          }}>
            {repositories.map(repo => (
              <div 
                key={repo.id} 
                className="repo-item d-flex"
                style={{ 
                  cursor: 'pointer',
                  borderBottom: '2px solid rgba(56,152,241,0.2)',
                  transition: 'all 0.3s',
                  background: selectedRepos.includes(repo.id) ? 'rgba(56,152,241,0.25)' : 'rgba(0,0,0,0.15)',
                  borderRadius: '10px',
                  margin: '12px 4px',
                  padding: '18px',
                  boxShadow: selectedRepos.includes(repo.id) 
                    ? '0 4px 12px rgba(56,152,241,0.4)' 
                    : '0 2px 6px rgba(0,0,0,0.2)',
                  border: selectedRepos.includes(repo.id) ? '2px solid rgba(56,152,241,0.8)' : '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => toggleSelect(repo.id)}
                onMouseEnter={e => {
                  e.currentTarget.style.background = selectedRepos.includes(repo.id) ? 'rgba(56,152,241,0.35)' : 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = selectedRepos.includes(repo.id) ? '0 5px 15px rgba(56,152,241,0.5)' : '0 3px 10px rgba(0,0,0,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = selectedRepos.includes(repo.id) ? 'rgba(56,152,241,0.25)' : 'rgba(0,0,0,0.15)';
                  e.currentTarget.style.boxShadow = selectedRepos.includes(repo.id) ? '0 4px 12px rgba(56,152,241,0.4)' : 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div 
                  style={{
                    position: 'relative',
                    marginRight: '15px',
                    minWidth: '24px'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedRepos.includes(repo.id)} 
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(repo.id);
                    }}
                    className="mt-1"
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      accentColor: '#3898f1',
                      cursor: 'pointer',
                      opacity: '0.9',
                      transform: 'scale(1.2)',
                      boxShadow: selectedRepos.includes(repo.id) ? '0 0 5px rgba(109,213,250,0.8)' : 'none',
                      borderRadius: '4px'
                    }}
                  />
                  {selectedRepos.includes(repo.id) && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#6dd5fa',
                      borderRadius: '50%',
                      padding: '2px',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                    }}>
                      <i className="bi bi-check" style={{ fontSize: '10px', color: '#212529' }}></i>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <strong style={{ fontSize: '1.25rem', color: '#6dd5fa', textShadow: '0 0 10px rgba(0,0,0,0.7)' }}>{repo.name.replace(/-/g, ' ').replace(/_/g, ' ')}</strong>
                    <div>
                      <span className="badge me-2" style={{
                        background: '#212529',
                        fontSize: '0.9rem',
                        padding: '5px 8px'
                      }} title="Stars">
                        <i className="bi bi-star-fill me-1" style={{color: '#FFD700'}}></i> {repo.stargazers_count}
                      </span>
                      <span className="badge" style={{
                        background: '#6c757d',
                        fontSize: '0.9rem',
                        padding: '5px 8px'
                      }} title={t.updated}>
                        <i className="bi bi-clock-history me-1"></i> {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                  <p className="mb-3" style={{ 
                    color: '#e0e0e0', 
                    fontStyle: repo.description ? 'normal' : 'italic',
                    fontSize: '1rem',
                    lineHeight: '1.4'
                  }}>
                    {repo.description || t.noDescription}
                  </p>
                  {(repo.language || (repo.topics && repo.topics.length > 0)) && (
                    <div>
                      <small style={{ color: '#9e9e9e', fontSize: '0.95rem', fontWeight: '600' }}>{t.techsUsed}:</small>
                      <div className="tech-tags mt-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {repo.language && (
                          <span className="badge me-1" style={{ 
                            background: 'linear-gradient(90deg,#3898f1 60%,#6dd5fa 100%)',
                            padding: '6px 10px',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.25)'
                          }}>
                            <i className="bi bi-code-slash me-1"></i> {repo.language}
                          </span>
                        )}
                        {repo.topics && repo.topics.map(topic => (
                          <span key={topic} className="badge me-1" style={{ 
                            background: 'rgba(23,162,184,0.8)',
                            padding: '6px 10px',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.25)'
                          }}>
                            <i className="bi bi-hash"></i> {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer del modal con botón de cerrar */}
        <div style={{
          padding: '15px 24px',
          borderTop: '2px solid rgba(56,152,241,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(35,39,43,0.8)'
        }}>
          <div>
            <span style={{ color: '#e0e0e0', fontSize: '1.05rem' }}>
              <i className="bi bi-check2-circle me-2" style={{ color: '#6dd5fa' }}></i>
              {selectedRepos.length} {language === 'es' ? 'repositorios seleccionados' : 'repositories selected'}
            </span>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #4ba3f7 60%, #84ddfb 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3898f1 60%, #6dd5fa 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
            }}
          >
            <i className="bi bi-check-lg" style={{fontSize: '1.2rem'}}></i>
            {language === 'es' ? 'Confirmar selección' : 'Confirm selection'}
          </button>
        </div>
      </div>
      
      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
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
      `}</style>
    </div>
  );
}
