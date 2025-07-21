// app/components/planner/CourseSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Loader2 } from 'lucide-react';
import { courseApi } from '@/lib/api';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useDebounce } from '@/lib/hooks';
import { PlannedCourse } from '@/types/planner';
import { cn } from '@/lib/utils';

interface CourseSelectorProps {
  onAddCourse?: (course: PlannedCourse) => void;
}

export function CourseSelector({ onAddCourse }: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { schedule } = useSchedule();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'search', debouncedQuery],
    queryFn: () => courseApi.searchCourses(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  // Get all courses already in the schedule
  const scheduledCourseIds = new Set(
    schedule.semesters.flatMap(sem => sem.courses.map(c => c.course_id))
  );

  const handleAddCourse = (course: any) => {
    const plannedCourse: PlannedCourse = {
      course_id: course.course_id,
      name: course.name,
      credits: course.credits || '0',
      department_code: course.department_code,
    };

    if (onAddCourse) {
      onAddCourse(plannedCourse);
    }
  };

  return (
    <div>
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for courses to add..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {courses && courses.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {courses.map((course) => {
            const isScheduled = scheduledCourseIds.has(course.course_id);
            
            return (
              <div
                key={course.course_id}
                className={cn(
                  'flex items-center justify-between p-3 bg-white border rounded-lg',
                  isScheduled && 'opacity-50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{course.course_id}</div>
                  <div className="text-xs text-gray-600 truncate">{course.name}</div>
                  <div className="text-xs text-gray-500">
                    {course.credits} credits • {course.department_code}
                  </div>
                </div>
                <button
                  onClick={() => handleAddCourse(course)}
                  disabled={isScheduled}
                  className={cn(
                    'p-2 rounded transition-colors',
                    isScheduled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  )}
                  title={isScheduled ? 'Already in schedule' : 'Add to schedule'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}