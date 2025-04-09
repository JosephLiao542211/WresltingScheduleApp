import { Class, Enrollment } from '@prisma/client';
import { ClassItem } from './ClassItem';
import { CompactClassItem } from './CompactClassItem';

interface ClassListProps {
  classes: (Class & {
    enrollments: (Enrollment & {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    })[];
  })[];
  userId: string;
  title: string;
  variant: 'available' | 'enrolled' | 'enrolled-compact';
  onEnroll?: (classId: string) => Promise<void>;
  onUnenroll?: (classId: string) => Promise<void>;
  emptyMessage?: string;
}

export function ClassList({
  classes,
  userId,
  title,
  variant,
  onEnroll,
  onUnenroll,
  emptyMessage = 'No classes available'
}: ClassListProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${variant === 'enrolled-compact' ? 'max-h-[300px] overflow-y-auto' : ''}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className={variant === 'enrolled-compact' ? 'flex flex-wrap gap-2' : 'space-y-2'}>
        {classes.length === 0 ? (
          <p className="text-gray-500">{emptyMessage}</p>
        ) : (
          classes.map((classItem) => {
            const processedClass = {
              ...classItem,
              enrollments: classItem.enrollments.map(enrollment => ({
                id: enrollment.id || '',
                createdAt: enrollment.createdAt || new Date(),
                userId: enrollment.user.id,
                classId: classItem.id,
                user: {
                  id: enrollment.user.id,
                  name: enrollment.user.name,
                  email: enrollment.user.email
                }
              }))
            };

            return variant === 'enrolled-compact' ? (
              <CompactClassItem
                key={classItem.id}
                classItem={processedClass}
                userId={userId}
                onUnenroll={onUnenroll}
              />
            ) : (
              <ClassItem
                key={classItem.id}
                classItem={processedClass}
                userId={userId}
                variant={variant}
                onEnroll={onEnroll}
                onUnenroll={onUnenroll}
              />
            );
          })
        )}
      </div>
    </div>
  );
} 