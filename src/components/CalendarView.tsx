import Calendar from 'react-calendar';
import { Value } from "react-calendar/dist/esm/shared/types.js";
import 'react-calendar/dist/Calendar.css';
import { Enrollment, Class, User } from '@prisma/client';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  classes: (Class & {
    enrollments: (Enrollment & {
      user: User;
    })[];
  })[];
  userId: string;
}

export function CalendarView({ selectedDate, onDateChange, classes, userId }: CalendarViewProps) {
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

  return (
    <div className="flex-1">
      <Calendar
        onChange={(value: Value) => {
          if (value instanceof Date) {
            onDateChange(value);
          }
        }}
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
  );
} 