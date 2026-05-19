import { supabase } from "./supabase";

export const getAccessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay sesión activa");
  }
  return token;
};

export function getEmpresaId(): string {
  const session = supabase.auth.getSession();
  return session.then(({ data }) => data.session?.user?.id ?? '');
}
