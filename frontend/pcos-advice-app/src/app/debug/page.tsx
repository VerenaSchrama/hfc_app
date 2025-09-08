'use client';

import { useState, useEffect } from 'react';
import { auth } from '../../lib/auth';
import { getWorkbook } from '../../lib/api';
import { WorkbookData } from '../../types';

interface WorkbookResponse {
  success: boolean;
  workbook: WorkbookData;
}

export default function DebugPage() {
  const [token, setToken] = useState<string | null>(null);
  const [workbookData, setWorkbookData] = useState<WorkbookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentToken = auth.getToken();
    setToken(currentToken);
  }, []);

  const testWorkbookAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing workbook API...');
      console.log('Token exists:', !!token);
      console.log('Token value:', token);
      
      const response = await getWorkbook();
      console.log('Workbook response:', response);
      
      setWorkbookData(response);
    } catch (err: unknown) {
      console.error('Error testing workbook API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    auth.logout();
    setToken(null);
    setWorkbookData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
            <p><strong>Token value:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
            <p><strong>Is logged in:</strong> {auth.isLoggedIn() ? 'Yes' : 'No'}</p>
          </div>
          <button
            onClick={clearToken}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear Token
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workbook API Test</h2>
          <button
            onClick={testWorkbookAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Workbook API'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {workbookData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">Success!</h3>
              <p className="text-green-700">
                Mechanisms: {workbookData.workbook?.mechanisms?.length || 0}<br/>
                Interventions: {workbookData.workbook?.interventions?.length || 0}
              </p>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(workbookData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>If no token exists, go to <a href="/login" className="text-blue-600 underline">Login</a> and log in</li>
            <li>If token exists but API fails, the token might be expired - try logging in again</li>
            <li>If API succeeds, check the console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
