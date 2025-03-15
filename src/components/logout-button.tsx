'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Remove the auth cookie
    Cookies.remove('auth_token');
    
    // Redirect to login page
    router.push('/login');
  };
  
  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-full border border-border hover:bg-muted px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isLoggingOut ? '登出中...' : '登出'}
    </button>
  );
} 