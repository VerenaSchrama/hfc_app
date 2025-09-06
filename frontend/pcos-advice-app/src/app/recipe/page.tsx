'use client';

import { useAuth } from '../../lib/auth';

export default function RecipePage() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access recipes</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
            <p className="text-gray-600">Hormone-friendly recipes for your health journey</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe Collection</h2>
          <p className="text-gray-600 mb-6">Coming soon! Personalized recipes based on your workbook interventions.</p>
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-gray-700">
              <strong>What to expect:</strong> AI-curated recipes that support your specific mechanisms and interventions, with nutritional insights and preparation tips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
