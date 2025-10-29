
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { FileText, TrendingUp, Target } from 'lucide-react';

const BlogPage = () => {
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
      <Helmet>
        <title>Blog DB Empresas - Artigos sobre CNPJ, Prospecção e Dados Empresariais</title>
        <meta name="description" content="Artigos, tutoriais e dicas sobre consulta de CNPJ, prospecção B2B, integração de API, compliance e análise de dados empresariais." />
        <meta name="keywords" content="blog CNPJ, artigos dados empresas, tutoriais API CNPJ, dicas prospecção B2B, compliance empresarial" />
        <link rel="canonical" href="https://dbempresas.com.br/blog" />
        <meta property="og:title" content="Blog DB Empresas - Artigos sobre Dados Empresariais" />
        <meta property="og:description" content="Artigos, tutoriais e dicas sobre consulta de CNPJ e dados empresariais." />
        <meta property="og:url" content="https://dbempresas.com.br/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

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
