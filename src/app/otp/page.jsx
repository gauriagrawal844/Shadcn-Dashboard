'use client';

import OTPForm from "@/components/otp-form";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const email = searchParams.get('email');

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
      return;
    }
    
    // If no email is provided, redirect to signup
    if (!email) {
      router.push('/signup');
      return;
    }
    
    setIsLoading(false);
  }, [router, email]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-xs">
        <OTPForm />
      </div>
    </div>
  );
}
