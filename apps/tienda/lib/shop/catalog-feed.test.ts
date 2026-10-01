import { describe, expect, it } from 'vitest';
import { generateCatalogXml, generateCatalogCsv } from './catalog-feed';
import type { ShopProduct } from './products';

const mockProduct: ShopProduct = {
  id: 'prod-123-uuid',
  slug: 'crema-avellanas',
  name: 'Crema de Miel con Avellanas',
  description: '<p>Miel cruda de bosque nativo con <strong>avellana chilena</strong> tostada.</p>',
  shortDescription: 'Miel cruda con avellana tostada.',
  videoUrl: null,
  ingredientes: 'Miel cruda, avellana',
  trazabilidadQr: true,
  pesoNetoG: 250,
  price: 13990,
  stock: 15,
  format: 'frasco-250',
  formatLabel: 'Frasco 250g',
  category: 'cremas',
  categoryLabel: 'Crema Botánica',
  tags: ['crema', 'avellana'],
  origenApicola: 'Pureo, Chiloé',
  photos: ['/assets/products/avellana-1.jpg', 'https://cdn.example.com/avellana-2.jpg'],
  visible: true,
};

const mockOutOfStockProduct: ShopProduct = {
  ...mockProduct,
  id: 'prod-456-uuid',
  slug: 'crema-virgen',
  name: 'Crema de Miel Virgen',
  stock: 0,
  photos: [],
};

const mockHiddenProduct: ShopProduct = {
  ...mockProduct,
  id: 'prod-hidden',
  slug: 'secreto',
  name: 'Producto Oculto',
  visible: false,
};

describe('catalog-feed', () => {
  const siteUrl = 'https://obrerayzangano.cl';

  describe('generateCatalogXml', () => {
    it('genera un feed XML RSS 2.0 válido con namespace de Google Base', () => {
      const xml = generateCatalogXml([mockProduct, mockOutOfStockProduct, mockHiddenProduct], siteUrl);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">');
      expect(xml).toContain('<title><![CDATA[La Obrera y el Zángano · Catálogo]]></title>');
      expect(xml).toContain('<link>https://obrerayzangano.cl</link>');

      // Visible in-stock item
      expect(xml).toContain('<g:id>prod-123-uuid</g:id>');
      expect(xml).toContain('<g:title><![CDATA[Crema de Miel con Avellanas]]></g:title>');
      expect(xml).toContain('<g:availability>in stock</g:availability>');
      expect(xml).toContain('<g:price>13990 CLP</g:price>');
      expect(xml).toContain('<g:link>https://obrerayzangano.cl/producto/crema-avellanas</g:link>');
      expect(xml).toContain('<g:image_link>https://obrerayzangano.cl/assets/products/avellana-1.jpg</g:image_link>');
      expect(xml).toContain('<g:additional_image_link>https://cdn.example.com/avellana-2.jpg</g:additional_image_link>');
      expect(xml).toContain('<g:brand><![CDATA[La Obrera y el Zángano]]></g:brand>');
      expect(xml).toContain('<g:google_product_category>Food, Beverages &amp; Tobacco &gt; Food Items &gt; Condiments &amp; Sauces &gt; Honey</g:google_product_category>');

      // Out of stock item
      expect(xml).toContain('<g:id>prod-456-uuid</g:id>');
      expect(xml).toContain('<g:availability>out of stock</g:availability>');
      // Fallback image when photos is empty
      expect(xml).toContain('<g:image_link>https://obrerayzangano.cl/assets/editorial/honey-jar.png</g:image_link>');

      // Hidden product is excluded
      expect(xml).not.toContain('prod-hidden');
      expect(xml).not.toContain('Producto Oculto');
    });

    it('remueve tags HTML de la descripción en el feed', () => {
      const productWithHtml: ShopProduct = {
        ...mockProduct,
        shortDescription: null,
        description: '<div>Texto con <b>negrita</b> y & especial.</div>',
      };
      const xml = generateCatalogXml([productWithHtml], siteUrl);
      expect(xml).toContain('Texto con negrita y & especial.');
      expect(xml).not.toContain('<b>');
      expect(xml).not.toContain('<div>');
    });
  });

  describe('generateCatalogCsv', () => {
    it('genera un CSV compatible con headers estándar', () => {
      const csv = generateCatalogCsv([mockProduct, mockOutOfStockProduct, mockHiddenProduct], siteUrl);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'id,title,description,availability,condition,price,link,image_link,brand,google_product_category,product_type',
      );
      expect(lines).toHaveLength(3); // Header + 2 visible products
      expect(lines[1]).toContain('prod-123-uuid');
      expect(lines[1]).toContain('Crema de Miel con Avellanas');
      expect(lines[1]).toContain('in stock');
      expect(lines[1]).toContain('13990 CLP');
      expect(lines[2]).toContain('prod-456-uuid');
      expect(lines[2]).toContain('out of stock');
      expect(csv).not.toContain('prod-hidden');
    });
  });
});
