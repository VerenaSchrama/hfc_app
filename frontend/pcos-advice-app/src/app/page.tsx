// src/app/page.tsx
import { redirect } from 'next/navigation';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  redirect('/intake');
  return null;
}
