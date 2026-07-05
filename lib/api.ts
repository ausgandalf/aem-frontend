const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Read a cookie value by name
function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()!.split(';').shift() ?? null;
    }
    return null;
}

// Fetch CSRF cookie before state-changing requests
async function ensureCsrf(): Promise<void> {
    if (!getCookie('XSRF-TOKEN')) {
        await fetch(`${API_URL}/sanctum/csrf-cookie`, {
            credentials: 'include',
        });
    }
}

// Main API helper
export async function api(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = (options.method ?? 'GET').toUpperCase();

    // CSRF needed for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await ensureCsrf();
    }

    const xsrfToken = getCookie('XSRF-TOKEN');

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include', // send cookies
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(xsrfToken && { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) }),
            ...options.headers,
        },
    });

    return response;
}