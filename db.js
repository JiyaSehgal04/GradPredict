// AdmitPredict – Supabase client (loaded after the CDN script)
// window.db is available globally once this file executes
;(function () {
    try {
        const { createClient } = window.supabase;
        window.db = createClient(
            'https://fqryzqqhbfrmdjxzlkaj.supabase.co',
            'sb_publishable_4-u_k9imAb4o7Va_shdcBA_Mpk80Fws'
        );
    } catch (e) {
        console.warn('[AdmitPredict] Supabase client unavailable – localStorage fallback active.', e.message);
    }
})();
