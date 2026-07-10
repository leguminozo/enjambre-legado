-- Seeding default menu settings
INSERT INTO site_content (section_key, item_order, content)
VALUES ('menu_settings', 0, '{"menu_format": "horizontal", "height_desktop": 80, "height_mobile": 64, "letter_spacing": "0.2em", "button_gap": "2.5rem"}');

-- Seeding default menu links
INSERT INTO site_content (section_key, item_order, content)
VALUES
('menu_links', 1, '{"label": "Inicio", "href": "/"}'),
('menu_links', 2, '{"label": "Creaciones", "href": "/catalogo"}'),
('menu_links', 3, '{"label": "Experiencias", "href": "/experiencias"}'),
('menu_links', 4, '{"label": "Galería", "href": "/galeria"}'),
('menu_links', 5, '{"label": "Ciencia", "href": "/ciencia"}'),
('menu_links', 6, '{"label": "Nosotros", "href": "/nosotros"}'),
('menu_links', 7, '{"label": "Escáner QR", "href": "/qr-scan"}'),
('menu_links', 8, '{"label": "Contacto", "href": "/contacto"}');
