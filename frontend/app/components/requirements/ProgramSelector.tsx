// app/components/requirements/ProgramSelector.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, X, GraduationCap, BookOpen } from 'lucide-react';
import { Program } from '@/types/requirements';
import { useRequirements } from '@/contexts/RequirementsContext';
import { cn } from '@/lib/utils';
import { programApi } from '@/lib/api';

export function ProgramSelector() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'major' | 'minor'>('all');
    const { selectedPrograms, addProgram, removeProgram } = useRequirements();

    const { data: programs, isLoading } = useQuery({
        queryKey: ['programs', searchQuery, filterType],
        queryFn: async () => {
            return programApi.searchPrograms(searchQuery || undefined, filterType !== 'all' ? filterType : undefined);
        },
    });

    const totalSelected = selectedPrograms.majors.length + selectedPrograms.minors.length;

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Select Your Programs</h2>

            {/* Current selections */}
            <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">
                    Selected: {selectedPrograms.majors.length}/2 majors, {selectedPrograms.minors.length}/2 minors
                </div>

                <div className="space-y-2">
                    {selectedPrograms.majors.map(program => (
                        <div key={program.program_id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div className="flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                                <span className="text-sm font-medium">{program.name}</span>
                                <span className="ml-2 text-xs text-blue-600">Major</span>
                            </div>
                            <button
                                onClick={() => removeProgram(program.program_id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {selectedPrograms.minors.map(program => (
                        <div key={program.program_id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-green-600" />
                                <span className="text-sm font-medium">{program.name}</span>
                                <span className="ml-2 text-xs text-green-600">Minor</span>
                            </div>
                            <button
                                onClick={() => removeProgram(program.program_id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search and filter */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={cn(
                            'px-3 py-1 rounded text-sm',
                            filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('major')}
                        className={cn(
                            'px-3 py-1 rounded text-sm',
                            filterType === 'major' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        )}
                    >
                        Majors
                    </button>
                    <button
                        onClick={() => setFilterType('minor')}
                        className={cn(
                            'px-3 py-1 rounded text-sm',
                            filterType === 'minor' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        )}
                    >
                        Minors
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search programs..."
                        className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Results */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                {programs?.map((program: Program) => {
                    const isSelected = [...selectedPrograms.majors, ...selectedPrograms.minors]
                        .some(p => p.program_id === program.program_id);

                    return (
                        <div
                            key={program.program_id}
                            className={cn(
                                'flex items-center justify-between p-3 rounded border',
                                isSelected && 'opacity-50'
                            )}
                        >
                            <div>
                                <div className="font-medium text-sm">{program.name}</div>
                                <div className="text-xs text-gray-500">
                                    {program.program_type} • {program.total_hours} credits
                                </div>
                            </div>
                            <button
                                onClick={() => addProgram(program)}
                                disabled={isSelected || totalSelected >= 3}
                                className={cn(
                                    'p-2 rounded',
                                    isSelected || totalSelected >= 3
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}