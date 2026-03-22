const express = require('express');
const router = express.Router();

// Datos simulados de pedidos (en producción vendrían de la base de datos)
let orders = [
  {
    id: '1009',
    date: '2025-01-15T10:30:00Z',
    customer: 'Maria Jose Prieto',
    channel: 'Online Store',
    total: 33047,
    paymentStatus: 'paid',
    preparationStatus: 'prepared',
    items: 2,
    deliveryStatus: 'tracking_added',
    deliveryMethod: 'Blue Express Express (Te...)',
    items: [
      {
        id: '1',
        name: 'Miel con Avellanas ~ Tesoro del colmenar ~ Frasco Medio',
        price: 5990,
        quantity: 2,
        total: 11980,
        image: '/images/products/honey-hazelnuts.jpg'
      },
      {
        id: '2',
        name: 'Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor',
        price: 14990,
        quantity: 2,
        total: 29980,
        image: '/images/products/honey-cream.jpg'
      }
    ],
    customerEmail: 'maria.prieto@email.com',
    shippingAddress: 'Santiago, Santiago, Chile',
    billingAddress: 'Santiago, Santiago, Chile',
    notes: ''
  },
  {
    id: '1008',
    date: '2025-01-14T15:45:00Z',
    customer: 'Gonzalo Pavez Paredes',
    channel: 'Online Store',
    total: 18057,
    paymentStatus: 'paid',
    preparationStatus: 'prepared',
    items: 1,
    deliveryStatus: 'tracking_added',
    deliveryMethod: 'Blue Express Express (Te...)',
    items: [
      {
        id: '3',
        name: 'Miel con Polen ~ Tesoro del Colmenar ~ Frasco Medio',
        price: 18057,
        quantity: 1,
        total: 18057,
        image: '/images/products/honey-pollen.jpg'
      }
    ],
    customerEmail: 'gonzalo.pavez@email.com',
    shippingAddress: 'Santiago, Santiago, Chile',
    billingAddress: 'Santiago, Santiago, Chile',
    notes: ''
  },
  {
    id: '1007',
    date: '2025-01-13T09:15:00Z',
    customer: 'Dayenu Vecilla',
    channel: 'Online Store',
    total: 52310,
    paymentStatus: 'paid',
    preparationStatus: 'prepared',
    items: 3,
    deliveryStatus: 'tracking_added',
    deliveryMethod: 'Blue Express Express (Te...)',
    items: [
      {
        id: '4',
        name: 'Miel Tradicional ~ Reserva del Bosque ~ Frasco Mayor',
        price: 18990,
        quantity: 2,
        total: 37980,
        image: '/images/products/traditional-honey.jpg'
      },
      {
        id: '5',
        name: 'Colección ~ Susurros del Bosque',
        price: 14330,
        quantity: 1,
        total: 14330,
        image: '/images/products/forest-whispers.jpg'
      }
    ],
    customerEmail: 'dayenu.vecilla@email.com',
    shippingAddress: 'Las Condes, Santiago, Chile',
    billingAddress: 'Las Condes, Santiago, Chile',
    notes: 'Entrega preferiblemente en la mañana'
  }
];

// Obtener todos los pedidos
router.get('/', (req, res) => {
  try {
    const { status, channel, search } = req.query;
    let filteredOrders = [...orders];

    // Filtrar por estado de preparación
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.preparationStatus === status);
    }

    // Filtrar por canal
    if (channel && channel !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.channel === channel);
    }

    // Buscar por cliente o ID de pedido
    if (search) {
      filteredOrders = filteredOrders.filter(o => 
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search)
      );
    }

    res.json({
      success: true,
      data: filteredOrders,
      total: filteredOrders.length
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos'
    });
  }
});

// Obtener un pedido por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedido'
    });
  }
});

// Crear nuevo pedido
router.post('/', (req, res) => {
  try {
    const { customer, items, total, customerEmail, shippingAddress, billingAddress, notes } = req.body;

    if (!customer || !items || !total) {
      return res.status(400).json({
        success: false,
        message: 'Cliente, items y total son requeridos'
      });
    }

    const newOrder = {
      id: (Math.max(...orders.map(o => parseInt(o.id))) + 1).toString(),
      date: new Date().toISOString(),
      customer,
      channel: 'Online Store',
      total: parseFloat(total),
      paymentStatus: 'pending',
      preparationStatus: 'unprepared',
      items: items.length,
      deliveryStatus: 'pending',
      deliveryMethod: 'Por definir',
      items,
      customerEmail: customerEmail || '',
      shippingAddress: shippingAddress || '',
      billingAddress: billingAddress || '',
      notes: notes || ''
    };

    orders.push(newOrder);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando pedido'
    });
  }
});

// Actualizar pedido
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    orders[orderIndex] = { ...orders[orderIndex], ...updateData };

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      data: orders[orderIndex]
    });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando pedido'
    });
  }
});

// Eliminar pedido
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const deletedOrder = orders.splice(orderIndex, 1)[0];

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente',
      data: deletedOrder
    });
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando pedido'
    });
  }
});

// Obtener estadísticas de pedidos
router.get('/stats/overview', (req, res) => {
  try {
    const totalOrders = orders.length;
    const todayOrders = orders.filter(o => {
      const today = new Date().toDateString();
      const orderDate = new Date(o.date).toDateString();
      return today === orderDate;
    }).length;

    const totalItems = orders.reduce((sum, o) => sum + o.items, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalRevenue / totalOrders;

    const preparedOrders = orders.filter(o => o.preparationStatus === 'prepared').length;
    const deliveredOrders = orders.filter(o => o.deliveryStatus === 'delivered').length;

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        totalItems,
        totalRevenue,
        avgOrderValue: Math.round(avgOrderValue),
        preparedOrders,
        deliveredOrders
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

// Obtener pedidos abandonados
router.get('/abandoned/all', (req, res) => {
  try {
    // En producción, estos vendrían de una base de datos de carritos abandonados
    const abandonedOrders = [
      {
        id: 'AB001',
        customer: 'Maria Angélica Moya Santander',
        email: 'amoya@goreloslagos.cl',
        items: [
          {
            name: 'Miel con Avellanas ~ Tesoro del colmenar ~ Frasco Medio',
            price: 5990,
            quantity: 2,
            total: 11980
          },
          {
            name: 'Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor',
            price: 14990,
            quantity: 2,
            total: 29980
          }
        ],
        total: 41960,
        abandonedAt: new Date().toISOString(),
        shippingAddress: null,
        billingAddress: 'Los Maticos 1885 Puerto Montt, Puerto Montt, Los Lagos, Chile'
      }
    ];

    res.json({
      success: true,
      data: abandonedOrders,
      total: abandonedOrders.length
    });
  } catch (error) {
    console.error('Error obteniendo pedidos abandonados:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos abandonados'
    });
  }
});

module.exports = router;
