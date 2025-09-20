// src/common/utils/slug.util.ts
export function toSlug(input: string) {
    return input
        .normalize('NFKD')              // quita acentos
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-');
}
