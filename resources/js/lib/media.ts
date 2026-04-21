export function resolveMediaUrl(path?: string | null) {
    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/') || path.startsWith('data:')) {
        return path;
    }

    return `/storage/${path}`;
}
