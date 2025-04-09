import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Class, Enrollment } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClassDetailsModalProps {
  classItem: Class & {
    enrollments: (Enrollment & {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    })[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ClassDetailsModal({
  classItem,
  isOpen,
  onClose,
}: ClassDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {classItem.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Schedule</h3>
            <p className="text-gray-600">
              {new Date(classItem.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              {classItem.description || "No description available."}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Registrants ({classItem.enrollments.length} / {classItem.capacity})
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {classItem.enrollments.length === 0 ? (
                <p className="text-gray-500">No registrants yet</p>
              ) : (
                <div className="space-y-2">
                  {classItem.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.userId}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{enrollment.user.name}</p>
                        <p className="text-sm text-gray-500">{enrollment.user.email}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 