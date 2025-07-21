// app/components/CourseCard.tsx
'use client';

import Link from 'next/link';
import { Course } from '@/types/course';
import { formatCredits } from '@/lib/utils';
import { BookOpen, Clock } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${encodeURIComponent(course.course_id)}`}
      className="block bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {course.course_id}
          </h3>
          <p className="text-gray-700">{course.name}</p>
        </div>
        {course.credits && (
          <span className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 rounded">
            <Clock className="w-3 h-3 mr-1" />
            {formatCredits(course.credits)}
          </span>
        )}
      </div>

      {course.description && (
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
          {course.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{course.department_code}</span>
        {course.gen_ed && course.gen_ed.length > 0 && (
          <span className="text-sm text-blue-600">
            Gen Ed: {course.gen_ed.join(', ')}
          </span>
        )}
      </div>
    </Link>
  );
}