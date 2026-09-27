// En Android, el redirect de OAuth (meditrackmobile://auth-callback#...) también llega
// a la app como deep link. La sesión la procesa src/lib/oauth.ts, así que aquí solo
// se evita que expo-router lo trate como una ruta inexistente.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('auth-callback')) return '/login';
    return path;
  } catch {
    return '/';
  }
}
