'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

// Define admin emails
const ADMIN_EMAILS = ['joseph.liao1018@gmail.com']; // Add your admin emails here

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);
  
  // Debug log
  useEffect(() => {
    console.log('Navbar session state:', {
      status,
      userEmail: session?.user?.email,
      isAdmin,
    });
  }, [status, session, isAdmin]);
  
  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Class Scheduler
        </Link>
        
        <div className="flex items-center space-x-6">
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" className="hover:text-indigo-200">
                Dashboard
              </Link>
              
              {isAdmin && (
                <Link 
                  href="/admin/classes" 
                  className="bg-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-500 transition-colors"
                >
                  Manage Classes
                </Link>
              )}
              
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-white text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-100"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-indigo-200">
                Sign In
              </Link>
              <Link 
                href="/auth/register"
                className="bg-white text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-100"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 