import type { ShopProduct } from '@/lib/shop/products';

const DEFAULT_BRAND = 'La Obrera y el Zángano';
const DEFAULT_CATEGORY = 'Food, Beverages & Tobacco > Food Items > Condiments & Sauces > Honey';
const DEFAULT_IMAGE_FALLBACK = '/assets/editorial/honey-jar.png';

function sanitizeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function toAbsoluteUrl(url: string | undefined | null, siteUrl: string): string {
  if (!url || !url.trim()) return `${siteUrl}${DEFAULT_IMAGE_FALLBACK}`;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${siteUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export function generateCatalogXml(products: ShopProduct[], siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const itemsXml = products
    .filter((p) => p.visible)
    .map((product) => {
      const inStock = product.stock == null || product.stock > 0;
      const rawDesc = product.shortDescription || product.description || product.name;
      const cleanDesc = stripHtml(rawDesc) || `${product.name} — ${DEFAULT_BRAND}`;
      const productUrl = `${cleanSiteUrl}/producto/${product.slug}`;
      const primaryPhoto = product.photos[0];
      const primaryImageUrl = toAbsoluteUrl(primaryPhoto, cleanSiteUrl);
      const additionalPhotos = product.photos.slice(1, 10);
      const productType = product.categoryLabel || product.category || 'Miel Cruda de Bosque Nativo';
      const priceFormatted = `${Math.round(product.price)} CLP`;

      const additionalImagesXml = additionalPhotos
        .map((photo) => {
          const imgUrl = toAbsoluteUrl(photo, cleanSiteUrl);
          return `      <g:additional_image_link>${sanitizeXmlText(imgUrl)}</g:additional_image_link>`;
        })
        .join('\n');

      return `    <item>
      <g:id>${sanitizeXmlText(product.id)}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${cleanDesc}]]></g:description>
      <g:link>${sanitizeXmlText(productUrl)}</g:link>
      <g:image_link>${sanitizeXmlText(primaryImageUrl)}</g:image_link>
${additionalImagesXml ? `${additionalImagesXml}\n` : ''}      <g:brand><![CDATA[${DEFAULT_BRAND}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${inStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceFormatted}</g:price>
      <g:identifier_exists>no</g:identifier_exists>
      <g:item_group_id>${sanitizeXmlText(product.slug)}</g:item_group_id>
      <g:google_product_category>${sanitizeXmlText(DEFAULT_CATEGORY)}</g:google_product_category>
      <g:product_type><![CDATA[${productType}]]></g:product_type>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title><![CDATA[${DEFAULT_BRAND} · Catálogo]]></title>
    <link>${cleanSiteUrl}</link>
    <description><![CDATA[Miel cruda y cremas botánicas de bosque nativo de Chiloé]]></description>
${itemsXml}
  </channel>
</rss>`;
}

function escapeCsvField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCatalogCsv(products: ShopProduct[], siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'google_product_category',
    'product_type',
  ];

  const rows = products
    .filter((p) => p.visible)
    .map((product) => {
      const inStock = product.stock == null || product.stock > 0;
      const rawDesc = product.shortDescription || product.description || product.name;
      const cleanDesc = stripHtml(rawDesc) || `${product.name} — ${DEFAULT_BRAND}`;
      const productUrl = `${cleanSiteUrl}/producto/${product.slug}`;
      const primaryPhoto = product.photos[0];
      const primaryImageUrl = toAbsoluteUrl(primaryPhoto, cleanSiteUrl);
      const productType = product.categoryLabel || product.category || 'Miel Cruda de Bosque Nativo';
      const priceFormatted = `${Math.round(product.price)} CLP`;

      return [
        product.id,
        product.name,
        cleanDesc,
        inStock ? 'in stock' : 'out of stock',
        'new',
        priceFormatted,
        productUrl,
        primaryImageUrl,
        DEFAULT_BRAND,
        DEFAULT_CATEGORY,
        productType,
      ].map(escapeCsvField).join(',');
    });

  return [headers.join(','), ...rows].join('\n');
}
