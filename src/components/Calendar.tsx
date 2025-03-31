'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { useSession } from 'next-auth/react';
import 'react-calendar/dist/Calendar.css';
import { Class, Enrollment, User } from "@prisma/client";
import { Value } from "react-calendar/dist/esm/shared/types.js";

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
  const refreshData = async () => {
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
  };

  // Initial data fetch and setup polling for updates
  useEffect(() => {
    refreshData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    }
  };

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

  const tileClassName = ({ date }: { date: Date }) => {
    const classesForDate = classes.filter((classItem) => {
      const classDate = new Date(classItem.startTime);
      return (
        classDate.getDate() === date.getDate() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getFullYear() === date.getFullYear()
      );
    });

    const isEnrolledDate = classesForDate.some(classItem =>
      classItem.enrollments.some(e => e.user.id === userId)
    );

    if (isEnrolledDate) return 'enrolled-date';
    if (classesForDate.length > 0) return 'available-date';
    return '';
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

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Your Enrolled Classes</h2>
        <div className="space-y-3">
          {allEnrolledClasses.length === 0 ? (
            <p className="text-gray-500">You are not enrolled in any classes</p>
          ) : (
            allEnrolledClasses
              .sort((a, b) => {
                const dateA = new Date(a.startTime);
                const dateB = new Date(b.startTime);
                return dateA.getTime() - dateB.getTime();
              })
              .map((classItem) => (
                <div key={classItem.id} className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-green-800">
                        {classItem.title || 'Untitled Class'}
                      </h4>
                      <p className="text-sm text-green-600">
                        {classItem.startTime ? (
                          new Date(classItem.startTime).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          'Schedule not available'
                        )}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnenroll(classItem.id)}
                    >
                      Unenroll
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="calendar-custom"
            tileClassName={tileClassName}
          />
          <style jsx global>{`
            .calendar-custom {
              width: 100% !important;
              max-width: none !important;
              background: white;
              padding: 24px !important;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: none !important;
            }
            .react-calendar__navigation {
              margin-bottom: 20px;
            }
            .react-calendar__navigation button {
              font-size: 1.2rem;
              font-weight: 600;
              color: #1f2937;
              padding: 8px;
              background: none;
              border-radius: 0;
              transition: all 0.2s;
            }
            .react-calendar__navigation button:hover {
              background-color: #f3f4f6;
            }
            .react-calendar__month-view__weekdays {
              font-weight: 600;
              color: #4b5563;
              font-size: 0.9rem;
              margin-bottom: 8px;
            }
            .react-calendar__tile {
              height: 100px !important;
              padding: 1em 0.5em !important;
              position: relative;
              transition: all 0.2s ease;
              font-weight: 500;
            }
            .enrolled-date {
              background-color: #22c55e !important;
              color: white !important;
            }
            .enrolled-date:hover {
              background-color: #16a34a !important;
            }
            .available-date {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            .available-date:hover {
              background-color: #2563eb !important;
            }
            .react-calendar__tile--now {
              background-color: #fef3c7 !important;
              color: #92400e;
            }
            .react-calendar__tile--now:hover {
              background-color: #fde68a !important;
            }
          `}</style>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Classes for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Enrolled Classes</h3>
              <div className="space-y-3">
                {enrolledClasses.length === 0 ? (
                  <p className="text-gray-500">No enrolled classes for this day</p>
                ) : (
                  enrolledClasses.map((classItem) => (
                    <div key={classItem.id} className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-green-800">{classItem.title}</h4>
                          <p className="text-sm text-green-600">
                            {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnenroll(classItem.id)}
                        >
                          Unenroll
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Available Classes</h3>
              <div className="space-y-3">
                {availableClasses.length === 0 ? (
                  <p className="text-gray-500">No available classes for this day</p>
                ) : (
                  availableClasses.map((classItem) => (
                    <div key={classItem.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{classItem.title}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>
                              {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p>
                              {classItem.enrollments.length} / {classItem.capacity} enrolled
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleEnroll(classItem.id)}
                          disabled={classItem.enrollments.length >= classItem.capacity}
                        >
                          Enroll
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 