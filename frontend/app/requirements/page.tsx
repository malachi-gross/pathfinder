// app/requirements/page.tsx
'use client';

import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { RequirementsProvider, useRequirements } from '@/contexts/RequirementsContext';
import { ProgramSelector } from '@/app/components/requirements/ProgramSelector';
import { RequirementsProgress } from '@/app/components/requirements/RequirementsProgress';
import { GenEdProgress } from '@/app/components/requirements/GenEdProgress';
import { Loader2, Target, TrendingUp } from 'lucide-react';

function RequirementsContent() {
    const { requirementsProgress, genEdProgress, isLoading, selectedPrograms } = useRequirements();
    const hasPrograms = selectedPrograms.majors.length > 0 || selectedPrograms.minors.length > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Degree Requirements Tracker
                </h1>
                <p className="text-gray-600">
                    Track your progress toward graduation by selecting your majors and minors
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left column - Program selector */}
                <div className="lg:col-span-1">
                    <ProgramSelector />

                    {/* Quick stats */}
                    {hasPrograms && !isLoading && (
                        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-semibold mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Target className="w-4 h-4 mr-2 text-blue-500" />
                                        <span className="text-sm">Total Programs</span>
                                    </div>
                                    <span className="font-medium">
                                        {selectedPrograms.majors.length + selectedPrograms.minors.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                                        <span className="text-sm">Avg. Completion</span>
                                    </div>
                                    <span className="font-medium">
                                        {requirementsProgress.length > 0
                                            ? Math.round(
                                                requirementsProgress.reduce((sum, p) => sum + p.completion_percentage, 0) /
                                                requirementsProgress.length
                                            )
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column - Progress displays */}
                <div className="lg:col-span-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : hasPrograms ? (
                        <div className="space-y-6">
                            {/* Gen Ed Progress */}
                            {genEdProgress && <GenEdProgress progress={genEdProgress} />}

                            {/* Program Requirements */}
                            {requirementsProgress.map((progress) => (
                                <RequirementsProgress key={progress.program.program_id} progress={progress} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Programs Selected
                            </h3>
                            <p className="text-gray-600">
                                Select your majors and minors to start tracking your progress
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RequirementsPage() {
    return (
        <ScheduleProvider>
            <RequirementsProvider>
                <RequirementsContent />
            </RequirementsProvider>
        </ScheduleProvider>
    );
}