import { useEffect } from 'react';
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
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setMetaByAttr = (attr, key, content) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    const siteName = 'DB Empresas - Consulta CNPJ';
    const defaultDescription = 'Acesso completo aos dados empresariais da Receita Federal. Consultas rápidas, precisas e atualizadas de CNPJ, empresas e sócios.';
    const defaultKeywords = 'CNPJ, consulta CNPJ, dados empresariais, Receita Federal, empresas Brasil, API CNPJ, busca CNPJ';
    const defaultImage = `${window.location.origin}/og-image.jpg`;

    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;
    const finalImage = ogImage || defaultImage;
    const finalCanonicalUrl = canonicalUrl || window.location.href;

    document.title = fullTitle;

    setMetaByAttr('name', 'description', finalDescription);
    setMetaByAttr('name', 'keywords', finalKeywords);
    setMetaByAttr('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setLink('canonical', finalCanonicalUrl);

    setMetaByAttr('property', 'og:title', fullTitle);
    setMetaByAttr('property', 'og:description', finalDescription);
    setMetaByAttr('property', 'og:type', ogType);
    setMetaByAttr('property', 'og:url', finalCanonicalUrl);
    setMetaByAttr('property', 'og:image', finalImage);
    setMetaByAttr('property', 'og:site_name', siteName);
    setMetaByAttr('property', 'og:locale', 'pt_BR');

    setMetaByAttr('name', 'twitter:card', 'summary_large_image');
    setMetaByAttr('name', 'twitter:title', fullTitle);
    setMetaByAttr('name', 'twitter:description', finalDescription);
    setMetaByAttr('name', 'twitter:image', finalImage);

    setMetaByAttr('name', 'language', 'Portuguese');
    setMetaByAttr('name', 'geo.region', 'BR');
    setMetaByAttr('name', 'geo.placename', 'Brasil');

    setMetaByAttr('name', 'author', 'DB Empresas');
    setMetaByAttr('name', 'publisher', 'DB Empresas');
    setMetaByAttr('name', 'copyright', '© 2024 DB Empresas');

    setMetaByAttr('http-equiv', 'content-language', 'pt-BR');
    setMetaByAttr('name', 'rating', 'general');
    setMetaByAttr('name', 'theme-color', '#3b82f6');
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType,
    noindex
  ]);

  return children || null;
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
