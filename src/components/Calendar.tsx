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
  class: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    capacity: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
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

type CalendarTileType = {
  date: Date;
  view: string;
};

export default function ClassCalendar() {
  const [date, setDate] = useState(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<Enrollment[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { data: session } = useSession();

  const isAdmin = session?.user?.email === "joseph.liao1018@gmail.com";

  // Fetch both available classes and enrolled classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available classes
        const classesRes = await fetch('/api/classes');
        const classesData = await classesRes.json();
        setClasses(classesData);

        // Fetch enrolled classes if user is logged in
        if (session?.user) {
          const enrolledRes = await fetch('/api/classes/enrolled');
          const enrolledData = await enrolledRes.json();
          setEnrolledClasses(enrolledData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [session]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const getClassesForDate = (date: Date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.toDateString() === date.toDateString();
    });
  };

  const isEnrolledInClass = (classId: string) => {
    return enrolledClasses.some(enrollment => enrollment.classId === classId);
  };

  const refreshData = async () => {
    try {
      // Refresh available classes
      const classesRes = await fetch('/api/classes');
      const classesData = await classesRes.json();
      setClasses(classesData);

      // Refresh enrolled classes if user is logged in
      if (session?.user) {
        const enrolledRes = await fetch('/api/classes/enrolled');
        const enrolledData = await enrolledRes.json();
        setEnrolledClasses(enrolledData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
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
        await refreshData(); // Refresh both lists
        alert('Successfully enrolled!');
      } else {
        const error = await response.json();
        alert(`Failed to enroll: ${error.message}`);
      }
    } catch {
      alert('An error occurred while enrolling');
    }
  };

  const handleUnenroll = async (classId: string) => {
    if (!session) {
      alert('Please login to manage enrollments');
      return;
    }

    try {
      const response = await fetch('/api/classes/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      });

      if (response.ok) {
        await refreshData(); // Refresh both lists
        alert('Successfully unenrolled!');
      } else {
        const error = await response.json();
        alert(`Failed to unenroll: ${error.message}`);
      }
    } catch {
      alert('An error occurred while unenrolling');
    }
  };

  const handleAdminUnenroll = async (classId: string, userId: string) => {
    if (!isAdmin) {
      alert('Only admins can perform this action');
      return;
    }

    try {
      const response = await fetch('/api/admin/classes/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, userId })
      });

      if (response.ok) {
        await refreshData();
        alert('Successfully unenrolled user from class');
      } else {
        const error = await response.json();
        alert(`Failed to unenroll user: ${error.message}`);
      }
    } catch {
      alert('An error occurred while unenrolling user');
    }
  };

  const tileClassName = ({ date, view }: CalendarTileType) => {
    if (view !== 'month') return '';

    const classesOnDate = getClassesForDate(date);
    const hasEnrolledClass = classesOnDate.some(c => isEnrolledInClass(c.id));
    const hasFullClass = classesOnDate.some(c => c.enrollments.length >= c.capacity);
    const hasAvailableClass = classesOnDate.length > 0;

    if (hasFullClass) return 'full-date';
    if (hasEnrolledClass) return 'enrolled-date';
    if (hasAvailableClass) return 'available-date';
    return '';
  };

  const tileContent = ({ date, view }: CalendarTileType) => {
    if (view !== 'month') return null;

    const classesOnDate = getClassesForDate(date);
    if (classesOnDate.length === 0) return null;

    return (
      <div className="tile-content">
        <div className="class-indicator">
          <span className="class-count">{classesOnDate.length}</span>
        </div>
        <div className="class-preview">
          {classesOnDate.map((classItem) => (
            <div key={classItem.id} className="class-preview-item">
              <span className="class-title">{classItem.title}</span>
              <span className="class-time">
                {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const classesForSelectedDate = getClassesForDate(date);

  return (
    <div className="flex flex-col gap-8 w-full p-4 bg-gray-50 min-h-screen">
      {session?.user && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg text-white">
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-blue-200">{session.user.name}</span>
          </h1>
          <p className="text-blue-100 mt-2 text-lg">Manage your wrestling class schedule below</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Calendar
            onChange={(value) => handleDateChange(value as Date)}
            value={date}
            className="w-full rounded-xl shadow-lg p-4 calendar-custom"
            tileClassName={tileClassName}
            tileContent={tileContent}
          />
          <style jsx global>{`
            .calendar-custom {
              width: 100% !important;
              max-width: none !important;
              background: white;
              padding: 24px !important;
              border-radius: 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
            .react-calendar__navigation button:disabled {
              opacity: 0.5;
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
              cursor: pointer;
              border: 1px solid transparent;
              font-weight: 500;
              border-radius: 0;
              margin: 0;
            }
            .react-calendar__tile:hover {
              border-color: rgba(0, 0, 0, 0.3);
              z-index: 10;
            }
            .full-date {
              background-color: #ef4444 !important;
              color: white;
            }
            .full-date:hover {
              border-color: rgba(0, 0, 0, 0.3) !important;
              background-color: #dc2626 !important;
            }
            .enrolled-date {
              background-color: #22c55e !important;
              color: white;
            }
            .enrolled-date:hover {
              border-color: rgba(0, 0, 0, 0.3) !important;
              background-color: #16a34a !important;
            }
            .available-date:not(.enrolled-date):not(.full-date) {
              background-color: #3b82f6 !important;
              color: white;
            }
            .available-date:not(.enrolled-date):not(.full-date):hover {
              border-color: rgba(0, 0, 0, 0.3) !important;
              background-color: #2563eb !important;
            }
            .react-calendar__tile--now {
              background-color: #fef3c7 !important;
              color: #92400e;
            }
            .react-calendar__tile--now:hover {
              background-color: #fde68a !important;
            }
            .class-preview {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 90%;
              opacity: 0;
              padding: 8px;
              z-index: 20;
            }
            .react-calendar__tile:hover .class-preview {
              opacity: 1;
            }
            .class-preview-item {
              font-size: 0.75rem;
              margin-bottom: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              color: white;
              padding: 6px 8px;
              border-radius: 6px;
              background-color: #5c5c5c;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              backdrop-filter: blur(4px);
              transition: all 0.2s ease;
            }
          `}</style>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Classes for {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            {session?.user && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Enrolled Classes</h3>
                <div className="space-y-3">
                  {enrolledClasses.length === 0 ? (
                    <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">You are not enrolled in any classes</p>
                  ) : (
                    enrolledClasses.map((enrollment) => (
                      <div key={enrollment.id} className="bg-green-50 p-4 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                        <p className="font-semibold text-green-800">{enrollment.class.title}</p>
                        <p className="text-sm text-green-600">
                          {formatDateTime(enrollment.class.startTime)} - {formatDateTime(enrollment.class.endTime)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <h3 className="text-xl font-semibold mb-4 text-gray-800">Available Classes</h3>
            {classesForSelectedDate.length === 0 ? (
              <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">No classes scheduled for this day.</p>
            ) : (
              <div className="space-y-6">
                {classesForSelectedDate.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="border rounded-xl p-6 hover:shadow-lg transition-shadow bg-white"
                  >
                    <h3 className="font-bold text-xl text-gray-800 mb-4">{classItem.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-600 mb-4">{classItem.description}</p>
                        <div className="space-y-2 mb-6">
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span>
                              {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {new Date(classItem.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                              </svg>
                            </span>
                            <span>
                              {classItem.capacity - classItem.enrollments.length}/{classItem.capacity} spots available
                            </span>
                          </p>
                        </div>
                        {!isEnrolledInClass(classItem.id) ? (
                          <Button
                            onClick={() => handleEnroll(classItem.id)}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                            disabled={classItem.enrollments.length >= classItem.capacity}
                          >
                            {classItem.enrollments.length >= classItem.capacity ? 'Class Full' : 'Enroll Now'}
                          </Button>
                        ) : (
                          <div className="flex gap-3 items-center">
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Enrolled
                            </span>
                            <Button
                              onClick={() => handleUnenroll(classItem.id)}
                              variant="destructive"
                              size="sm"
                              className="hover:bg-red-600"
                            >
                              Unenroll
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          Registered Users ({classItem.enrollments.length}/{classItem.capacity})
                        </h4>
                        <div className="max-h-[400px] overflow-y-auto border rounded-lg bg-white">
                          {classItem.enrollments.length === 0 ? (
                            <p className="text-sm text-gray-500 p-4">No users registered yet</p>
                          ) : (
                            <ul className="divide-y">
                              {classItem.enrollments.map((enrollment) => (
                                <li key={enrollment.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span className="font-medium text-gray-700">{enrollment.user?.name || 'Anonymous'}</span>
                                  </div>
                                  {isAdmin && enrollment.user?.id !== session?.user?.id && (
                                    <Button
                                      onClick={() => handleAdminUnenroll(classItem.id, enrollment.userId)}
                                      variant="destructive"
                                      size="sm"
                                      className="hover:bg-red-600"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 