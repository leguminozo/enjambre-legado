import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Archive,
  FileText
} from 'lucide-react';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/products?${params}`);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error obteniendo productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'status-active' },
      draft: { label: 'Borrador', className: 'status-draft' },
      archived: { label: 'Archivado', className: 'status-archived' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getInventoryStatus = (inventory) => {
    if (inventory === null) {
      return <span className="text-gray-500">Inventario no rastreado</span>;
    }
    if (inventory === 0) {
      return <span className="text-red-600 font-medium">0 en existencias</span>;
    }
    return <span className="text-green-600 font-medium">{inventory} en existencias</span>;
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tu catálogo de productos</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button className="btn-secondary">
            <Package className="h-4 w-4 mr-2" />
            Importar
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </button>
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
                placeholder="Buscar productos..."
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
              <option value="active">Activos</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Todas las categorías</option>
              <option value="Miel">Miel</option>
              <option value="Infusiones">Infusiones</option>
              <option value="Servicios de suscripción">Suscripciones</option>
              <option value="Sin categoría">Sin categoría</option>
            </select>
          </div>
          
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Agregar filtro
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">Producto</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Inventario</th>
                <th className="table-header">Categoría</th>
                <th className="table-header">Canales</th>
                <th className="table-header">Catálogos</th>
                <th className="table-header w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="table-cell w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.image || '/images/products/default.jpg'}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="table-cell">
                    {getInventoryStatus(product.inventory)}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{product.category}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{product.channels}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{product.catalogs}</span>
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
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{products.length}</span> de{' '}
                  <span className="font-medium">{products.length}</span> resultados
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
            productos
          </a>
        </p>
      </div>
    </div>
  );
};

export default Products;
