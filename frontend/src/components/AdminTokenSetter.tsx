import { useEffect, useState } from 'react';

const AdminTokenSetter = () => {
  // Guard against production usage - this component should never render in production
  if (!import.meta.env.DEV) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="mb-4">This development-only feature is not available in production.</p>
        </div>
      </div>
    );
  }

  const [status, setStatus] = useState('Fetching admin token...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminToken = async () => {
      try {
        setStatus('Requesting admin token from server...');

        const response = await fetch('/v1/auth/dev-admin-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            devPassword: import.meta.env.VITE_DEV_ADMIN_PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get admin token: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data?.token) {
          localStorage.setItem('token', data.data.token);
          setStatus('✅ Admin JWT token stored in localStorage');
          console.log('✅ Admin JWT token obtained and stored');

          // Redirect to admin users page after a brief delay
          setTimeout(() => {
            window.location.href = '/admin/users';
          }, 1000);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Failed to get admin token:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setStatus('❌ Failed to get admin token');
      }
    };

    fetchAdminToken();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Setting up Admin Authentication...</h1>
        <p className="mb-4">{status}</p>
        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200">
            <h3 className="font-semibold mb-2">Error:</h3>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Please check that the backend is running and the dev token endpoint is available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTokenSetter;
