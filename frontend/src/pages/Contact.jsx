
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <SharedLayout>
      <Helmet>
        <title>Contato - DB Empresas | Fale Conosco via WhatsApp ou Email</title>
        <meta name="description" content="Entre em contato com a DB Empresas. WhatsApp: (41) 98785-7413 | Email: contato@dbempresas.com.br. Atendimento especializado em dados empresariais." />
        <meta name="keywords" content="contato DB Empresas, suporte CNPJ API, whatsapp DB Empresas, email contato empresas, atendimento consulta CNPJ" />
        <link rel="canonical" href="https://dbempresas.com.br/contato" />
        <meta property="og:title" content="Contato - DB Empresas" />
        <meta property="og:description" content="Fale conosco via WhatsApp ou email. Atendimento especializado." />
      </Helmet>

      <div className="page-hero">
        <h1>Entre em Contato</h1>
        <p>Estamos prontos para ajudar você. Fale conosco agora!</p>
      </div>

      <div className="content-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          <div className="feature-card">
            <Phone size={40} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>WhatsApp</h3>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginTop: '12px' }}>
              (41) 98785-7413
            </p>
            <a 
              href="https://wa.me/5541987857413?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20DB%20Empresas" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-block', 
                marginTop: '12px', 
                color: '#3b82f6', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Iniciar Conversa →
            </a>
          </div>

          <div className="feature-card">
            <Mail size={40} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Email</h3>
            <p style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginTop: '12px' }}>
              contato@dbempresas.com.br
            </p>
            <a 
              href="mailto:contato@dbempresas.com.br" 
              style={{ 
                display: 'inline-block', 
                marginTop: '12px', 
                color: '#3b82f6', 
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Enviar Email →
            </a>
          </div>

          <div className="feature-card">
            <Clock size={40} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Horário de Atendimento</h3>
            <p style={{ fontSize: '18px', color: '#1f2937', marginTop: '12px' }}>
              Segunda a Sexta<br />
              <strong>9h às 18h</strong>
            </p>
          </div>

          <div className="feature-card">
            <MapPin size={40} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>CNPJ</h3>
            <p style={{ fontSize: '18px', color: '#1f2937', marginTop: '12px' }}>
              47.394.596/0001-15
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Curitiba/PR - Brasil
            </p>
          </div>
        </div>

        <div style={{ background: '#f9fafb', padding: '40px', borderRadius: '12px', marginTop: '40px' }}>
          <h2>Perguntas Frequentes</h2>
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Qual o prazo de resposta?</h3>
            <p>Respondemos em até 24 horas úteis via email e em minutos via WhatsApp durante horário comercial.</p>

            <h3 style={{ fontSize: '20px', marginTop: '24px', marginBottom: '8px' }}>Posso testar antes de contratar?</h3>
            <p>Sim! Oferecemos 200 consultas gratuitas para você testar nossa plataforma sem compromisso.</p>

            <h3 style={{ fontSize: '20px', marginTop: '24px', marginBottom: '8px' }}>Como funciona o suporte técnico?</h3>
            <p>Oferecemos suporte via email para todos os planos e WhatsApp para planos Growth e superiores.</p>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Contact;
