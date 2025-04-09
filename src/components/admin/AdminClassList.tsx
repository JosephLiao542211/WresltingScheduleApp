'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Class, Enrollment, User } from "@prisma/client";
import { Trash2 } from "lucide-react";

interface AdminClassListProps {
  classes: (Class & {
    enrollments?: (Enrollment & { user: User })[];
  })[];
  onClassDeleted: (classId: string) => Promise<void>;
  onUserUnenrolled: (classId: string, userId: string) => Promise<void>;
}

export function AdminClassList({ classes, onClassDeleted, onUserUnenrolled }: AdminClassListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteClass = async (classId: string) => {
    setIsDeleting(classId);
    try {
      await onClassDeleted(classId);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUnenrollUser = async (classId: string, userId: string) => {
    setIsUnenrolling(`${classId}-${userId}`);
    try {
      await onUserUnenrolled(classId, userId);
      toast({
        title: "Success",
        description: "User unenrolled successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unenroll user",
        variant: "destructive",
      });
    } finally {
      setIsUnenrolling(null);
    }
  };

  return (
    <div className="space-y-4">
      {classes.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No classes scheduled</p>
        </div>
      ) : (
        classes.map((classItem) => (
          <div key={classItem.id} className="rounded-lg p-4 hover:shadow-sm transition-shadow border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{classItem.title}</h3>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(classItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {classItem.enrollments?.length || 0} / {classItem.capacity}
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClass(classItem.id)}
                disabled={isDeleting === classItem.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Registered Users Section */}
            {classItem.enrollments && classItem.enrollments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Registered Users:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {classItem.enrollments.map((enrollment) => (
                    <div 
                      key={enrollment.id} 
                      className="flex items-center justify-between py-1 px-2 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-600">
                        {enrollment.user?.name || enrollment.user?.email || 'Anonymous User'}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnenrollUser(classItem.id, enrollment.userId)}
                        className="ml-2"
                        disabled={isUnenrolling === `${classItem.id}-${enrollment.userId}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 