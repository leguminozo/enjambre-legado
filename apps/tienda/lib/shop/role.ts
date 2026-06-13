import { headers } from 'next/headers';

export type OyzRole = 'comprador' | 'suscriptor' | 'revendedor' | 'embajador';

export async function getOyzRole(): Promise<OyzRole> {
  const headersList = await headers();
  const role = headersList.get('x-oyz-role');
  
  if (role === 'embajador' || role === 'revendedor' || role === 'suscriptor') {
    return role as OyzRole;
  }
  
  return 'comprador';
}
