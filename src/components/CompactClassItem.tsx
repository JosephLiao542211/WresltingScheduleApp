import { Button } from '@/components/ui/button';
import { Class, Enrollment } from '@prisma/client';
import { ClassDetailsModal } from './ClassDetailsModal';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CompactClassItemProps {
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
  onUnenroll?: (classId: string) => Promise<void>;
}

export function CompactClassItem({ classItem, onUnenroll }: CompactClassItemProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        className="inline-flex items-center gap-3 py-1.5 px-3 bg-green-50 rounded-md border border-green-100 hover:shadow-sm transition-shadow cursor-pointer"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div>
          <span className="font-medium text-green-800 mr-2">
            {classItem.title}
          </span>
          <span className="text-sm text-green-600">
            {new Date(classItem.startTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })} at {new Date(classItem.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="destructive"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleUnenroll}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '✕'
            )}
          </Button>
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