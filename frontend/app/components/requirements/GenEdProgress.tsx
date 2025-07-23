// app/components/requirements/GenEdProgress.tsx
'use client';

import { GenEdProgress as GenEdProgressType } from '@/types/requirements';
import { CheckCircle, Circle } from 'lucide-react';

interface GenEdProgressProps {
    progress: GenEdProgressType;
}

export function GenEdProgress({ progress }: GenEdProgressProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">General Education Requirements</h3>

            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span>{progress.completed_count}/{progress.total_count} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(progress.completed_count / progress.total_count) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3">
                {progress.requirements.map((req) => (
                    <div key={req.code} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center">
                            {req.fulfilled ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            ) : (
                                <Circle className="w-4 h-4 text-gray-400 mr-2" />
                            )}
                            <div>
                                <div className="font-medium text-sm">{req.code}</div>
                                <div className="text-xs text-gray-600">{req.name}</div>
                            </div>
                        </div>

                        {req.courses_taken.length > 0 && (
                            <div className="text-xs text-green-600">
                                {req.courses_taken.join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}