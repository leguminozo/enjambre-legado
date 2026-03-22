const express = require('express');
const router = express.Router();

// Datos simulados de productos (en producción vendrían de la base de datos)
let products = [
  {
    id: '1',
    name: 'Sachets Crema de Miel ~ Variedades ~ Cofre Superior',
    status: 'active',
    inventory: 0,
    category: 'Sin categoría',
    channels: 8,
    catalogs: 1,
    price: 15990,
    image: '/images/products/honey-cream-sachets.jpg',
    description: 'Sachets de crema de miel en variedades especiales',
    sku: 'HCS-001',
    weight: 0.1,
    tags: ['miel', 'crema', 'sachets', 'variedades']
  },
  {
    id: '2',
    name: 'Miel con Cacao Nibs ~ Tesoro del Colmenar ~ Frasco Medio',
    status: 'active',
    inventory: 0,
    category: 'Sin categoría',
    channels: 8,
    catalogs: 1,
    price: 8990,
    image: '/images/products/honey-cacao.jpg',
    description: 'Miel natural con trozos de cacao premium',
    sku: 'MCN-002',
    weight: 0.5,
    tags: ['miel', 'cacao', 'natural', 'premium']
  },
  {
    id: '3',
    name: 'Miel con Polen ~ Tesoro del Colmenar ~ Frasco Medio',
    status: 'active',
    inventory: null,
    category: 'Miel',
    channels: 8,
    catalogs: 1,
    price: 12990,
    image: '/images/products/honey-pollen.jpg',
    description: 'Miel enriquecida con polen natural',
    sku: 'MPL-003',
    weight: 0.5,
    tags: ['miel', 'polen', 'natural', 'enriquecida']
  },
  {
    id: '4',
    name: 'Miel Tradicional ~ Reserva del Bosque ~ Frasco Mayor',
    status: 'active',
    inventory: null,
    category: 'Miel',
    channels: 8,
    catalogs: 1,
    price: 18990,
    image: '/images/products/traditional-honey.jpg',
    description: 'Miel tradicional de la reserva del bosque',
    sku: 'MTR-004',
    weight: 1.0,
    tags: ['miel', 'tradicional', 'bosque', 'natural']
  },
  {
    id: '5',
    name: 'Colección ~ Susurros del Bosque',
    status: 'draft',
    inventory: null,
    category: 'Servicios de suscripción',
    channels: 8,
    catalogs: 1,
    price: 29990,
    image: '/images/products/forest-whispers.jpg',
    description: 'Colección especial de productos del bosque',
    sku: 'CSB-005',
    weight: 2.0,
    tags: ['colección', 'bosque', 'suscripción', 'especial']
  },
  {
    id: '6',
    name: 'Fiordo Dulce ~ Hierbabuena con Stevia Infusión',
    status: 'draft',
    inventory: null,
    category: 'Infusiones',
    channels: 8,
    catalogs: 1,
    price: 5990,
    image: '/images/products/peppermint-tea.jpg',
    description: 'Infusión de hierbabuena endulzada con stevia',
    sku: 'FHD-006',
    weight: 0.1,
    tags: ['infusión', 'hierbabuena', 'stevia', 'natural']
  }
];

// Obtener todos los productos
router.get('/', (req, res) => {
  try {
    const { status, category, search } = req.query;
    let filteredProducts = [...products];

    // Filtrar por estado
    if (status && status !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }

    // Filtrar por categoría
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // Buscar por nombre
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos'
    });
  }
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo producto'
    });
  }
});

// Crear nuevo producto
router.post('/', (req, res) => {
  try {
    const { name, price, description, category, status, inventory, sku, weight, tags } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y precio son requeridos'
      });
    }

    const newProduct = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      description: description || '',
      category: category || 'Sin categoría',
      status: status || 'draft',
      inventory: inventory !== undefined ? parseInt(inventory) : null,
      channels: 8,
      catalogs: 1,
      image: '/images/products/default.jpg',
      sku: sku || `SKU-${Date.now()}`,
      weight: weight ? parseFloat(weight) : 0,
      tags: tags || []
    };

    products.push(newProduct);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando producto'
    });
  }
});

// Actualizar producto
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    products[productIndex] = { ...products[productIndex], ...updateData };

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: products[productIndex]
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando producto'
    });
  }
});

// Eliminar producto
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: deletedProduct
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando producto'
    });
  }
});

// Obtener estadísticas de productos
router.get('/stats/overview', (req, res) => {
  try {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const draftProducts = products.filter(p => p.status === 'draft').length;
    const archivedProducts = products.filter(p => p.status === 'archived').length;

    const categories = [...new Set(products.map(p => p.category))];
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / totalProducts;

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        draftProducts,
        archivedProducts,
        categories: categories.length,
        avgPrice: Math.round(avgPrice)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

module.exports = router;
