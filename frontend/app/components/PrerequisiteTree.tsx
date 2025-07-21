// app/components/PrerequisiteTree.tsx
'use client';

import { CoursePrerequisites, PrerequisiteGroup } from '@/types/course';
import { cn } from '@/lib/utils';

interface PrerequisiteTreeProps {
  prerequisites: CoursePrerequisites;
}

export function PrerequisiteTree({ prerequisites }: PrerequisiteTreeProps) {
  const renderGroup = (group: PrerequisiteGroup, index: number) => {
    const isLastGroup = index === prerequisites.prerequisite_groups.length - 1;

    return (
      <div key={group.prereq_group} className="flex items-start">
        <div className="flex flex-col items-center mr-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
            {index + 1}
          </div>
          {!isLastGroup && <div className="w-0.5 h-16 bg-gray-300 mt-2" />}
        </div>

        <div className="flex-1">
          <div className="mb-2">
            {group.courses.length > 1 && (
              <p className="text-sm text-gray-600 mb-1">Choose one:</p>
            )}
            <div className="flex flex-wrap gap-2">
              {group.courses.map((course, courseIndex) => (
                <div key={course.course_id}>
                  <a
                    href={`/courses/${encodeURIComponent(course.course_id)}`}
                    className="inline-block px-3 py-1 bg-white border border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-medium">{course.course_id}</span>
                    <span className="text-gray-600 text-sm ml-1">
                      {course.name}
                    </span>
                  </a>
                  {courseIndex < group.courses.length - 1 && (
                    <span className="mx-2 text-gray-400">OR</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {!isLastGroup && (
            <p className="text-sm text-gray-500 font-medium">AND</p>
          )}
        </div>
      </div>
    );
  };

  if (
    prerequisites.prerequisite_groups.length === 0 &&
    prerequisites.corequisite_groups.length === 0
  ) {
    return (
      <p className="text-gray-500 italic">No prerequisites required</p>
    );
  }

  return (
    <div>
      {prerequisites.prerequisite_groups.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Prerequisites</h4>
          <div className="space-y-4">
            {prerequisites.prerequisite_groups.map((group, index) =>
              renderGroup(group, index)
            )}
          </div>
        </div>
      )}

      {prerequisites.corequisite_groups.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Corequisites</h4>
          <div className="space-y-2">
            {prerequisites.corequisite_groups.map((group) => (
              <div key={group.prereq_group} className="flex flex-wrap gap-2">
                {group.courses.map((course) => (
                  <a
                    key={course.course_id}
                    href={`/courses/${encodeURIComponent(course.course_id)}`}
                    className="inline-block px-3 py-1 bg-yellow-50 border border-yellow-300 rounded hover:border-yellow-500 transition-colors"
                  >
                    {course.course_id}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}