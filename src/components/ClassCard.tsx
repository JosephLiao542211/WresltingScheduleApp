'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface ClassCardProps {
  classItem: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    capacity: number;
    enrollments: any[];
  };
}

export default function ClassCard({ classItem }: ClassCardProps) {
  const { data: session } = useSession();
  
  const handleEnroll = async () => {
    if (!session) {
      alert('Please login to enroll in classes');
      return;
    }
    
    try {
      const response = await fetch('/api/classes/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classItem.id })
      });
      
      if (response.ok) {
        alert('Successfully enrolled!');
      } else {
        const error = await response.json();
        alert(`Failed to enroll: ${error.message}`);
      }
    } catch (error) {
      alert('An error occurred while enrolling');
    }
  };
  
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-bold text-lg">{classItem.title}</h3>
      <p className="text-sm text-gray-600 mt-1">
        {new Date(classItem.startTime).toLocaleDateString('en-US', { weekday: 'long' })},
        {' '}{new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
        {new Date(classItem.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        Available Spots: {classItem.capacity - classItem.enrollments.length}/{classItem.capacity}
      </p>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full mt-4">View Details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{classItem.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{classItem.description}</p>
            <p className="mt-2">
              <strong>Time:</strong> {new Date(classItem.startTime).toLocaleTimeString()} - 
              {new Date(classItem.endTime).toLocaleTimeString()}
            </p>
            <p>
              <strong>Available Spots:</strong> {classItem.capacity - classItem.enrollments.length}
              /{classItem.capacity}
            </p>
          </div>
          <Button onClick={handleEnroll}>
            Enroll in Class
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 