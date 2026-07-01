import { supabase } from "./supabase";

export const getAccessToken = async (): Promise<string> => {
const { data: { user } } = await supabase.auth.getUser(); // Validates JWT with server
if (!user) {
throw new Error("No hay sesión activa");
}
const { data } = await supabase.auth.getSession(); // Get session for access_token (after validation)
const token = data.session?.access_token;
if (!token) {
throw new Error("No hay sesión activa");
}
return token;
};

export async function getEmpresaId(): Promise<string> {
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
if (!userId) return '';

const { data: membership } = await supabase
.from('usuarios_empresas')
.select('empresa_id')
.eq('user_id', userId)
.limit(1)
.single();

return membership?.empresa_id ?? '';
}
