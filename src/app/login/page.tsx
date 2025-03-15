'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 }
};

const popIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 300, damping: 20 }
};

// Create a separate component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [expiredToken, setExpiredToken] = useState<boolean>(false);

  useEffect(() => {
    const auth = searchParams.get('auth');
    
    if (auth) {
      setStatus('loading');
      
      try {
        // Decode JWT to check if it's expired
        // This is a simple check, the server will validate properly
        const tokenParts = auth.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            
            if (expiryTime < Date.now()) {
              setExpiredToken(true);
              setStatus('error');
              setMessage('登入鏈接已過期。請聯繫管理員獲取新的鏈接。');
              return;
            }
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        }
        
        // Store the JWT token in a cookie that expires in 7 days
        Cookies.set('auth_token', auth, { expires: 7, secure: true, sameSite: 'Strict' });
        
        // Show success message
        setStatus('success');
        setMessage('登入成功！正在重定向...');
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (error) {
        // Show error message
        setStatus('error');
        setMessage('登入失敗，請重試。');
        console.error('Login error:', error);
      }
    } else {
      setStatus('error');
      setMessage('未提供有效的登入信息。請使用您收到的完整鏈接。');
    }
  }, [searchParams, router]);

  return (
    <motion.div 
      {...fadeIn}
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-background"
    >
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl shadow-sm border border-border"
      >
        <div className="flex flex-col items-center space-y-2">
          <motion.div {...popIn} transition={{ delay: 0.2, ...popIn.transition }}>
            <Image
              src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo.svg'} 
              alt="HackScore Logo"
              width={80}
              height={80}
              className="mb-6"
              priority
            />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold text-foreground"
          >
            HackScore
          </motion.h1>
          
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground text-center"
          >
            黑客松評分系統
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground">驗證中...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="flex items-center justify-center w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <p className="text-center text-primary">{message}</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <p className="text-center text-red-500">{message}</p>
                
                {status === 'error' && !searchParams.get('auth') && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium transition-all"
                    onClick={() => router.push('/')}
                  >
                    返回主頁
                  </motion.button>
                )}
                
                {expiredToken && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>如果您需要新的登入鏈接，請聯繫現場工作人員！</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Main component with Suspense boundary
export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-2xl shadow-sm border border-border">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">載入中...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 