'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const empresaSchema = z.object({
  rut: z.string().min(1, 'RUT es requerido'),
  razonSocial: z.string().min(1, 'Razón social es requerida'),
  giro: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  comuna: z.string().optional(),
  ciudad: z.string().optional(),
  region: z.string().optional(),
});

export type Empresa = {
  id: string;
  rut: string;
  razonSocial: string;
  giro?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
};

export async function crearEmpresa(data: z.infer<typeof empresaSchema>) {
  try {
    const validated = empresaSchema.parse(data);

    // Verificar si ya existe por RUT
    const existente = await db.empresa.findUnique({
      where: { rut: validated.rut },
    });

    if (existente) {
      return {
        success: false,
        error: 'Ya existe una empresa con este RUT',
      };
    }

    const empresa = await db.empresa.create({
      data: {
        rut: validated.rut,
        razonSocial: validated.razonSocial,
        giro: validated.giro || 'Servicios',
        email: validated.email || undefined,
        telefono: validated.telefono || undefined,
        direccion: validated.direccion || undefined,
        comuna: validated.comuna || undefined,
        ciudad: validated.ciudad || undefined,
        region: validated.region || undefined,
      },
    });

    revalidatePath('/');
    revalidatePath('/configuracion');

    return {
      success: true,
      data: empresa,
    };
  } catch (error) {
    console.error('Error creando empresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    };
  }
}

export async function getEmpresas(): Promise<Empresa[]> {
  try {
    const empresas = await db.empresa.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return empresas;
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    return [];
  }
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  try {
    const empresa = await db.empresa.findUnique({
      where: { id },
    });
    return empresa;
  } catch (error) {
    console.error('Error obteniendo empresa:', error);
    return null;
  }
}
