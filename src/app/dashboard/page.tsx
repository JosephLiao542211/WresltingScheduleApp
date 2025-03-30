'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ClassCalendar from '@/components/Calendar';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  
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
      <h1 className="text-2xl font-bold mb-8">Your Class Schedule</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Enrolled Classes</h2>
        {enrolledClasses.length === 0 ? (
          <p>You haven't enrolled in any classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledClasses.map((classItem) => (
              <div key={classItem.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-bold">{classItem.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(classItem.startTime).toLocaleDateString('en-US', { weekday: 'long' })},
                  {' '}{new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(classItem.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Available Classes</h2>
        <ClassCalendar />
      </div>
    </div>
  );
} 