// app/components/planner/SemesterCard.tsx
'use client';

import { Semester } from '@/types/planner';
import { useSchedule } from '@/contexts/ScheduleContext';
import { Calendar, Trash2, AlertCircle } from 'lucide-react';
import { CourseCard } from '../CourseCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

interface SemesterCardProps {
  semester: Semester;
}

export function SemesterCard({ semester }: SemesterCardProps) {
  const { removeSemester, getTotalCredits } = useSchedule();
  const totalCredits = getTotalCredits(semester.id);

  const { setNodeRef, isOver } = useDroppable({
    id: semester.id,
    data: { type: 'semester', semester },
  });

  const creditWarning = totalCredits > 18 || (totalCredits > 0 && totalCredits < 12);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-white rounded-lg shadow-sm border p-4 min-h-[300px] transition-colors',
        isOver && 'border-blue-500 bg-blue-50'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-semibold text-gray-900">
            {semester.term} {semester.year}
          </h3>
        </div>
        <button
          onClick={() => removeSemester(semester.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Remove semester"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <div className={cn(
          'text-sm',
          creditWarning ? 'text-amber-600' : 'text-gray-600'
        )}>
          {totalCredits} credits
          {creditWarning && (
            <span className="ml-1">
              {totalCredits > 18 ? '(overload)' : totalCredits > 0 ? '(underload)' : ''}
            </span>
          )}
        </div>
      </div>

      <SortableContext
        items={semester.courses.map(c => c.course_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]">
          {semester.courses.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              semesterId={semester.id}
            />
          ))}
          {semester.courses.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Drag courses here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}