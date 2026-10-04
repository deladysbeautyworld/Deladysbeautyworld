import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Initialize Supabase with Service Role Key to bypass RLS for sitemap generation
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const SITE_URL = 'https://deladysbeautyworld.com';

    // 1. Fetch all published journal posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, slug')
      .eq('published', true);

    if (postsError) throw postsError;

    // 2. Fetch all active products from POS API
    const posResponse = await fetch('https://delady-api-production.up.railway.app/api/products');
    const posData = await posResponse.json();

    // Handle pagination if the POS API returns a paginated list
    let products = [];
    if (posData.products) {
      products = posData.products;
    }

    // 3. Define static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/shop', changefreq: 'daily', priority: 0.8 },
      { url: '/journal', changefreq: 'weekly', priority: 0.7 },
      { url: '/about', changefreq: 'monthly', priority: 0.5 },
      { url: '/routines', changefreq: 'weekly', priority: 0.7 },
    ];

    // 4. Construct XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `
        <url>
          <loc>${SITE_URL}${page.url}</loc>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>`;
    });

    // Add dynamic journal posts
    posts?.forEach(post => {
      xml += `
        <url>
          <loc>${SITE_URL}/journal/${post.slug || post.id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>`;
    });

    // Add dynamic products
    products?.forEach(product => {
      xml += `
        <url>
          <loc>${SITE_URL}/product/${product.id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send('Error generating sitemap');
  }
}
