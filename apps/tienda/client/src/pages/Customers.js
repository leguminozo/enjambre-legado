import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye,
  Users,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  DollarSign,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import axios from 'axios';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, [subscriptionFilter, locationFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subscriptionFilter !== 'all') params.append('subscription', subscriptionFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/customers?${params}`);
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId, checked) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
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
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSubscriptionStatus = (subscribed) => {
    if (subscribed) {
      return (
        <span className="status-badge status-active">
          Suscrito
        </span>
      );
    }
    return (
      <span className="status-badge status-archived">
        No suscrito
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Agregar cliente
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="metric-label">Total de clientes</p>
              <p className="metric-value">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="metric-label">Porcentaje de tu clientela</p>
              <p className="metric-value">100%</p>
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
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field w-64"
              />
            </div>
            
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Todas las suscripciones</option>
              <option value="subscribed">Suscritos</option>
              <option value="unsubscribed">No suscritos</option>
            </select>
            
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Todas las ubicaciones</option>
              <option value="Santiago">Santiago</option>
              <option value="Los angeles">Los Angeles</option>
              <option value="Castro">Castro</option>
              <option value="Punta Arenas">Punta Arenas</option>
              <option value="Graneros">Graneros</option>
              <option value="Vitacura">Vitacura</option>
              <option value="Las Condes">Las Condes</option>
            </select>
          </div>
          
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Agregar filtro
          </button>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">Nombre del cliente</th>
                <th className="table-header">Suscripción por correo electrónico</th>
                <th className="table-header">Ubicación</th>
                <th className="table-header">Pedidos</th>
                <th className="table-header">Importe gastado</th>
                <th className="table-header w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="table-cell w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getSubscriptionStatus(customer.emailSubscription)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{customer.location}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {customer.orders === 0 ? '0 pedidos' : `${customer.orders} pedido${customer.orders > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </div>
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
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{customers.length}</span> de{' '}
                  <span className="font-medium">{customers.length}</span> resultados
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
            clientes
          </a>
        </p>
      </div>
    </div>
  );
};

export default Customers;
