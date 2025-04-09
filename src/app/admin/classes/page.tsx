'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Class, Enrollment, User } from "@prisma/client";
import { ClassForm } from "@/components/admin/ClassForm";
import { AdminClassList } from "@/components/admin/AdminClassList";
import { AdminCalendar } from "@/components/admin/AdminCalendar";

interface ClassWithEnrollments extends Class {
  enrollments?: (Enrollment & { user: User })[];
}

export default function AdminClasses() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<ClassWithEnrollments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isClearing, setIsClearing] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchClasses();
    }
  }, [status, router]);
  
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/classes');
      if (!res.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await res.json();
      setClasses(data);
    } catch {
      console.error('Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleDeleteClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/admin/classes?id=${classId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchClasses();
      } else {
        throw new Error('Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  };

  const handleUnenrollUser = async (classId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/classes/unenroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unenroll user');
      }

      await fetchClasses();
    } catch (error) {
      console.error('Error unenrolling user:', error);
      throw error;
    }
  };

  const handleClearAllClasses = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/classes/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
        toast({
          title: "Success",
          description: "All classes have been cleared.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clear classes');
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getClassesForDate = (date: Date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.toDateString() === date.toDateString();
    });
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }
  
  const classesForSelectedDate = getClassesForDate(selectedDate);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Classes</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isClearing}>
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all classes?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all classes and enrollments permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllClasses}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar and Class List Section */}
        <div className="lg:col-span-5">
          <AdminCalendar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            classes={classes}
          />

          <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            
            <AdminClassList
              classes={classesForSelectedDate}
              onClassDeleted={handleDeleteClass}
              onUserUnenrolled={handleUnenrollUser}
            />
          </div>
        </div>

        {/* Create Class Form Section */}
        <div className="lg:col-span-7">
          <ClassForm
            selectedDate={selectedDate}
            onClassCreated={fetchClasses}
          />
        </div>
      </div>

      <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          max-width: none !important;
          background: white;
          border: 1px solid #e5e7eb;
          font-family: inherit;
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        .react-calendar__tile {
          height: 65px !important;
          padding: 1em 0.5em !important;
          position: relative;
          font-size: 1rem;
        }
        .react-calendar__navigation button {
          font-size: 1.1rem;
          padding: 1rem 0;
        }
        .react-calendar__navigation {
          margin-bottom: 1rem;
        }
        .react-calendar__month-view__weekdays {
          font-size: 0.95rem;
          padding: 0.5rem 0;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #ef4444;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #f3f4f6;
          border-radius: 0.5rem;
        }
        .react-calendar__tile--active {
          background-color: #3b82f6 !important;
          border-radius: 0.5rem;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background-color: #2563eb !important;
        }
        .class-indicator {
          position: absolute;
          bottom: 4px;
          right: 4px;
        }
        .class-count {
          background-color: #3b82f6;
          color: white;
          border-radius: 9999px;
          padding: 2px 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 