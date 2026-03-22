import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  List
} from 'lucide-react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, channelFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/orders?${params}`);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: 'Pagado', className: 'status-paid' },
      pending: { label: 'Pendiente', className: 'status-pending' },
      unpaid: { label: 'Sin pagar', className: 'status-unpaid' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPreparationStatusBadge = (status) => {
    const statusConfig = {
      prepared: { label: 'Preparado', className: 'status-active' },
      unprepared: { label: 'No preparado', className: 'status-pending' }
    };

    const config = statusConfig[status] || statusConfig.unprepared;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gestiona todos los pedidos de tu tienda</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-secondary">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Más acciones
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Crear pedido
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="metric-card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="metric-label">Hoy</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="metric-label">Pedidos</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="metric-label">Artículos pedidos</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="metric-label">Devoluciones</p>
              <p className="metric-value">$0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="metric-label">Pedidos preparados</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="metric-label">Pedidos entregados</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="metric-label">Tiempo entre pedidos</p>
              <p className="metric-value">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">Todos los estados</option>
              <option value="unprepared">No preparados</option>
              <option value="prepared">Preparados</option>
            </select>
            
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">Todos los canales</option>
              <option value="Online Store">Tienda online</option>
              <option value="Point of Sale">Point of Sale</option>
            </select>
          </div>
          
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Agregar filtro
          </button>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">Pedido</th>
                <th className="table-header">Fecha ↓</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Canal</th>
                <th className="table-header">Total</th>
                <th className="table-header">Estado del pago</th>
                <th className="table-header">Estado de preparación</th>
                <th className="table-header">Artículos</th>
                <th className="table-header">Estado de la entrega</th>
                <th className="table-header">Forma de entrega</th>
                <th className="table-header w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.id}
                      </span>
                      {order.id === '1007' && (
                        <span className="ml-2 text-yellow-500">
                          ⚠️
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {formatDate(order.date)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      {order.customer}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{order.channel}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="table-cell">
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </td>
                  <td className="table-cell">
                    {getPreparationStatusBadge(order.preparationStatus)}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {order.items} artículos
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {order.deliveryStatus === 'tracking_added' ? 'Seguimiento agregado' : order.deliveryStatus}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{order.deliveryMethod}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button className="btn-icon">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="btn-icon">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="btn-icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="btn-secondary">
                Anterior
              </button>
              <button className="btn-secondary">
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{orders.length}</span> de{' '}
                  <span className="font-medium">{orders.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button className="btn-secondary rounded-l-md">Anterior</button>
                  <button className="btn-secondary rounded-r-md">Siguiente</button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Más información sobre{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">
            pedidos
          </a>
        </p>
      </div>
    </div>
  );
};

export default Orders;
