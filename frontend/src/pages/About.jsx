
import { useEffect } from 'react';
import SharedLayout from '../components/SharedLayout';
import { Building2, Users, TrendingUp, Shield } from 'lucide-react';

const About = () => {
  useEffect(() => {
    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setMetaProperty = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setCanonical = (href) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    document.title = 'Sobre a DB Empresas - Líder em Dados Empresariais do Brasil';
    setMeta('description', 'Conheça a DB Empresas, empresa especializada em consulta de CNPJ e dados empresariais. Acesso a 64M+ empresas da Receita Federal com tecnologia de ponta.');
    setMeta('keywords', 'DB Empresas, sobre DB Empresas, empresa dados CNPJ, consulta empresas Brasil, API CNPJ profissional');
    setCanonical('https://dbempresas.com.br/sobre');
    setMetaProperty('og:title', 'Sobre a DB Empresas - Líder em Dados Empresariais');
    setMetaProperty('og:description', 'Empresa especializada em dados empresariais da Receita Federal. Tecnologia, segurança e confiabilidade.');
    setMetaProperty('og:url', 'https://dbempresas.com.br/sobre');
  }, []);

  return (
    <SharedLayout>
      <div className="page-hero">
        <h1>Sobre a DB Empresas</h1>
        <p>Conectando você aos dados empresariais do Brasil com tecnologia e segurança</p>
      </div>

      <div className="content-section">
        <h2>Quem Somos</h2>
        <p>
          A DB Empresas é uma empresa brasileira especializada em fornecer acesso rápido e confiável aos dados 
          empresariais da Receita Federal. Oferecemos soluções tecnológicas para 
          empresas que precisam consultar, validar e analisar informações de CNPJs.
        </p>
        <p>
          Nossa plataforma foi desenvolvida com foco em performance, segurança e facilidade de uso, permitindo 
          que nossos clientes acessem milhões de dados em milissegundos através de nossa API REST.
        </p>

        <div className="features-grid" style={{ marginTop: '60px' }}>
          <div className="feature-card">
            <Building2 size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Nossa Missão</h3>
            <p>
              Democratizar o acesso aos dados empresariais do Brasil, oferecendo tecnologia de ponta 
              para empresas de todos os portes.
            </p>
          </div>

          <div className="feature-card">
            <Users size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Nossa Equipe</h3>
            <p>
              Profissionais especializados em desenvolvimento, infraestrutura e análise de dados, 
              comprometidos com a excelência.
            </p>
          </div>

          <div className="feature-card">
            <TrendingUp size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Nossos Valores</h3>
            <p>
              Transparência, inovação, segurança e compromisso com a satisfação dos nossos clientes 
              em cada interação.
            </p>
          </div>

          <div className="feature-card">
            <Shield size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Segurança</h3>
            <p>
              Conformidade total com LGPD, dados criptografados e infraestrutura resiliente para 
              garantir a proteção das informações.
            </p>
          </div>
        </div>
      </div>

      <div className="content-section" style={{ background: '#f9fafb' }}>
        <h2>Por Que Escolher a DB Empresas?</h2>
        <div style={{ marginTop: '30px' }}>
          <ul style={{ fontSize: '18px', lineHeight: '2', color: '#4b5563' }}>
            <li>✅ Acesso a 64 milhões de empresas brasileiras</li>
            <li>✅ API REST ultra rápida (resposta em 45ms)</li>
            <li>✅ Dados 100% oficiais da Receita Federal</li>
            <li>✅ Suporte especializado via WhatsApp</li>
            <li>✅ Conformidade total com LGPD</li>
            <li>✅ Planos flexíveis para todos os tamanhos de empresa</li>
          </ul>
        </div>
      </div>
    </SharedLayout>
  );
};

export default About;
