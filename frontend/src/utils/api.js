/**
 * Safe fetch helper for handling API requests professionally.
 * Prevents raw syntax errors (e.g., "Unexpected token '<', <!DOCTYPE...") 
 * when backend returns HTML 404/500 error pages and handles 401/403 session expiration cleanly.
 */
export const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    let data = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (parseErr) {
        data = null;
      }
    }

    if (!res.ok) {
      // Auto-clear invalid admin token on 401/403
      if (url.includes('/api/admin') && !url.includes('/api/admin/auth/login') && (res.status === 401 || res.status === 403)) {
        localStorage.removeItem('pm_admin_token');
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }

      const defaultMsg = res.status === 404 
        ? 'Requested server endpoint was not found (404).' 
        : res.status === 403 
        ? 'Access denied. You do not have permission for this resource.' 
        : res.status === 401 
        ? 'Session expired. Please log in again.' 
        : 'An unexpected server error occurred. Please try again.';

      const errorText = data?.error || data?.message || defaultMsg;
      return { ok: false, status: res.status, error: errorText, data: null };
    }

    return { ok: true, status: res.status, data: data !== null ? data : {} };
  } catch (err) {
    console.error(`Network or API call failed for ${url}:`, err);
    return { 
      ok: false, 
      status: 0, 
      error: 'Unable to connect to the server. Please check your network connection.', 
      data: null 
    };
  }
};
