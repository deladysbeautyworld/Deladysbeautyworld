import { Helmet } from 'react-helmet-async';

/**
 * SEO Meta Tags Component
 * Centralizes title, description, canonical URL, and Open Graph tags
 */
export function SEOMeta({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  children,
}) {
  const siteTitle = 'De Lady\'s Beauty World | Nigerian Beauty & Skincare';
  const defaultDesc = 'Discover premium skincare and beauty products from Nigeria\'s trusted beauty brand. Shop quality cosmetics, treatments, and routines.';
  const defaultImage = `${window.location.origin}/og-image.png`;

  return (
    <Helmet>
      <title>{title ? `${title} | De Lady's Beauty World` : siteTitle}</title>
      <meta
        name="description"
        content={description || defaultDesc}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      
      {/* Canonical URL for SEO */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Social Media */}
      <meta property="og:type" content={ogType} />
      <meta
        property="og:title"
        content={title ? `${title} | De Lady's Beauty World` : siteTitle}
      />
      <meta
        property="og:description"
        content={description || defaultDesc}
      />
      <meta property="og:image" content={ogImage || defaultImage} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={title ? `${title} | De Lady's Beauty World` : siteTitle}
      />
      <meta
        name="twitter:description"
        content={description || defaultDesc}
      />
      <meta name="twitter:image" content={ogImage || defaultImage} />

      {/* Additional meta tags */}
      <meta name="keywords" content="skincare, beauty, Nigerian beauty brand, cosmetics, skincare routine" />
      <meta name="author" content="De Lady's Beauty World" />

      {children}
    </Helmet>
  );
}

export default SEOMeta;
