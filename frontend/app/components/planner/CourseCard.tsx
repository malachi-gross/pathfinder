// app/components/planner/CourseCard.tsx
'use client';

import { PlannedCourse } from '@/types/planner';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: PlannedCourse;
  semesterId: string;
}

export function CourseCard({ course, semesterId }: CourseCardProps) {
  const { removeCourse } = useSchedule();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: course.course_id,
    data: { type: 'course', course, semesterId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-gray-50 p-3 rounded border flex items-center gap-2 group',
        isDragging && 'opacity-50',
        course.prereqsMet === false && 'border-red-300 bg-red-50'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{course.course_id}</span>
          {course.prereqsMet === false && (
            <AlertCircle className="w-4 h-4 text-red-500" title="Missing prerequisites" />
          )}
        </div>
        <p className="text-xs text-gray-600 truncate">{course.name}</p>
        <p className="text-xs text-gray-500">{course.credits} credits</p>
      </div>

      <button
        onClick={() => removeCourse(semesterId, course.course_id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}