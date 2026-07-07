import { z } from 'zod';

export const direccionSchema = z.object({
  etiqueta: z.string().min(1, 'La etiqueta es requerida').max(50),
  nombre: z.string().min(2, 'El nombre es muy corto').max(100),
  telefono: z.string().min(8, 'El teléfono no es válido').max(20),
  direccion: z.string().min(5, 'La dirección es muy corta').max(200),
  comuna: z.string().min(2, 'La comuna es requerida').max(100),
  ciudad: z.string().min(2, 'La ciudad es requerida').max(100),
  region: z.string().min(2, 'La región es requerida').max(100),
  codigo_postal: z.string().max(20).optional().nullable(),
  instrucciones: z.string().max(300).optional().nullable(),
});

export type DireccionFormData = z.infer<typeof direccionSchema>;

export type ClienteDireccion = DireccionFormData & {
  id: string;
  user_id: string;
  pais: string;
  es_predeterminada: boolean;
  created_at: string;
};
