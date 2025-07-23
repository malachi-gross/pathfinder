// app/courses/[courseId]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { courseApi } from '@/lib/api';
import { PrerequisiteTree } from '@/app/components/PrerequisiteTree';
import { formatCredits } from '@/lib/utils';
import { GenEdRequirement } from '@/types/requirements';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = decodeURIComponent(params.courseId as string);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getOne(courseId),
  });

  const { data: prerequisites, isLoading: prereqLoading } = useQuery({
    queryKey: ['prerequisites', courseId],
    queryFn: () => courseApi.getPrerequisites(courseId),
    enabled: !!course,
  });

  if (courseLoading || prereqLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The course "{courseId}" could not be found.
          </p>
          <Link
            href="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse all courses →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/courses"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to courses
      </Link>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.course_id}
              </h1>
              <h2 className="text-xl text-gray-700">{course.name}</h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                <Clock className="w-4 h-4 mr-1" />
                {formatCredits(course.credits)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <BookOpen className="w-4 h-4 mr-1" />
              Department: {course.department_code}
            </div>
            {course.grading_status && (
              <div className="flex items-center text-gray-600">
                <GraduationCap className="w-4 h-4 mr-1" />
                {course.grading_status}
              </div>
            )}
          </div>
        </div>

        {course.description && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {course.description}
            </p>
          </div>
        )}

        {prerequisites && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Requirements</h3>
            <PrerequisiteTree prerequisites={prerequisites} />
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Planning tip:</strong> Make sure you've completed all
          prerequisites before enrolling in this course. Corequisites can be
          taken in the same semester.
        </p>
      </div>
    </div>
  );
}