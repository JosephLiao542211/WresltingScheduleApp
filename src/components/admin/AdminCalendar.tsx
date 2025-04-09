'use client';

import Calendar from 'react-calendar';
import type { Value } from 'react-calendar/dist/esm/shared/types.js';
import 'react-calendar/dist/Calendar.css';
import { Class, Enrollment, User } from "@prisma/client";

interface AdminCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  classes: (Class & {
    enrollments?: (Enrollment & { user: User })[];
  })[];
}

export function AdminCalendar({ selectedDate, onDateChange, classes }: AdminCalendarProps) {
  const tileContent = ({ date }: { date: Date }) => {
    const classesOnDate = classes.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.toDateString() === date.toDateString();
    });

    if (classesOnDate.length === 0) return null;

    return (
      <div className="class-indicator">
        <span className="class-count">{classesOnDate.length}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <Calendar
        onChange={(value: Value) => {
          if (value instanceof Date) {
            onDateChange(value);
          }
        }}
        value={selectedDate}
        className="w-full"
        tileContent={tileContent}
      />
    </div>
  );
} 