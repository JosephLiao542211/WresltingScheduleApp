'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import 'react-calendar/dist/Calendar.css';

interface Enrollment {
  id: string;
  userId: string;
  classId: string;
}

interface Class {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrollments: Enrollment[];
}

export default function ClassCalendar() {
  const [date, setDate] = useState(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { data: session } = useSession();
  
  useEffect(() => {
    const fetchClasses = async () => {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data);
    };
    
    fetchClasses();
  }, []);
  
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };
  
  const getClassesForDate = (date: Date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.getDay() === date.getDay();
    });
  };
  
  const handleEnroll = async (classId: string) => {
    if (!session) {
      alert('Please login to enroll in classes');
      return;
    }
    
    try {
      const response = await fetch('/api/classes/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });
      
      if (response.ok) {
        alert('Successfully enrolled!');
        // Refresh classes to update enrollment status
        const res = await fetch('/api/classes');
        const data = await res.json();
        setClasses(data);
      } else {
        const error = await response.json();
        alert(`Failed to enroll: ${error.message}`);
      }
    } catch {
      alert('An error occurred while enrolling');
    }
  };
  
  const classesForSelectedDate = getClassesForDate(date);
  
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      <div className="flex-1">
        <Calendar 
          onChange={(value) => handleDateChange(value as Date)}
          value={date}
          className="w-full rounded-lg shadow-md p-4"
        />
      </div>
      
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-4">
          Classes for {date.toLocaleDateString('en-US', { weekday: 'long' })}
        </h2>
        
        {classesForSelectedDate.length === 0 ? (
          <p>No classes scheduled for this day.</p>
        ) : (
          <div className="space-y-4">
            {classesForSelectedDate.map((classItem) => (
              <div 
                key={classItem.id} 
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
                onClick={() => setSelectedClass(classItem)}
              >
                <h3 className="font-bold">{classItem.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(classItem.startTime).toLocaleTimeString()} - 
                  {new Date(classItem.endTime).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {selectedClass && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mt-4">View Class Details</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedClass.title}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>{selectedClass.description}</p>
                <p className="mt-2">
                  <strong>Time:</strong> {new Date(selectedClass.startTime).toLocaleTimeString()} - 
                  {new Date(selectedClass.endTime).toLocaleTimeString()}
                </p>
                <p>
                  <strong>Available Spots:</strong> {selectedClass.capacity - selectedClass.enrollments.length}
                  /{selectedClass.capacity}
                </p>
              </div>
              <Button onClick={() => handleEnroll(selectedClass.id)}>
                Enroll in Class
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 