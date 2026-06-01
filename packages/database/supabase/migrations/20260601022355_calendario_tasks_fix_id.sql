-- Fix calendario_tasks.id: text NOT NULL with no default caused INSERT failures.
-- Change to UUID with gen_random_uuid() default.

ALTER TABLE public.calendario_tasks
  ALTER COLUMN id SET DATA TYPE UUID USING id::UUID,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
