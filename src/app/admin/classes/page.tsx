'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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

interface ClassWithEnrollments extends Class {
  enrollments?: (Enrollment & { user: User })[];
}

interface FormData {
  title: string;
  description: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  capacity: string;
  isRecurring: boolean;
  numberOfWeeks: string;
  selectedDays: boolean[];
}

export default function AdminClasses() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<ClassWithEnrollments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startHour: '9',
    startMinute: '0',
    endHour: '10',
    endMinute: '0',
    capacity: '20',
    isRecurring: false,
    numberOfWeeks: '1',
    selectedDays: Array(7).fill(false),
  });
  const [isClearing, setIsClearing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.isRecurring && !formData.selectedDays.some(day => day)) {
      alert('Please select at least one day of the week for recurring classes');
      return;
    }

    const startHour = parseInt(formData.startHour);
    const startMinute = parseInt(formData.startMinute);
    const endHour = parseInt(formData.endHour);
    const endMinute = parseInt(formData.endMinute);
    const capacity = parseInt(formData.capacity);
    const numberOfWeeks = parseInt(formData.numberOfWeeks);

    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute) || isNaN(capacity)) {
      alert('Please enter valid numbers for time and capacity');
      return;
    }

    if (formData.isRecurring) {
      try {
        const dates: Date[] = [];
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0); // Reset time to start of day

        for (let week = 0; week < numberOfWeeks; week++) {
          for (let day = 0; day < 7; day++) {
            if (formData.selectedDays[day]) {
              const date = new Date(startDate);
              date.setDate(date.getDate() + (day - startDate.getDay()) + (week * 7));
              dates.push(date);
            }
          }
        }

        // Sort dates chronologically
        dates.sort((a, b) => a.getTime() - b.getTime());

        let successCount = 0;
        const errors: string[] = [];

        // Create classes for all dates
        for (const date of dates) {
          const classStartTime = new Date(date);
          classStartTime.setHours(startHour, startMinute, 0);
          
          const classEndTime = new Date(date);
          classEndTime.setHours(endHour, endMinute, 0);

          if (classStartTime >= classEndTime) {
            alert('Start time must be before end time');
            return;
          }

          const classData = {
            title: formData.title,
            description: formData.description,
            startTime: classStartTime.toISOString(),
            endTime: classEndTime.toISOString(),
            capacity: capacity,
          };

          try {
            const response = await fetch('/api/admin/classes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(classData),
            });

            if (response.ok) {
              successCount++;
            } else {
              const errorData = await response.json();
              errors.push(`Failed to create class for ${date.toLocaleDateString()}: ${errorData.error}`);
            }
          } catch {
            errors.push(`Error creating class for ${date.toLocaleDateString()}: Network error`);
          }
        }

        // Reset form
        setFormData({
          title: '',
          description: '',
          startHour: '9',
          startMinute: '0',
          endHour: '10',
          endMinute: '0',
          capacity: '20',
          isRecurring: false,
          numberOfWeeks: '1',
          selectedDays: Array(7).fill(false),
        });
        setSelectedDate(new Date());
        await fetchClasses();

        if (errors.length > 0) {
          alert(`Created ${successCount} classes.\n\nErrors:\n${errors.join('\n')}`);
        } else {
          alert(`Successfully created ${successCount} classes!`);
        }
      } catch {
        console.error('Error creating recurring classes');
        alert('Failed to create recurring classes. Please try again.');
      }
    } else {
      try {
        const startTime = new Date(selectedDate);
        startTime.setHours(startHour, startMinute, 0);
        
        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0);

        if (startTime >= endTime) {
          alert('Start time must be before end time');
          return;
        }

        const classData = {
          title: formData.title,
          description: formData.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          capacity: capacity,
        };
        
        const response = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classData),
        });
        
        if (response.ok) {
          setFormData({
            title: '',
            description: '',
            startHour: '9',
            startMinute: '0',
            endHour: '10',
            endMinute: '0',
            capacity: '20',
            isRecurring: false,
            numberOfWeeks: '1',
            selectedDays: Array(7).fill(false),
          });
          setSelectedDate(new Date());
          await fetchClasses();
          alert('Class created successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to create class: ${errorData.error}`);
        }
      } catch {
        console.error('Error creating class');
        alert('Failed to create class. Please try again.');
      }
    }
  };
  
  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/classes?id=${classId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchClasses();
        alert('Class deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete class: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('An error occurred while deleting the class');
    }
  };

  const getClassesForDate = (date: Date) => {
    return classes.filter(classItem => {
      const classDate = new Date(classItem.startTime);
      return classDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const classesOnDate = getClassesForDate(date);
    if (classesOnDate.length === 0) return null;

    return (
      <div className="class-indicator">
        <span className="class-count">{classesOnDate.length}</span>
      </div>
    );
  };
  
  const handleDayToggle = (dayIndex: number) => {
    const newSelectedDays = [...formData.selectedDays];
    newSelectedDays[dayIndex] = !newSelectedDays[dayIndex];
    setFormData({
      ...formData,
      selectedDays: newSelectedDays,
    });
  };
  
  const handleClearAllClasses = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/classes/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the classes list
        router.refresh();
        toast({
          title: "Success",
          description: "All classes have been cleared.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clear classes');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
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
      
      <div className="grid grid-cols-12 gap-6">
        {/* Calendar and Class List Section */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              className="w-full"
              tileContent={tileContent}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            
            {classesForSelectedDate.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No classes scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classesForSelectedDate.map((classItem) => (
                  <div key={classItem.id} className=" rounded-lg p-4 hover:shadow-sm transition-shadow">
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Registered Users Section */}
                    {classItem.enrollments && classItem.enrollments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Registered Users:</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {classItem.enrollments.map((enrollment: any) => (
                            <div 
                              key={enrollment.user.id} 
                              className="flex items-center justify-between py-1 px-2"
                            >
                              <span className="text-sm text-gray-600">{enrollment.user.name || enrollment.user.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Class Form Section */}
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title <span className="text-blue-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Class title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                    placeholder="Class description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Time <span className="text-blue-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        name="startHour"
                        value={formData.startHour}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        name="startMinute"
                        value={formData.startMinute}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg"
                      >
                        {[0, 15, 30, 45].map((min) => (
                          <option key={min} value={min}>
                            {min.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Time <span className="text-blue-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <select
                        name="endHour"
                        value={formData.endHour}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        name="endMinute"
                        value={formData.endMinute}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg"
                      >
                        {[0, 15, 30, 45].map((min) => (
                          <option key={min} value={min}>
                            {min.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacity <span className="text-blue-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        isRecurring: e.target.checked,
                      }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Recurring Class</span>
                  </label>

                  {formData.isRecurring && (
                    <div className="mt-4 space-y-4 pl-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Weeks <span className="text-blue-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="numberOfWeeks"
                          value={formData.numberOfWeeks}
                          onChange={handleInputChange}
                          min="1"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Days <span className="text-blue-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'sun', label: 'S' },
                            { key: 'mon', label: 'M' },
                            { key: 'tue', label: 'T' },
                            { key: 'wed', label: 'W' },
                            { key: 'thu', label: 'T' },
                            { key: 'fri', label: 'F' },
                            { key: 'sat', label: 'S' }
                          ].map((day, index) => (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => handleDayToggle(index)}
                              className={`w-8 h-8 rounded-full transition-all ${
                                formData.selectedDays[index]
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-50 text-gray-600 border hover:border-blue-500'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
              >
                Create Class{formData.isRecurring ? 'es' : ''}
              </Button>
            </form>
          </div>
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