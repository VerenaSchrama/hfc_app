"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await auth.register({ email, password });
      auth.setToken(response.access_token);
      router.push('/intake');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-subtle p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-foreground mb-6">Create Account</h1>
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
              autoComplete="new-password"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="••••••••"
              autoComplete="new-password"
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-secondary">Already have an account? </span>
          <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
            Log in
          </Link>
        </div>
        <Link href="/" className="w-full mt-4">
          <button className="w-full border border-primary text-primary font-semibold py-3 px-6 rounded-lg bg-card hover:bg-primary hover:bg-opacity-5 transition-colors text-lg shadow-sm">Back to Home</button>
        </Link>
      </div>
    </div>
  );
} 