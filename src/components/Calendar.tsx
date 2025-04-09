'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useSession } from 'next-auth/react';
import { Class, Enrollment, User } from "@prisma/client";
import { CalendarView } from './CalendarView';
import { ClassList } from './ClassList';

interface CalendarProps {
  classes: (Class & {
    enrollments: (Enrollment & {
      user: User;
    })[];
  })[];
  userId: string;
}

export default function ClassCalendar({ classes: initialClasses, userId }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState(initialClasses);
  const [allEnrolledClasses, setAllEnrolledClasses] = useState<typeof initialClasses>([]);
  const { toast } = useToast();
  const { data: session } = useSession();

  // Fetch latest data
  const refreshData = useCallback(async () => {
    try {
      const [classesRes, enrolledRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/classes/enrolled')
      ]);
      
      const [classesData, enrolledData] = await Promise.all([
        classesRes.json(),
        enrolledRes.json()
      ]);

      setClasses(classesData);
      setAllEnrolledClasses(enrolledData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh class data",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Initial data fetch and setup polling for updates
  useEffect(() => {
    refreshData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleEnroll = async (classId: string) => {
    try {
      const response = await fetch("/api/classes/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId }),
      });

      if (!response.ok) {
        throw new Error("Failed to enroll");
      }

      await refreshData();
      
      toast({
        title: "Success",
        description: "Successfully enrolled in class",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to enroll in class",
        variant: "destructive",
      });
    }
  };

  const handleUnenroll = async (classId: string) => {
    try {
      const response = await fetch("/api/classes/unenroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll");
      }

      await refreshData();
      
      toast({
        title: "Success",
        description: "Successfully unenrolled from class",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unenroll from class",
        variant: "destructive",
      });
    }
  };

  const classesForSelectedDate = classes.filter((classItem) => {
    const classDate = new Date(classItem.startTime);
    return (
      classDate.getDate() === selectedDate.getDate() &&
      classDate.getMonth() === selectedDate.getMonth() &&
      classDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const enrolledClasses = classesForSelectedDate.filter(classItem =>
    classItem.enrollments.some(e => e.user.id === userId)
  );

  const availableClasses = classesForSelectedDate.filter(classItem =>
    !classItem.enrollments.some(e => e.user.id === userId)
  );

  return (
    <div className="flex flex-col gap-8 w-full">
      {session?.user && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-blue-100">
            You are currently enrolled in {allEnrolledClasses.length} classes
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
      
        <CalendarView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          classes={classes}
          userId={userId}
        />

        <div className="flex-1">
          <ClassList
            classes={enrolledClasses}
            userId={userId}
            title={`Your Classes on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            variant="enrolled"
            onUnenroll={handleUnenroll}
            emptyMessage="No enrolled classes for this day"
          />

          <div className="mt-6">
            <ClassList
              classes={availableClasses}
              userId={userId}
              title="Available Classes"
              variant="available"
              onEnroll={handleEnroll}
              emptyMessage="No available classes for this day"
            />
          </div>
          <div className="mt-8">
            <ClassList
              classes={allEnrolledClasses}
              userId={userId}
              title="All Your Enrolled Classes"
              variant="enrolled-compact"
              onUnenroll={handleUnenroll}
              emptyMessage="You are not enrolled in any classes"
            />
          </div>
        </div>

        
      </div>
    </div>
  );
} 