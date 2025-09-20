// src/common/utils/time.util.ts
export function formatAsuncion(d: Date) {
    return new Intl.DateTimeFormat('es-PY', {
        timeZone: 'America/Asuncion',
        dateStyle: 'short',
        timeStyle: 'medium',
    }).format(d);
}
