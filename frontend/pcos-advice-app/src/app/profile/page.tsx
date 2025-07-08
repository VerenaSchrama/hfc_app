"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { setCurrentStrategy } from '@/lib/strategy';

// Placeholder data (replace with real user data from context or API later)
const userProfile = {
  currentStrategy: {
    name: 'Bloedsuiker in balans',
    description: 'Focus on steady energy through balanced meals and strategic timing',
    day: 3,
    totalDays: 28,
    active: true,
  },
  goals: ['Balance hormones'],
  symptoms: ['Digestive issues'],
  cyclePhase: "I don't know",
  progress: {
    followedToday: true,
    energyLevel: 7,
    mood: 'Good',
  },
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  const handleViewDetails = () => {
    setCurrentStrategy(userProfile.currentStrategy.name);
    router.push('/today');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    const token = auth.getToken();
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/delete_account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        auth.logout();
        localStorage.clear();
        router.push('/');
      } else {
        alert('Failed to delete account.');
      }
    } catch (e) {
      alert('Failed to delete account.');
    }
  };

  const handleNewStrategy = () => {
    if (window.confirm('You can only follow 1 strategy at a time. Are you sure you want to reset your strategy, including your progress?')) {
      router.push('/strategy_selection');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-pink-50 to-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-pink-600 border border-pink-500 rounded-lg hover:bg-pink-50 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Current Strategy */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Strategy</h2>
              <p className="text-gray-600 mt-1">{userProfile.currentStrategy.description}</p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Day {userProfile.currentStrategy.day} of {userProfile.currentStrategy.totalDays}
            </div>
            <button onClick={handleViewDetails} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors">
              View Details
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Goals</h3>
              <div className="space-y-1">
                {userProfile.goals.map((goal, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                    {goal}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Symptoms</h3>
              <div className="space-y-1">
                {userProfile.symptoms.map((symptom, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                    {symptom}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Cycle Phase</h3>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                {userProfile.cyclePhase}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {userProfile.progress.followedToday ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Strategy Followed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{userProfile.progress.energyLevel}/10</div>
              <div className="text-sm text-gray-600">Energy Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{userProfile.progress.mood}</div>
              <div className="text-sm text-gray-600">Mood</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link href="/intake" className="flex-1">
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm">
              Update Profile
            </button>
          </Link>
          <Link href="/strategy_selection" className="flex-1">
            <button type="button" onClick={handleNewStrategy} className="w-full border border-pink-500 text-pink-600 font-semibold py-3 px-6 rounded-lg bg-white hover:bg-pink-50 transition-colors shadow-sm">
              New Strategy
            </button>
          </Link>
        </div>
        <button onClick={handleDeleteAccount} className="w-full mt-4 border border-red-400 text-red-600 font-semibold py-3 px-6 rounded-lg bg-white hover:bg-red-50 transition-colors text-lg shadow-sm">
          Delete Account
        </button>
      </div>
    </div>
  );
} 