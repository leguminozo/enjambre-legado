import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, TrendingUp, Plus, Edit3, Trash2, Eye, EyeOff, Loader2, Search, Upload, X } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

type Product = {
  id: string;
  slug: string | null;
  nombre: string;
  descripcion_regenerativa: string | null;
  precio: number;
  stock: number | null;
  formato: string | null;
  fotos: string[] | null;
  visible: boolean;
  created_at?: string;
};

type Order = {
  id: string;
  origen: string;
  estado: string;
  total: number;
  metodo_pago: string;
  items: any[];
  created_at: string;
};

type Customer = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

type DashboardData = {
  totalVentas: number;
  totalProductos: number;
  valorInventario: number;
  ventas: any[];
};

type Tab = 'productos' | 'pedidos' | 'clientes' | 'dashboard';

export function TiendaPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    nombre: '',
    descripcion_regenerativa: '',
    precio: 0,
    stock: 0,
    formato: '',
    visible: true,
    fotos: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'productos') {
        const [productsRes, dashboardRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tienda/products`),
          fetch(`${API_BASE_URL}/tienda/dashboard`),
        ]);
        const productsData = await productsRes.json();
        const dashboardData = await dashboardRes.json();
        setProducts(productsData.data || []);
        setDashboard(dashboardData.data || null);
      }
      
      if (activeTab === 'pedidos') {
        const res = await fetch(`${API_BASE_URL}/tienda/orders`);
        const data = await res.json();
        setOrders(data.data || []);
      }
      
      if (activeTab === 'clientes') {
        const res = await fetch(`${API_BASE_URL}/tienda/customers`);
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre || '',
      descripcion_regenerativa: product.descripcion_regenerativa || '',
      precio: product.precio || 0,
      stock: product.stock || 0,
      formato: product.formato || '',
      visible: product.visible || true,
      fotos: product.fotos || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId 
        ? `${API_BASE_URL}/tienda/products/${editingId}`
        : `${API_BASE_URL}/tienda/products`;
      
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/tienda/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      await loadData();
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      nombre: '',
      descripcion_regenerativa: '',
      precio: 0,
      stock: 0,
      formato: '',
      visible: true,
      fotos: [],
    });
  };

  const formatCLP = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.formato?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <ShoppingCart size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-foreground">Gestión de Tienda</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Administración unificada del ecosistema comercial</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn flex items-center gap-2 ${activeTab === 'dashboard' ? 'btn-gold' : 'btn-outline'}`}
        >
          <TrendingUp size={18} /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('productos')}
          className={`btn flex items-center gap-2 ${activeTab === 'productos' ? 'btn-gold' : 'btn-outline'}`}
        >
          <Package size={18} /> Productos
        </button>
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`btn flex items-center gap-2 ${activeTab === 'pedidos' ? 'btn-gold' : 'btn-outline'}`}
        >
          <ShoppingCart size={18} /> Pedidos
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`btn flex items-center gap-2 ${activeTab === 'clientes' ? 'btn-gold' : 'btn-outline'}`}
        >
          <Users size={18} /> Clientes
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Ventas Totales</span>
              </div>
              <div className="text-3xl font-display">{formatCLP(dashboard?.totalVentas || 0)}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Package className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Productos Activos</span>
              </div>
              <div className="text-3xl font-display">{dashboard?.totalProductos || 0}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Valor Inventario</span>
              </div>
              <div className="text-3xl font-display">{formatCLP(dashboard?.valorInventario || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Productos Tab */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display text-xl mb-4">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: Miel de Ulmo"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Formato</label>
                <input
                  type="text"
                  value={form.formato}
                  onChange={(e) => setForm({ ...form, formato: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 500g"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Descripción Regenerativa</label>
              <textarea
                value={form.descripcion_regenerativa}
                onChange={(e) => setForm({ ...form, descripcion_regenerativa: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm min-h-[100px]"
                placeholder="Historia del producto..."
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Precio (CLP)</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Visible en tienda</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.nombre.trim()}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : editingId ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
              {editingId && (
                <button onClick={resetForm} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-display text-lg">Inventario</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-secondary border border-border rounded-full text-sm"
                />
              </div>
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Producto</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Precio</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Sin productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.nombre}</div>
                        <div className="text-xs text-muted-foreground">{p.formato}</div>
                      </td>
                      <td className="px-4 py-3">{formatCLP(p.precio)}</td>
                      <td className="px-4 py-3">{p.stock || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${p.visible ? 'text-accent' : 'text-muted-foreground'}`}>
                          {p.visible ? 'Activo' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 hover:bg-accent/10 rounded-lg mr-2"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pedidos Tab */}
      {activeTab === 'pedidos' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-display text-lg">Pedidos Recientes</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Pedido</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3">{formatCLP(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize">{order.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clientes Tab */}
      {activeTab === 'clientes' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-display text-lg">Base de Clientes</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Rol</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{customer.full_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{customer.email}</td>
                  <td className="px-4 py-3 capitalize text-xs">{customer.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
