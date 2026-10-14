import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://deladysbeautyworld.com';

const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/shop', changefreq: 'daily', priority: 0.9 },
  { url: '/journal', changefreq: 'weekly', priority: 0.7 },
  { url: '/routines', changefreq: 'weekly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.5 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/faq', changefreq: 'monthly', priority: 0.5 },
  { url: '/returns', changefreq: 'monthly', priority: 0.5 },
  { url: '/shipping', changefreq: 'monthly', priority: 0.5 },
  { url: '/careers', changefreq: 'monthly', priority: 0.5 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/cookies', changefreq: 'yearly', priority: 0.3 },
];

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]);
}

function createUrlEntry(url, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, slug')
      .eq('published', true);

    if (postsError) throw postsError;

    const posResponse = await fetch('https://delady-api-production.up.railway.app/api/products');
    const posData = await posResponse.json();
    const products = Array.isArray(posData.products) ? posData.products : [];
    const urlEntries = staticPages.map((page) =>
      createUrlEntry(`${SITE_URL}${page.url}`, page.changefreq, page.priority)
    );

    posts?.forEach((post) => {
      const identifier = post.slug || post.id;
      if (identifier) {
        urlEntries.push(createUrlEntry(
          `${SITE_URL}/journal/${encodeURIComponent(identifier)}`,
          'weekly',
          0.6
        ));
      }
    });

    products.forEach((product) => {
      if (product.id) {
        urlEntries.push(createUrlEntry(
          `${SITE_URL}/product/${encodeURIComponent(product.id)}`,
          'weekly',
          0.6
        ));
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send('Error generating sitemap');
  }
}
