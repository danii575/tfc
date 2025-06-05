import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ErrorScreen } from '../components/ErrorBoundary';

export default function ErrorPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Determinar el tipo de error basado en los parámetros
  const errorType = params.type || '500';
  
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      router.replace('/');
    }
  };

  return (
    <ErrorScreen 
      type={errorType}
      onRetry={handleRetry}
    />
  );
} 