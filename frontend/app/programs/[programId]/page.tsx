// app/programs/[programId]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, BookOpen, CheckCircle, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { programApi } from '@/lib/api';
import { ProgramRequirement } from '@/types/program';

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.programId as string;

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => programApi.getOne(programId),
  });

  const { data: requirements, isLoading: reqLoading } = useQuery({
    queryKey: ['program-requirements', programId],
    queryFn: () => programApi.getProgramRequirements(programId),
    enabled: !!program,
  });

  if (programLoading || reqLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Program Not Found
          </h1>
          <Link
            href="/programs"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse all programs →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/programs"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to programs
      </Link>

      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {program.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-1" />
                  {program.program_type === 'major' ? 'Major' : 'Minor'}
                </span>
                {program.degree_type && (
                  <span>{program.degree_type}</span>
                )}
                {program.total_hours && (
                  <span className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-1" />
                    {program.total_hours} credit hours
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {requirements && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Requirements</h2>
            <RequirementsList requirements={requirements} />
          </div>
        )}
      </div>
    </div>
  );
}

function RequirementsList({ requirements }: { requirements: any }) {
  const typeLabels: Record<string, string> = {
    gateway: 'Gateway Courses',
    core: 'Core Requirements',
    elective: 'Electives',
    allied_science: 'Allied Sciences',
  };

  return (
    <div className="space-y-8">
      {Object.entries(requirements.requirements_by_type).map(([type, reqs]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {typeLabels[type] || type}
          </h3>
          <div className="space-y-4">
            {(reqs as ProgramRequirement[]).map((req) => (
              <RequirementCard key={req.id} requirement={req} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RequirementCard({ requirement }: { requirement: ProgramRequirement }) {
  const hasSpecificCourses = requirement.courses && requirement.courses.length > 0;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="mb-3">
        <h4 className="font-medium text-gray-900">
          {requirement.category_name || requirement.requirement_type}
        </h4>

        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
          {requirement.min_credits && (
            <span>{requirement.min_credits} credits</span>
          )}
          {requirement.min_courses && (
            <span>{requirement.min_courses} courses</span>
          )}
          {requirement.level_requirement && (
            <span className="text-blue-600">{requirement.level_requirement}</span>
          )}
        </div>

        {requirement.selection_notes && (
          <p className="text-sm text-gray-600 mt-2">
            {requirement.selection_notes}
          </p>
        )}

        {requirement.other_restrictions && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ {requirement.other_restrictions}
          </p>
        )}
      </div>

      {hasSpecificCourses && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">
            {requirement.courses.every(c => c.is_required)
              ? 'Required courses:'
              : 'Choose from:'}
          </p>
          <div className="grid gap-2">
            {requirement.courses.map((course) => (
              <Link
                key={course.course_id}
                href={`/courses/${encodeURIComponent(course.course_id)}`}
                className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center">
                  {course.is_required ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  <span className="font-medium">{course.course_id}</span>
                  <span className="text-gray-600 ml-2">{course.name}</span>
                </div>
                {course.credits && (
                  <span className="text-sm text-gray-500">
                    {course.credits} cr
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}