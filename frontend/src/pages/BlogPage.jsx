
import { useEffect } from 'react';
import SharedLayout from '../components/SharedLayout';
import { FileText, TrendingUp, Target } from 'lucide-react';

const BlogPage = () => {
  useEffect(() => {
    const setMeta = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    document.title = 'Blog DB Empresas - Artigos sobre CNPJ, Prospecção e Dados Empresariais';
    setMeta('description', 'Artigos, tutoriais e dicas sobre consulta de CNPJ, prospecção B2B, integração de API, compliance e análise de dados empresariais.');
    setMeta('keywords', 'blog CNPJ, artigos dados empresas, tutoriais API CNPJ, dicas prospecção B2B, compliance empresarial');
    setMeta('og:title', 'Blog DB Empresas - Artigos sobre Dados Empresariais', true);
    setMeta('og:description', 'Artigos, tutoriais e dicas sobre consulta de CNPJ e dados empresariais.', true);
    setMeta('og:url', 'https://dbempresas.com.br/blog', true);
    setMeta('og:type', 'website', true);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://dbempresas.com.br/blog');
  }, []);

  const posts = [
    {
      title: "Como Usar Dados de CNPJ para Prospecção B2B Eficiente",
      excerpt: "Descubra as melhores práticas para encontrar leads qualificados usando dados da Receita Federal.",
      date: "15 Jan 2024",
      category: "Prospecção"
    },
    {
      title: "API de CNPJ: Guia Completo de Integração",
      excerpt: "Aprenda a integrar nossa API REST em sua aplicação com exemplos práticos em múltiplas linguagens.",
      date: "10 Jan 2024",
      category: "Desenvolvimento"
    },
    {
      title: "Compliance e LGPD: Como Validar Empresas de Forma Segura",
      excerpt: "Entenda as melhores práticas de compliance ao usar dados empresariais em conformidade com a LGPD.",
      date: "05 Jan 2024",
      category: "Compliance"
    }
  ];

  return (
    <SharedLayout>
      <div className="page-hero">
        <h1>Blog</h1>
        <p>Artigos, tutoriais e novidades sobre dados empresariais</p>
      </div>

      <div className="content-section">
        <div style={{ display: 'grid', gap: '30px' }}>
          {posts.map((post, index) => (
            <div key={index} className="feature-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileText size={24} color="#3b82f6" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{post.date} • {post.category}</span>
              </div>
              <h3 style={{ marginBottom: '12px' }}>{post.title}</h3>
              <p style={{ margin: 0 }}>{post.excerpt}</p>
              <span style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px', display: 'inline-block' }}>
                Em breve...
              </span>
            </div>
          ))}
        </div>
      </div>
    </SharedLayout>
  );
};

export default BlogPage;
