export function setCurrentStrategy(strategyName: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_strategy', strategyName);
  }
}

export function getCurrentStrategy(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('current_strategy');
  }
  return null;
} 