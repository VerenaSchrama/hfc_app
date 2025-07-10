// src/app/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-pink-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center">
        <div className="mb-6">
          <Image src="/Image/HFClogo.png" alt="HerFoodCode Logo" width={80} height={80} className="mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">HerFoodCode</h1>
        <p className="text-md text-olive-700 font-medium mb-6 text-center">Your Hormone-Aware Food Companion</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center text-gray-700">
          Decode your symptoms, understand your rhythms, and discover the foods that truly support your unique body.
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Link href="/register">
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-sm">
              Start Your Journey
            </button>
          </Link>
          <Link href="/login">
            <button className="w-full border border-pink-500 text-pink-600 font-semibold py-3 px-6 rounded-lg bg-white hover:bg-pink-50 transition-colors text-lg shadow-sm">
              Welcome Back
            </button>
          </Link>
        </div>
      </div>
      <div className="flex justify-center gap-8 mt-10">
        <div className="flex flex-col items-center">
          <span className="bg-pink-100 text-pink-600 rounded-full p-3 mb-2 text-xl">💬</span>
          <span className="text-xs text-gray-600 font-medium">Personal Chat</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="bg-green-100 text-green-600 rounded-full p-3 mb-2 text-xl">🎯</span>
          <span className="text-xs text-gray-600 font-medium">Smart Strategies</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="bg-blue-100 text-blue-600 rounded-full p-3 mb-2 text-xl">📊</span>
          <span className="text-xs text-gray-600 font-medium">Track Progress</span>
        </div>
      </div>
    </div>
  );
}
