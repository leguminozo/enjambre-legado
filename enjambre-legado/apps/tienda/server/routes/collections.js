const express = require('express');
const router = express.Router();

// Datos simulados de colecciones (en producción vendrían de la base de datos)
let collections = [
  {
    id: '1',
    title: 'Cajas de Sachets',
    products: 3,
    conditions: 'Manual',
    image: null,
    description: 'Colección de sachets de miel y cremas',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Frascos Mayores',
    products: 2,
    conditions: 'Manual',
    image: null,
    description: 'Frascos de mayor capacidad para mieles premium',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Mieles',
    products: 12,
    conditions: 'Manual',
    image: '/images/collections/honeys.jpg',
    description: 'Variedad de mieles naturales y especiales',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '4',
    title: 'Frascos Medios',
    products: 3,
    conditions: 'Manual',
    image: null,
    description: 'Frascos de tamaño medio para consumo regular',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '5',
    title: 'Sachets ~ Gotas de Néctar',
    products: 3,
    conditions: 'Manual',
    image: '/images/collections/sachets.jpg',
    description: 'Sachets individuales de néctares especiales',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '6',
    title: 'Suscripciones',
    products: 2,
    conditions: 'Manual',
    image: null,
    description: 'Servicios de suscripción para productos premium',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '7',
    title: 'Hidrolatos',
    products: 1,
    conditions: 'Manual',
    image: '/images/collections/hydrolates.jpg',
    description: 'Hidrolatos naturales de plantas medicinales',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '8',
    title: 'Infusiones',
    products: 2,
    conditions: 'Manual',
    image: '/images/collections/infusions.jpg',
    description: 'Infusiones herbales y tés especiales',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '9',
    title: 'Página de inicio',
    products: 0,
    conditions: 'Manual',
    image: null,
    description: 'Productos destacados para la página principal',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

// Obtener todas las colecciones
router.get('/', (req, res) => {
  try {
    const { search, status } = req.query;
    let filteredCollections = [...collections];

    // Buscar por título o descripción
    if (search) {
      filteredCollections = filteredCollections.filter(c => 
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por estado
    if (status && status !== 'all') {
      filteredCollections = filteredCollections.filter(c => c.status === status);
    }

    res.json({
      success: true,
      data: filteredCollections,
      total: filteredCollections.length
    });
  } catch (error) {
    console.error('Error obteniendo colecciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo colecciones'
    });
  }
});

// Obtener una colección por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const collection = collections.find(c => c.id === id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Colección no encontrada'
      });
    }

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error obteniendo colección:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo colección'
    });
  }
});

// Crear nueva colección
router.post('/', (req, res) => {
  try {
    const { title, description, conditions, image, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Título es requerido'
      });
    }

    // Verificar si ya existe una colección con el mismo título
    const existingCollection = collections.find(c => c.title === title);
    if (existingCollection) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una colección con este título'
      });
    }

    const newCollection = {
      id: Date.now().toString(),
      title,
      description: description || '',
      conditions: conditions || 'Manual',
      image: image || null,
      products: 0,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    collections.push(newCollection);

    res.status(201).json({
      success: true,
      message: 'Colección creada exitosamente',
      data: newCollection
    });
  } catch (error) {
    console.error('Error creando colección:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando colección'
    });
  }
});

// Actualizar colección
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const collectionIndex = collections.findIndex(c => c.id === id);
    if (collectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Colección no encontrada'
      });
    }

    // Verificar si ya existe otra colección con el mismo título
    if (updateData.title) {
      const existingCollection = collections.find(c => c.title === updateData.title && c.id !== id);
      if (existingCollection) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra colección con este título'
        });
      }
    }

    collections[collectionIndex] = { 
      ...collections[collectionIndex], 
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Colección actualizada exitosamente',
      data: collections[collectionIndex]
    });
  } catch (error) {
    console.error('Error actualizando colección:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando colección'
    });
  }
});

// Eliminar colección
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const collectionIndex = collections.findIndex(c => c.id === id);

    if (collectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Colección no encontrada'
      });
    }

    const deletedCollection = collections.splice(collectionIndex, 1)[0];

    res.json({
      success: true,
      message: 'Colección eliminada exitosamente',
      data: deletedCollection
    });
  } catch (error) {
    console.error('Error eliminando colección:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando colección'
    });
  }
});

// Obtener productos de una colección
router.get('/:id/products', (req, res) => {
  try {
    const { id } = req.params;
    const collection = collections.find(c => c.id === id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Colección no encontrada'
      });
    }

    // En producción, obtener productos reales de la base de datos
    const collectionProducts = [
      {
        id: '1',
        name: 'Producto de ejemplo',
        price: 9990,
        status: 'active',
        image: '/images/products/default.jpg'
      }
    ];

    res.json({
      success: true,
      data: {
        collection,
        products: collectionProducts,
        total: collectionProducts.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos de la colección:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos de la colección'
    });
  }
});

// Obtener estadísticas de colecciones
router.get('/stats/overview', (req, res) => {
  try {
    const totalCollections = collections.length;
    const activeCollections = collections.filter(c => c.status === 'active').length;
    const totalProducts = collections.reduce((sum, c) => sum + c.products, 0);
    const avgProductsPerCollection = totalCollections > 0 ? totalProducts / totalCollections : 0;

    res.json({
      success: true,
      data: {
        totalCollections,
        activeCollections,
        totalProducts,
        avgProductsPerCollection: Math.round(avgProductsPerCollection)
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
