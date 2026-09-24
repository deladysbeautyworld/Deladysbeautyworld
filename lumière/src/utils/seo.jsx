import { Helmet } from 'react-helmet-async';
import { getCanonicalUrl, SITE_URL } from './seoConfig';

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
  indexable = true,
  children,
}) {
  const siteTitle = 'De Lady\'s Beauty World | Nigerian Beauty & Skincare';
  const defaultDesc = 'De Lady\'s Beauty World is a trusted Nigerian beauty store in Abuja offering authentic skincare, makeup, haircare, and beauty routines.';
  const canonicalUrl = canonical || getCanonicalUrl(window.location.pathname);
  const defaultImage = `${SITE_URL}/logo.png`;
  const pageTitle = title ? `${title} | De Lady's Beauty World` : siteTitle;
  const pageDescription = description || defaultDesc;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BeautyStore',
      name: "De Lady's Beauty World",
      alternateName: 'De Lady Beauty World',
      url: SITE_URL,
      logo: getCanonicalUrl('/favicon.svg'),
      image: defaultImage,
      description: defaultDesc,
      email: 'deladysbeautyworld@gmail.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Abuja',
        addressCountry: 'NG',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: "De Lady's Beauty World",
      alternateName: 'De Lady Beauty World',
      url: SITE_URL,
    },
  ];

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta
        name="description"
        content={pageDescription}
      />
      <meta
        name="robots"
        content={indexable
          ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
          : 'noindex,nofollow,noarchive'}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      
      {/* Canonical URL for SEO */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Social Media */}
      <meta property="og:type" content={ogType} />
      <meta
        property="og:title"
        content={pageTitle}
      />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="De Lady's Beauty World" />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={pageTitle}
      />
      <meta
        name="twitter:description"
        content={pageDescription}
      />
      <meta name="twitter:image" content={ogImage || defaultImage} />

      {/* Additional meta tags */}
      <meta name="keywords" content="De Lady's Beauty World, De Lady Beauty World, beauty store Abuja, Nigerian skincare, authentic beauty products Nigeria" />
      <meta name="author" content="De Lady's Beauty World" />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      {children}
    </Helmet>
  );
}

export default SEOMeta;
