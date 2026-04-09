import { supabase } from "./supabase";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const getAccessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay sesión activa");
  }
  return token;
};

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = await getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `No se pudo conectar al BFF en ${API_BASE_URL}. Levanta apps/api (pnpm --filter @enjambre/api dev) o define VITE_API_BASE_URL.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Respuesta no JSON del BFF (${response.status}).`);
  }
  if (!response.ok) {
    const msg =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message?: string }).message)
        : "Error API";
    throw new Error(msg);
  }
  return payload as T;
};
