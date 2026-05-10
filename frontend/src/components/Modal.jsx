import { useState, useEffect } from "react";

function Modal({ isOpen, onClose, title, children, footer, size = "medium" }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 200); // дать время на анимацию
  };

  // Разные размеры модалей
  const sizeStyles = {
    small: { maxWidth: "400px" },
    medium: { maxWidth: "600px" },
    large: { maxWidth: "900px" },
    fullscreen: { maxWidth: "95vw", maxHeight: "95vh" },
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${showModal ? "active" : ""}`} onClick={handleClose}>
      <div
        className={`modal-content ${showModal ? "active" : ""}`}
        style={sizeStyles[size]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Содержимое */}
        <div className="modal-body">{children}</div>

        {/* Футер (кнопки) */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .modal-overlay.active {
          background-color: rgba(0, 0, 0, 0.5);
          opacity: 1;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          transform: scale(0.8);
          opacity: 0;
          transition: all 200ms ease;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content.active {
          transform: scale(1);
          opacity: 1;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          transition: color 200ms;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #1f2937;
        }

        .modal-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 90vw;
          }
        }
      `}</style>
    </div>
  );
}

export default Modal;
