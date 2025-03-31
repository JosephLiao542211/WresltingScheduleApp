'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ClassCalendar from '@/components/Calendar';

interface ClassItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [enrolledClasses, setEnrolledClasses] = useState<ClassItem[]>([]);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch enrolled classes
      const fetchEnrolledClasses = async () => {
        const res = await fetch('/api/classes/enrolled');
        const data = await res.json();
        setEnrolledClasses(data);
      };
      
      fetchEnrolledClasses();
    }
  }, [status]);
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }
  
  return (
    <div className="container mx-auto py-8">
          <div>
        <ClassCalendar />
      </div>
    </div>
  );
} 