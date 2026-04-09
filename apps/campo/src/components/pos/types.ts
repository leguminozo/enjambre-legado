export type CartLine = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

export type VentaOrigen = 'feria' | 'local';
