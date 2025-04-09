import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Class, Enrollment } from '@prisma/client';
import { ClassDetailsModal } from './ClassDetailsModal';
import { Loader2 } from 'lucide-react';

interface ClassItemProps {
  classItem: Class & {
    enrollments: (Enrollment & {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    })[];
  };
  userId: string;
  onEnroll?: (classId: string) => Promise<void>;
  onUnenroll?: (classId: string) => Promise<void>;
  variant?: 'available' | 'enrolled';
}

export function ClassItem({ classItem, userId, onEnroll, onUnenroll, variant = 'available' }: ClassItemProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEnrolled = classItem.enrollments.some(e => e.user.id === userId);
  const isFull = classItem.enrollments.length >= classItem.capacity;

  const handleEnroll = async () => {
    if (!onEnroll) return;
    setIsLoading(true);
    try {
      await onEnroll(classItem.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!onUnenroll) return;
    setIsLoading(true);
    try {
      await onUnenroll(classItem.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
          variant === 'enrolled' 
            ? 'bg-green-50 border border-green-100' 
            : 'border border-gray-200'
        }`}
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className={`font-semibold ${
              variant === 'enrolled' ? 'text-green-800' : 'text-gray-800'
            }`}>
              {classItem.title || 'Untitled Class'}
            </h4>
            <div className="text-sm text-gray-600 mt-1">
              <p>
                {new Date(classItem.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })} at {new Date(classItem.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              {variant === 'available' && (
                <p>
                  {classItem.enrollments.length} / {classItem.capacity} enrolled
                </p>
              )}
              {classItem.description && (
                <p className="text-gray-500 mt-1 line-clamp-2">
                  {classItem.description}
                </p>
              )}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {variant === 'available' ? (
              <Button
                size="sm"
                onClick={handleEnroll}
                disabled={isFull || isEnrolled || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEnrolled ? (
                  'Enrolled'
                ) : (
                  'Enroll'
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnenroll}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Unenroll'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ClassDetailsModal
        classItem={classItem}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
} 