import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye,
  Tag,
  Package,
  Settings,
  FileText
} from 'lucide-react';
import axios from 'axios';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCollections, setSelectedCollections] = useState([]);

  useEffect(() => {
    fetchCollections();
  }, [statusFilter]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/collections?${params}`);
      setCollections(response.data.data);
    } catch (error) {
      console.error('Error obteniendo colecciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCollections();
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCollections(collections.map(c => c.id));
    } else {
      setSelectedCollections([]);
    }
  };

  const handleSelectCollection = (collectionId, checked) => {
    if (checked) {
      setSelectedCollections([...selectedCollections, collectionId]);
    } else {
      setSelectedCollections(selectedCollections.filter(id => id !== collectionId));
    }
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
        <div className="flex items-center">
          <Tag className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
            <p className="text-gray-600">Organiza tus productos en colecciones</p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Más acciones
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Crear colección
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
                placeholder="Buscar colecciones..."
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
              <option value="active">Activas</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivadas</option>
            </select>
          </div>
          
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Agregar filtro
          </button>
        </div>
      </div>

      {/* Tabla de colecciones */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selectedCollections.length === collections.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="table-header">Título</th>
                <th className="table-header">Productos</th>
                <th className="table-header">Condiciones de los productos</th>
                <th className="table-header w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="table-cell w-12">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={(e) => handleSelectCollection(collection.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {collection.image ? (
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={collection.image}
                            alt={collection.title}
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {collection.title}
                        </div>
                        {collection.description && (
                          <div className="text-sm text-gray-500">
                            {collection.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {collection.products} productos
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-500">
                      {collection.conditions}
                    </span>
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
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{collections.length}</span> de{' '}
                  <span className="font-medium">{collections.length}</span> resultados
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
            colecciones
          </a>
        </p>
      </div>
    </div>
  );
};

export default Collections;
