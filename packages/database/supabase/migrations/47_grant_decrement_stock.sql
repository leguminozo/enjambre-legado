-- Migración 47: Permisos de Ejecución para Reducción Atómica de Stock
-- Otorga permiso explícito al rol `authenticated` para llamar a la función `decrement_stock`.
-- Dado que la función usa `SECURITY DEFINER`, esto permite que apicultores y cajeros 
-- procesen ventas y descuenten inventario sin escalar privilegios innecesariamente.

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO authenticated;
