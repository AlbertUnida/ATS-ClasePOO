export function extractSubdomain(hostname: string) {
    // prod: empresa.tudominio.com  -> "empresa"
    // dev:  empresa.localhost       -> "empresa"
    // si no hay subdominio (api.localhost), devolvé null
    const parts = hostname.split('.');
    if (parts.length < 3) return null;
    return parts[0];
}
