'use client';

import { useState } from "react";
import Calendar from "react-calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import 'react-calendar/dist/Calendar.css';
import { Class, Enrollment, User } from "@prisma/client";

interface CalendarProps {
  classes: (Class & {
    enrollments: (Enrollment & {
      user: User;
    })[];
  })[];
  userId: string;
}

type CalendarValue = Date | [Date, Date] | null;

export default function ClassCalendar({ classes, userId }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value);
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

      toast({
        title: "Success",
        description: "Successfully enrolled in class",
      });
    } catch (err) {
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

      toast({
        title: "Success",
        description: "Successfully unenrolled from class",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unenroll from class",
        variant: "destructive",
      });
    }
  };

  const tileContent = ({ date }: { date: Date }) => {
    const classesForDate = classes.filter((classItem) => {
      const classDate = new Date(classItem.startTime);
      return (
        classDate.getDate() === date.getDate() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getFullYear() === date.getFullYear()
      );
    });

    if (classesForDate.length > 0) {
      return (
        <div className="class-indicator">
          <span className="class-count">{classesForDate.length}</span>
        </div>
      );
    }
    return null;
  };

  const classesForSelectedDate = classes.filter((classItem) => {
    const classDate = new Date(classItem.startTime);
    return (
      classDate.getDate() === selectedDate.getDate() &&
      classDate.getMonth() === selectedDate.getMonth() &&
      classDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <div className="space-y-6">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        className="w-full"
        tileContent={tileContent}
      />

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>

        {classesForSelectedDate.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No classes scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classesForSelectedDate.map((classItem) => (
              <div
                key={classItem.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {classItem.title}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Date(classItem.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {classItem.enrollments.length} / {classItem.capacity}
                      </div>
                    </div>
                  </div>
                  {classItem.enrollments.some((e) => e.user.id === userId) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnenroll(classItem.id)}
                    >
                      Unenroll
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(classItem.id)}
                      disabled={classItem.enrollments.length >= classItem.capacity}
                    >
                      Enroll
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 