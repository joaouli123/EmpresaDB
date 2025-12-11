import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SEO = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noindex = false,
  children
}) => {
  const siteName = 'DB Empresas - Consulta CNPJ';
  const defaultDescription = 'Acesso completo aos dados empresariais da Receita Federal. Consultas rápidas, precisas e atualizadas de CNPJ, empresas e sócios.';
  const defaultKeywords = 'CNPJ, consulta CNPJ, dados empresariais, Receita Federal, empresas Brasil, API CNPJ, busca CNPJ';
  const defaultImage = `${window.location.origin}/og-image.jpg`;
  const baseUrl = window.location.origin;

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = ogImage || defaultImage;
  const finalCanonicalUrl = canonicalUrl || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      
      <link rel="canonical" href={finalCanonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      <meta name="language" content="Portuguese" />
      <meta name="geo.region" content="BR" />
      <meta name="geo.placename" content="Brasil" />
      
      <meta name="author" content="DB Empresas" />
      <meta name="publisher" content="DB Empresas" />
      <meta name="copyright" content="© 2024 DB Empresas" />

      <meta httpEquiv="content-language" content="pt-BR" />
      <meta name="rating" content="general" />
      
      <meta name="theme-color" content="#3b82f6" />
      
      {children}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonicalUrl: PropTypes.string,
  ogImage: PropTypes.string,
  ogType: PropTypes.string,
  noindex: PropTypes.bool,
  children: PropTypes.node
};

export default SEO;
