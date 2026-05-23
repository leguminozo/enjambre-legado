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
  return data.session?.user?.id ?? '';
}
