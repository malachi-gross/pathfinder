// app/components/CourseSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { courseApi } from '@/lib/api';
import { CourseCard } from './CourseCard';
import { useDebounce } from '@/lib/hooks';

export function CourseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'search', debouncedQuery],
    queryFn: () => courseApi.searchCourses(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return (
    <div>
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {courses && courses.length > 0 && (
        <div className="grid gap-4">
          {courses.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
        </div>
      )}

      {courses && courses.length === 0 && debouncedQuery.length > 2 && (
        <p className="text-gray-500 text-center py-8">
          No courses found for "{debouncedQuery}"
        </p>
      )}
    </div>
  );
}