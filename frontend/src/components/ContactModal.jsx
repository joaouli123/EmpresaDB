import { useState } from 'react';
import { X } from 'lucide-react';
import './ContactModal.css';

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFormData({ name: '', phone: '' });
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-content">
          {!submitted ? (
            <>
              <h2>Entre em Contato</h2>
              <p>Preencha seus dados e logo um de nossos vendedores entrará em contato</p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Nome completo *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefone/WhatsApp *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="(41) 9999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="btn-submit">
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Obrigado!</h2>
              <p>Logo um de nossos vendedores vai entrar em contato com você.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
