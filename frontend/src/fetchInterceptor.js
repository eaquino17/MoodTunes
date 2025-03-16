const originalFetch = window.fetch;
window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Intercept Spotify Analytics endpoints that frequently fail
    if (url.includes('cpapi.spotify.com') || url.includes('event/item_before_load')) {
        try {
            const response = await originalFetch(input, init);
            // If it's a 404/400, return a fake successful response
            if (response.status === 404 || response.status === 400) {
                console.log(`🚀 Intercepted ${response.status} response for ${url.split('?')[0]}`);
                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return response;
        } catch (error) {
            console.log(`🚀 Intercepted fetch error for ${url.split('?')[0]}`);
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    // Forward normal requests
    return originalFetch(input, init);
};