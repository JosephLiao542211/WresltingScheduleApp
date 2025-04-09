'use client';

import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ClassFormProps {
  selectedDate: Date;
  onClassCreated: () => Promise<void>;
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

export function ClassForm({ selectedDate, onClassCreated }: ClassFormProps) {
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
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDayToggle = (dayIndex: number) => {
    const newSelectedDays = [...formData.selectedDays];
    newSelectedDays[dayIndex] = !newSelectedDays[dayIndex];
    setFormData({
      ...formData,
      selectedDays: newSelectedDays,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.isRecurring && !formData.selectedDays.some(day => day)) {
      toast({
        title: "Error",
        description: "Please select at least one day of the week for recurring classes",
        variant: "destructive",
      });
      return;
    }

    const startHour = parseInt(formData.startHour);
    const startMinute = parseInt(formData.startMinute);
    const endHour = parseInt(formData.endHour);
    const endMinute = parseInt(formData.endMinute);
    const capacity = parseInt(formData.capacity);
    const numberOfWeeks = parseInt(formData.numberOfWeeks);

    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute) || isNaN(capacity)) {
      toast({
        title: "Error",
        description: "Please enter valid numbers for time and capacity",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    if (formData.isRecurring) {
      try {
        const dates: Date[] = [];
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        for (let week = 0; week < numberOfWeeks; week++) {
          for (let day = 0; day < 7; day++) {
            if (formData.selectedDays[day]) {
              const date = new Date(startDate);
              date.setDate(date.getDate() + (day - startDate.getDay()) + (week * 7));
              dates.push(date);
            }
          }
        }

        dates.sort((a, b) => a.getTime() - b.getTime());

        let successCount = 0;
        const errors: string[] = [];

        for (const date of dates) {
          const classStartTime = new Date(date);
          classStartTime.setHours(startHour, startMinute, 0);
          
          const classEndTime = new Date(date);
          classEndTime.setHours(endHour, endMinute, 0);

          if (classStartTime >= classEndTime) {
            toast({
              title: "Error",
              description: "Start time must be before end time",
              variant: "destructive",
            });
            setIsCreating(false);
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
        await onClassCreated();

        if (errors.length > 0) {
          toast({
            title: "Partial Success",
            description: `Created ${successCount} classes. ${errors.length} errors occurred.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: `Successfully created ${successCount} classes!`,
            variant: "default",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to create recurring classes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    } else {
      try {
        const startTime = new Date(selectedDate);
        startTime.setHours(startHour, startMinute, 0);
        
        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0);

        if (startTime >= endTime) {
          toast({
            title: "Error",
            description: "Start time must be before end time",
            variant: "destructive",
          });
          setIsCreating(false);
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
          await onClassCreated();
          toast({
            title: "Success",
            description: "Class created successfully!",
            variant: "default",
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to create class",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to create class. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
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
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : `Create Class${formData.isRecurring ? 'es' : ''}`}
        </Button>
      </form>
    </div>
  );
} 