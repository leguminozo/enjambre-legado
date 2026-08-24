import { z } from 'zod';
const schema = z.object({ a: z.string().default('hi') });
console.log(schema.safeParse(undefined));
