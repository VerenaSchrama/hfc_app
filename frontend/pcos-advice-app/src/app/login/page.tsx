"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await auth.login({ email, password });
      auth.setToken(response.access_token);
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-subtle p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-foreground mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="you@email.com"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-muted text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-sm mt-2"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <Link href="/" className="w-full mt-6">
          <button className="w-full border border-primary text-primary font-semibold py-3 px-6 rounded-lg bg-card hover:bg-primary hover:bg-opacity-5 transition-colors text-lg shadow-sm">Back to Home</button>
        </Link>
      </div>
    </div>
  );
} 