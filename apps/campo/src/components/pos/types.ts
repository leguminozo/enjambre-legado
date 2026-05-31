export type CartLine = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

export type VentaOrigen = 'feria' | 'local';

export type VentaChannel = 'feria' | 'delivery' | 'local' | 'corporativo' | 'web' | 'referido';

export type ClienteLookup = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  purchase_count: number;
};
