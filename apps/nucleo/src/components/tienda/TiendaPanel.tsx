import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { calcularIVA, calcularTotal } from '@enjambre/contable';
import { Package, ShoppingCart, Users, TrendingUp, Plus, Edit3, Trash2, Eye, EyeOff, Loader2, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';

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
  productos: unknown[] | null;
  channel: string | null;
  created_at: string;
};

type Customer = {
  id: string;
  email: string | null;
  full_name: string | null;
  totalCompras: number;
  ultimaCompra: string | null;
  pedidos: number;
};

type Tab = 'productos' | 'pedidos' | 'clientes' | 'dashboard';

const formatCLP = formatCurrency;

export function TiendaPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  const [valorInventario, setValorInventario] = useState(0);
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

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, visible, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error.message);
      return;
    }
    setProducts((data ?? []) as Product[]);
    setTotalProductos((data ?? []).filter((p: Product) => p.visible !== false).length);
    setValorInventario(
      (data ?? []).reduce((acc: number, p: Product) => acc + (p.precio || 0) * (p.stock || 0), 0)
    );
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('id, origen, estado, total, metodo_pago, productos, channel, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error cargando pedidos:', error.message);
      return;
    }
    setOrders((data ?? []) as Order[]);
    setTotalVentas((data ?? []).reduce((acc: number, o: Order) => acc + (o.total || 0), 0));
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('cliente_id, total, created_at, profiles:cliente_id(id, email, full_name)')
      .eq('origen', 'web')
      .not('cliente_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error cargando clientes:', error.message);
      return;
    }

    const byCliente = new Map<string, Customer>();
    for (const row of data ?? []) {
      const clienteId = row.cliente_id as string;
      const profile = row.profiles as { id: string; email: string | null; full_name: string | null } | null;
      const total = Number(row.total) || 0;
      const existing = byCliente.get(clienteId);
      if (existing) {
        existing.totalCompras += total;
        existing.pedidos += 1;
        if (row.created_at && (!existing.ultimaCompra || row.created_at > existing.ultimaCompra)) {
          existing.ultimaCompra = row.created_at;
        }
      } else {
        byCliente.set(clienteId, {
          id: clienteId,
          email: profile?.email ?? null,
          full_name: profile?.full_name ?? null,
          totalCompras: total,
          ultimaCompra: row.created_at ?? null,
          pedidos: 1,
        });
      }
    }
    setCustomers(Array.from(byCliente.values()));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchOrders(), fetchCustomers()]);
      setLoading(false);
    };
    load();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre || '',
      descripcion_regenerativa: product.descripcion_regenerativa || '',
      precio: product.precio || 0,
      stock: product.stock || 0,
      formato: product.formato || '',
      visible: product.visible ?? true,
      fotos: product.fotos || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = form.nombre.toLowerCase().replace(/\s+/g, '-').slice(0, 120);

      if (editingId) {
        const patch: Record<string, unknown> = {};
        if (form.nombre) patch.nombre = form.nombre;
        if (form.descripcion_regenerativa !== undefined) patch.descripcion_regenerativa = form.descripcion_regenerativa || null;
        if (form.precio !== undefined) patch.precio = Math.round(form.precio);
        if (form.stock !== undefined) patch.stock = form.stock || null;
        if (form.formato !== undefined) patch.formato = form.formato || null;
        if (form.fotos !== undefined) patch.fotos = form.fotos;
        if (form.visible !== undefined) patch.visible = form.visible;

        const { error } = await supabase
          .from('productos')
          .update(patch)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('productos')
          .insert({
            nombre: form.nombre,
            descripcion_regenerativa: form.descripcion_regenerativa || null,
            precio: Math.round(form.precio),
            stock: form.stock || null,
            formato: form.formato || null,
            fotos: form.fotos || [],
            visible: form.visible ?? true,
            slug,
          });

        if (error) throw error;
      }

      await fetchProducts();
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error guardando:', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando:', error.message);
      return;
    }
    await fetchProducts();
  };

  const handleToggleVisible = async (product: Product) => {
    const { error } = await supabase
      .from('productos')
      .update({ visible: !product.visible })
      .eq('id', product.id);

    if (error) {
      console.error('Error cambiando visibilidad:', error.message);
      return;
    }
    await fetchProducts();
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

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.formato?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ViewShell
        variant="compact"
        eyebrow="Comercial"
        title="Gestión de Tienda"
        subtitle="Administración unificada del ecosistema comercial"
        icon={<ShoppingCart size={20} />}
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="tienda-tabs"
        tabs={[
          { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={16} /> },
          { id: 'productos', label: 'Productos', icon: <Package size={16} /> },
          { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={16} /> },
          { id: 'clientes', label: 'Clientes', icon: <Users size={16} /> },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Ventas Totales</span>
              </div>
              <div className="text-3xl font-display">{formatCLP(totalVentas)}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Package className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Productos Activos</span>
              </div>
              <div className="text-3xl font-display">{totalProductos}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-accent" size={24} />
                <span className="text-sm text-muted-foreground">Valor Inventario</span>
              </div>
              <div className="text-3xl font-display">{formatCLP(valorInventario)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="space-y-6">
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
                        <button
                          onClick={() => handleToggleVisible(p)}
                          className={`text-xs flex items-center gap-1 ${p.visible ? 'text-accent' : 'text-muted-foreground'}`}
                        >
                          {p.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          {p.visible ? 'Activo' : 'Oculto'}
                        </button>
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Sin pedidos
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Pedidos</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Sin compradores web aún
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/50">
                    <td className="px-4 py-3">{customer.full_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{customer.email || '—'}</td>
                    <td className="px-4 py-3 text-sm">{customer.pedidos}</td>
                    <td className="px-4 py-3 text-sm">{formatCLP(customer.totalCompras)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
