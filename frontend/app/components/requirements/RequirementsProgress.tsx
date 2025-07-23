// app/components/requirements/RequirementsProgress.tsx
'use client';

import { RequirementsProgress as RequirementsProgressType } from '@/types/requirements';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequirementsProgressProps {
    progress: RequirementsProgressType;
}

export function RequirementsProgress({ progress }: RequirementsProgressProps) {
    const { program, completed_credits, planned_credits, total_required_credits, requirements } = progress;
    const remaining_credits = Math.max(0, total_required_credits - completed_credits - planned_credits);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{program.name}</h3>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">
                        {completed_credits}/{total_required_credits} credits
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                    <div
                        className="bg-green-500 h-3 rounded-full absolute left-0 top-0"
                        style={{ width: `${(completed_credits / total_required_credits) * 100}%` }}
                    />
                    <div
                        className="bg-blue-300 h-3 rounded-full absolute left-0 top-0"
                        style={{
                            left: `${(completed_credits / total_required_credits) * 100}%`,
                            width: `${(planned_credits / total_required_credits) * 100}%`
                        }}
                    />
                </div>

                <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-600">Completed: {completed_credits}</span>
                    <span className="text-blue-600">Planned: {planned_credits}</span>
                    <span className="text-gray-500">Remaining: {remaining_credits}</span>
                </div>
            </div>

            {/* Requirements sections */}
            <div className="space-y-4">
                {requirements.map((req, idx) => (
                    <RequirementSection key={idx} requirement={req} />
                ))}
            </div>
        </div>
    );
}

function RequirementSection({ requirement }: { requirement: any }) {
    const completedCourses = requirement.courses.filter((c: any) => c.is_completed).length;
    const plannedCourses = requirement.courses.filter((c: any) => c.is_planned).length;
    const totalRequired = requirement.min_courses || requirement.courses.filter((c: any) => c.is_required).length;

    const isComplete = completedCourses >= totalRequired;
    const isPartiallyPlanned = completedCourses + plannedCourses >= totalRequired;

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center">
                    {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : isPartiallyPlanned ? (
                        <AlertCircle className="w-4 h-4 text-blue-500 mr-2" />
                    ) : (
                        <Circle className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    {requirement.category_name}
                </h4>
                <span className="text-sm text-gray-500">
                    {completedCourses}/{totalRequired} courses
                </span>
            </div>

            {requirement.selection_notes && (
                <p className="text-xs text-gray-600 mb-2">{requirement.selection_notes}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
                {requirement.courses.map((course: any, idx: number) => (
                    <div
                        key={idx}
                        className={cn(
                            'text-xs p-2 rounded',
                            course.is_completed ? 'bg-green-50 text-green-700' :
                                course.is_planned ? 'bg-blue-50 text-blue-700' :
                                    'bg-gray-50 text-gray-600'
                        )}
                    >
                        <span className="font-medium">{course.course_id}</span>
                        {course.is_completed && ' ✓'}
                        {course.is_planned && ' (planned)'}
                    </div>
                ))}
            </div>
        </div>
    );
}