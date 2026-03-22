const express = require('express');
const router = express.Router();

// Datos simulados de clientes (en producción vendrían de la base de datos)
let customers = [
  {
    id: '1',
    name: 'Maria Jose Prieto',
    email: 'maria.prieto@email.com',
    emailSubscription: false,
    location: 'Santiago, Santiago, Chile',
    orders: 1,
    totalSpent: 33047,
    phone: '+56912345678',
    createdAt: '2025-01-10T10:00:00Z',
    lastOrderDate: '2025-01-15T10:30:00Z',
    tags: ['cliente frecuente']
  },
  {
    id: '2',
    name: 'Giannina Rajdl',
    email: 'giannina.rajdl@email.com',
    emailSubscription: true,
    location: 'Los angeles, Biobío, Chile',
    orders: 0,
    totalSpent: 0,
    phone: '+56987654321',
    createdAt: '2025-01-08T14:30:00Z',
    lastOrderDate: null,
    tags: ['nuevo cliente']
  },
  {
    id: '3',
    name: 'Gonzalo Pavez Paredes',
    email: 'gonzalo.pavez@email.com',
    emailSubscription: false,
    location: 'Santiago, Santiago, Chile',
    orders: 1,
    totalSpent: 18057,
    phone: '+56911223344',
    createdAt: '2025-01-05T09:15:00Z',
    lastOrderDate: '2025-01-14T15:45:00Z',
    tags: ['cliente regular']
  },
  {
    id: '4',
    name: 'Dayenu Vecilla',
    email: 'dayenu.vecilla@email.com',
    emailSubscription: false,
    location: 'Las Condes, Santiago, Chile',
    orders: 1,
    totalSpent: 52310,
    phone: '+56955667788',
    createdAt: '2025-01-03T16:45:00Z',
    lastOrderDate: '2025-01-13T09:15:00Z',
    tags: ['cliente premium']
  },
  {
    id: '5',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    emailSubscription: true,
    location: 'Vitacura, Santiago, Chile',
    orders: 0,
    totalSpent: 0,
    phone: '+56999887766',
    createdAt: '2025-01-12T11:20:00Z',
    lastOrderDate: null,
    tags: ['prospecto']
  }
];

// Obtener todos los clientes
router.get('/', (req, res) => {
  try {
    const { search, subscription, location } = req.query;
    let filteredCustomers = [...customers];

    // Buscar por nombre o email
    if (search) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por suscripción de email
    if (subscription && subscription !== 'all') {
      const isSubscribed = subscription === 'subscribed';
      filteredCustomers = filteredCustomers.filter(c => c.emailSubscription === isSubscribed);
    }

    // Filtrar por ubicación
    if (location && location !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => 
        c.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredCustomers,
      total: filteredCustomers.length
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo clientes'
    });
  }
});

// Obtener un cliente por ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customer = customers.find(c => c.id === id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cliente'
    });
  }
});

// Crear nuevo cliente
router.post('/', (req, res) => {
  try {
    const { name, email, phone, location, emailSubscription, tags } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existingCustomer = customers.find(c => c.email === email);
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este email'
      });
    }

    const newCustomer = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone || '',
      location: location || '',
      emailSubscription: emailSubscription || false,
      orders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      lastOrderDate: null,
      tags: tags || []
    };

    customers.push(newCustomer);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: newCustomer
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando cliente'
    });
  }
});

// Actualizar cliente
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar si el email ya existe en otro cliente
    if (updateData.email) {
      const existingCustomer = customers.find(c => c.email === updateData.email && c.id !== id);
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con este email'
        });
      }
    }

    customers[customerIndex] = { ...customers[customerIndex], ...updateData };

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: customers[customerIndex]
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando cliente'
    });
  }
});

// Eliminar cliente
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customerIndex = customers.findIndex(c => c.id === id);

    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const deletedCustomer = customers.splice(customerIndex, 1)[0];

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      data: deletedCustomer
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando cliente'
    });
  }
});

// Obtener estadísticas de clientes
router.get('/stats/overview', (req, res) => {
  try {
    const totalCustomers = customers.length;
    const subscribedCustomers = customers.filter(c => c.emailSubscription).length;
    const customersWithOrders = customers.filter(c => c.orders > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

    // Agrupar por ubicación
    const locationStats = customers.reduce((acc, c) => {
      const location = c.location.split(',')[0]; // Primera parte de la ubicación
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalCustomers,
        subscribedCustomers,
        customersWithOrders,
        totalRevenue,
        avgOrderValue: Math.round(avgOrderValue),
        locationStats
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

// Exportar clientes
router.get('/export/csv', (req, res) => {
  try {
    const csvHeader = 'ID,Nombre,Email,Telefono,Ubicacion,Suscripcion Email,Pedidos,Total Gastado,Fecha Creacion\n';
    const csvData = customers.map(c => 
      `${c.id},"${c.name}","${c.email}","${c.phone}","${c.location}",${c.emailSubscription},${c.orders},${c.totalSpent},"${c.createdAt}"`
    ).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exportando clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando clientes'
    });
  }
});

module.exports = router;
