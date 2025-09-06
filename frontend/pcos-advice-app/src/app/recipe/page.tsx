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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-subtle px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Recipes</h1>
            <p className="text-secondary text-lg">Hormone-friendly recipes for your health journey</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🍽️</div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Recipe Collection</h2>
          <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">Coming soon! Personalized recipes based on your workbook interventions.</p>
          <div className="bg-primary-light bg-opacity-10 border border-primary rounded-lg p-6 max-w-lg mx-auto">
            <p className="text-base text-foreground leading-relaxed">
              <strong className="text-primary">What to expect:</strong> AI-curated recipes that support your specific mechanisms and interventions, with nutritional insights and preparation tips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
