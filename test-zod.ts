import { z } from 'zod';
const ApiarioSchema = z.object({
  name: z.string().nullable().default(null),
  details: z.string().nullable().default(null),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
});
const ColmenaSchema = z.object({
  name: z.string().nullable().default(null),
  health: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  floracion: z.string().nullable().default(null),
  peso_kg: z.number().nullable().default(null),
  apiarios: ApiarioSchema.nullable().default(null),
});
const result = ColmenaSchema.safeParse({ name: 'Colmena 1', alzas: 3, id: '123' });
console.log(result.success ? 'Success' : result.error);
