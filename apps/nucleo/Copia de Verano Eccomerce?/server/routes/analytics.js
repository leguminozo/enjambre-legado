const express = require('express');
const router = express.Router();

// Datos simulados de analytics (en producción vendrían de la base de datos)
const analyticsData = {
  sales: {
    daily: [
      { date: '2025-01-01', sales: 0, orders: 0 },
      { date: '2025-01-02', sales: 0, orders: 0 },
      { date: '2025-01-03', sales: 0, orders: 0 },
      { date: '2025-01-04', sales: 0, orders: 0 },
      { date: '2025-01-05', sales: 0, orders: 0 },
      { date: '2025-01-06', sales: 0, orders: 0 },
      { date: '2025-01-07', sales: 0, orders: 0 },
      { date: '2025-01-08', sales: 0, orders: 0 },
      { date: '2025-01-09', sales: 0, orders: 0 },
      { date: '2025-01-10', sales: 0, orders: 0 },
      { date: '2025-01-11', sales: 0, orders: 0 },
      { date: '2025-01-12', sales: 0, orders: 0 },
      { date: '2025-01-13', sales: 52310, orders: 1 },
      { date: '2025-01-14', sales: 18057, orders: 1 },
      { date: '2025-01-15', sales: 33047, orders: 1 }
    ],
    monthly: [
      { month: 'Enero 2025', sales: 103414, orders: 3 },
      { month: 'Diciembre 2024', sales: 150000, orders: 5 },
      { month: 'Noviembre 2024', sales: 120000, orders: 4 }
    ]
  },
  traffic: {
    sources: [
      { source: 'Directo', sessions: 45, percentage: 35 },
      { source: 'Búsqueda orgánica', sessions: 38, percentage: 30 },
      { source: 'Redes sociales', sessions: 25, percentage: 20 },
      { source: 'Email', sessions: 15, percentage: 12 },
      { source: 'Referidos', sessions: 5, percentage: 3 }
    ],
    devices: [
      { device: 'Móvil', sessions: 78, percentage: 60 },
      { device: 'Desktop', sessions: 45, percentage: 35 },
      { device: 'Tablet', sessions: 8, percentage: 5 }
    ]
  },
  products: {
    topSellers: [
      { name: 'Miel con Avellanas', sales: 11980, units: 2 },
      { name: 'Crema de Miel', sales: 29980, units: 2 },
      { name: 'Miel con Polen', sales: 18057, units: 1 },
      { name: 'Miel Tradicional', sales: 37980, units: 2 },
      { name: 'Colección Susurros del Bosque', sales: 14330, units: 1 }
    ],
    categories: [
      { category: 'Miel', sales: 68017, percentage: 66 },
      { category: 'Crema de Miel', sales: 29980, percentage: 29 },
      { category: 'Infusiones', sales: 0, percentage: 0 },
      { category: 'Hidrolatos', sales: 0, percentage: 0 }
    ]
  },
  customers: {
    newVsReturning: [
      { type: 'Nuevos', count: 2, percentage: 67 },
      { type: 'Recurrentes', count: 1, percentage: 33 }
    ],
    topCustomers: [
      { name: 'Dayenu Vecilla', totalSpent: 52310, orders: 1 },
      { name: 'Maria Jose Prieto', totalSpent: 33047, orders: 1 },
      { name: 'Gonzalo Pavez Paredes', totalSpent: 18057, orders: 1 }
    ]
  }
};

// Obtener resumen general de analytics
router.get('/overview', (req, res) => {
  try {
    const { period } = req.query;
    
    let data = { ...analyticsData };
    
    if (period === '7d') {
      data.sales.daily = analyticsData.sales.daily.slice(-7);
    } else if (period === '30d') {
      data.sales.daily = analyticsData.sales.daily.slice(-30);
    }

    const totalSales = data.sales.daily.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = data.sales.daily.reduce((sum, day) => sum + day.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      success: true,
      data: {
        ...data,
        summary: {
          totalSales,
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo analytics'
    });
  }
});

// Obtener datos de ventas
router.get('/sales', (req, res) => {
  try {
    const { period, groupBy } = req.query;
    
    let salesData;
    
    if (groupBy === 'monthly') {
      salesData = analyticsData.sales.monthly;
    } else {
      salesData = analyticsData.sales.daily;
      
      if (period === '7d') {
        salesData = salesData.slice(-7);
      } else if (period === '30d') {
        salesData = salesData.slice(-30);
      }
    }

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Error obteniendo datos de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de ventas'
    });
  }
});

// Obtener datos de tráfico
router.get('/traffic', (req, res) => {
  try {
    const { type } = req.query;
    
    let trafficData;
    
    if (type === 'sources') {
      trafficData = analyticsData.traffic.sources;
    } else if (type === 'devices') {
      trafficData = analyticsData.traffic.devices;
    } else {
      trafficData = analyticsData.traffic;
    }

    res.json({
      success: true,
      data: trafficData
    });
  } catch (error) {
    console.error('Error obteniendo datos de tráfico:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de tráfico'
    });
  }
});

// Obtener datos de productos
router.get('/products', (req, res) => {
  try {
    const { type } = req.query;
    
    let productData;
    
    if (type === 'topSellers') {
      productData = analyticsData.products.topSellers;
    } else if (type === 'categories') {
      productData = analyticsData.products.categories;
    } else {
      productData = analyticsData.products;
    }

    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Error obteniendo datos de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de productos'
    });
  }
});

// Obtener datos de clientes
router.get('/customers', (req, res) => {
  try {
    const { type } = req.query;
    
    let customerData;
    
    if (type === 'newVsReturning') {
      customerData = analyticsData.customers.newVsReturning;
    } else if (type === 'topCustomers') {
      customerData = analyticsData.customers.topCustomers;
    } else {
      customerData = analyticsData.customers;
    }

    res.json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Error obteniendo datos de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de clientes'
    });
  }
});

// Obtener reporte completo
router.get('/report', (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    
    // En producción, filtrar datos por fechas
    let reportData = { ...analyticsData };
    
    if (startDate && endDate) {
      // Filtrar datos por rango de fechas
      reportData.sales.daily = reportData.sales.daily.filter(day => 
        day.date >= startDate && day.date <= endDate
      );
    }

    if (format === 'csv') {
      // Generar CSV
      const csvHeader = 'Fecha,Ventas,Pedidos\n';
      const csvData = reportData.sales.daily.map(day => 
        `${day.date},${day.sales},${day.orders}`
      ).join('\n');
      
      const csv = csvHeader + csvData;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: reportData
      });
    }
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando reporte'
    });
  }
});

// Obtener métricas en tiempo real
router.get('/realtime', (req, res) => {
  try {
    // En producción, obtener datos en tiempo real
    const realtimeData = {
      currentVisitors: Math.floor(Math.random() * 10),
      currentOrders: Math.floor(Math.random() * 3),
      currentRevenue: Math.floor(Math.random() * 50000),
      lastActivity: new Date().toISOString()
    };

    res.json({
      success: true,
      data: realtimeData
    });
  } catch (error) {
    console.error('Error obteniendo datos en tiempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos en tiempo real'
    });
  }
});

module.exports = router;
