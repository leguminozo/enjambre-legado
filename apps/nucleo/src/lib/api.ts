import { supabase } from "./supabase";

export const getAccessToken = async (): Promise<string> => {
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;
if (!token) {
throw new Error("No hay sesión activa");
}
return token;
};

export async function getEmpresaId(): Promise<string> {
const { data } = await supabase.auth.getSession();
const userId = data.session?.user?.id;
if (!userId) return '';

const { data: membership } = await supabase
.from('usuarios_empresas')
.select('empresa_id')
.eq('user_id', userId)
.limit(1)
.single();

return membership?.empresa_id ?? '';
}
