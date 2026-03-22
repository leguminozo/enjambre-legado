const express = require('express');
const router = express.Router();

// Datos simulados del dashboard (en producción vendrían de la base de datos)
const dashboardData = {
  overview: {
    sessions: {
      current: 327,
      previous: 537,
      change: -39,
      trend: 'decrease'
    },
    totalSales: {
      current: 33047,
      previous: 70400,
      change: -53,
      trend: 'decrease'
    },
    orders: {
      current: 1,
      previous: 2,
      change: -50,
      trend: 'decrease'
    },
    conversionRate: {
      current: 0.31,
      previous: 0.38,
      change: -18,
      trend: 'decrease'
    }
  },
  chartData: {
    sessions: [
      { date: '2025-07-20', current: 45, previous: 67 },
      { date: '2025-07-21', current: 52, previous: 71 },
      { date: '2025-07-22', current: 48, previous: 69 },
      { date: '2025-07-23', current: 89, previous: 73 },
      { date: '2025-07-24', current: 67, previous: 68 },
      { date: '2025-07-25', current: 54, previous: 65 },
      { date: '2025-07-26', current: 61, previous: 62 },
      { date: '2025-07-27', current: 58, previous: 59 },
      { date: '2025-07-28', current: 63, previous: 61 },
      { date: '2025-07-29', current: 71, previous: 64 },
      { date: '2025-07-30', current: 68, previous: 66 },
      { date: '2025-07-31', current: 72, previous: 67 },
      { date: '2025-08-01', current: 69, previous: 65 },
      { date: '2025-08-02', current: 74, previous: 68 },
      { date: '2025-08-03', current: 76, previous: 70 },
      { date: '2025-08-04', current: 73, previous: 69 },
      { date: '2025-08-05', current: 78, previous: 71 },
      { date: '2025-08-06', current: 75, previous: 70 },
      { date: '2025-08-07', current: 92, previous: 72 },
      { date: '2025-08-08', current: 81, previous: 71 },
      { date: '2025-08-09', current: 79, previous: 70 },
      { date: '2025-08-10', current: 76, previous: 69 },
      { date: '2025-08-11', current: 73, previous: 68 },
      { date: '2025-08-12', current: 70, previous: 67 },
      { date: '2025-08-13', current: 68, previous: 66 },
      { date: '2025-08-14', current: 65, previous: 65 },
      { date: '2025-08-15', current: 62, previous: 64 },
      { date: '2025-08-16', current: 59, previous: 63 }
    ]
  },
  liveVisitors: 0,
  channels: 'Todos los canales',
  period: 'Últimos 30 días'
};

// Obtener datos del dashboard
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error obteniendo datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos del dashboard'
    });
  }
});

// Obtener métricas por período
router.get('/metrics/:period', (req, res) => {
  try {
    const { period } = req.params;
    
    // En producción, filtrar datos por período
    let filteredData = { ...dashboardData };
    
    if (period === '7d') {
      filteredData.chartData.sessions = dashboardData.chartData.sessions.slice(-7);
      filteredData.period = 'Últimos 7 días';
    } else if (period === '90d') {
      filteredData.period = 'Últimos 90 días';
    }

    res.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas'
    });
  }
});

// Obtener visitantes en vivo
router.get('/live-visitors', (req, res) => {
  try {
    // En producción, obtener datos en tiempo real
    const liveVisitors = Math.floor(Math.random() * 10);
    
    res.json({
      success: true,
      data: { liveVisitors }
    });
  } catch (error) {
    console.error('Error obteniendo visitantes en vivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo visitantes en vivo'
    });
  }
});

module.exports = router;
