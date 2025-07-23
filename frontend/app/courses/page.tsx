// app/courses/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { courseApi } from '@/lib/api';
import { CourseCard } from '@/app/components/CourseCard';
import { CourseSearch } from '@/app/components/CourseSearch';
import { Loader2 } from 'lucide-react';
import { Course, Department } from '@/types/course';

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [selectedDept, setSelectedDept] = useState<string>('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: courseApi.getDepartments,
  });

  const { data: deptCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'department', selectedDept],
    queryFn: async () => courseApi.getByDepartment(selectedDept),
    enabled: !!selectedDept,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Courses</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">Departments</h2>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedDept('')}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${!selectedDept ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
            >
              All Departments
            </button>
            {departments?.map((dept: Department) => (
              <button
                key={dept.code}
                onClick={() => setSelectedDept(dept.code)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${selectedDept === dept.code
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
                  }`}
              >
                {dept.code} ({dept.course_count})
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedDept ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Courses</h2>
              <CourseSearch />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {selectedDept} Courses
              </h2>
              {coursesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {deptCourses?.map((course: Course) => (
                    <CourseCard key={course.course_id} course={course} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}