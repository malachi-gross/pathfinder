'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Program, RequirementsProgress, GenEdProgress } from '@/types/requirements';
import { useSchedule } from '@/contexts/ScheduleContext';
import { programApi, genEdApi } from '@/lib/api';

interface RequirementsContextType {
    selectedPrograms: {
        majors: Program[];
        minors: Program[];
    };
    addProgram: (program: Program) => boolean;
    removeProgram: (programId: string) => void;
    requirementsProgress: RequirementsProgress[];
    genEdProgress: GenEdProgress | null;
    isLoading: boolean;
    refreshProgress: () => Promise<void>;
}

const RequirementsContext = createContext<RequirementsContextType | undefined>(undefined);

export function RequirementsProvider({ children }: { children: React.ReactNode }) {
    const [selectedPrograms, setSelectedPrograms] = useState<{
        majors: Program[];
        minors: Program[];
    }>({
        majors: [],
        minors: [],
    });

    const [requirementsProgress, setRequirementsProgress] = useState<RequirementsProgress[]>([]);
    const [genEdProgress, setGenEdProgress] = useState<GenEdProgress | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { schedule } = useSchedule();

    // Load saved programs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('selectedPrograms');
        if (saved) {
            setSelectedPrograms(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage whenever programs change
    useEffect(() => {
        localStorage.setItem('selectedPrograms', JSON.stringify(selectedPrograms));
    }, [selectedPrograms]);

    const addProgram = useCallback((program: Program): boolean => {
        const { majors, minors } = selectedPrograms;
        const totalPrograms = majors.length + minors.length;

        if (totalPrograms >= 3) {
            alert('Maximum 3 programs allowed (majors + minors)');
            return false;
        }

        if (program.program_type === 'major' && majors.length >= 2) {
            alert('Maximum 2 majors allowed');
            return false;
        }

        if (program.program_type === 'minor' && minors.length >= 2) {
            alert('Maximum 2 minors allowed');
            return false;
        }

        const allPrograms = [...majors, ...minors];
        if (allPrograms.some(p => p.program_id === program.program_id)) {
            alert('Program already added');
            return false;
        }

        setSelectedPrograms(prev => ({
            ...prev,
            [program.program_type === 'major' ? 'majors' : 'minors']:
                [...prev[program.program_type === 'major' ? 'majors' : 'minors'], program]
        }));

        return true;
    }, [selectedPrograms]);

    const removeProgram = useCallback((programId: string) => {
        setSelectedPrograms(prev => ({
            majors: prev.majors.filter(p => p.program_id !== programId),
            minors: prev.minors.filter(p => p.program_id !== programId),
        }));
    }, []);

    const refreshProgress = useCallback(async () => {
        setIsLoading(true);
        try {
            const allCourses = schedule.semesters.flatMap(sem =>
                sem.courses.map(c => c.course_id)
            );

            const progressPromises = [...selectedPrograms.majors, ...selectedPrograms.minors].map(
                (program) => programApi.getProgress(program.program_id, allCourses)
            );

            const progress = await Promise.all(progressPromises);
            setRequirementsProgress(progress);

            if (allCourses.length > 0) {
                const genEdData = await genEdApi.getProgress(allCourses);
                setGenEdProgress(genEdData);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setIsLoading(false);
        }
    }, [schedule, selectedPrograms]);

    useEffect(() => {
        if (selectedPrograms.majors.length > 0 || selectedPrograms.minors.length > 0) {
            refreshProgress();
        }
    }, [selectedPrograms, schedule, refreshProgress]);

    return (
        <RequirementsContext.Provider
            value={{
                selectedPrograms,
                addProgram,
                removeProgram,
                requirementsProgress,
                genEdProgress,
                isLoading,
                refreshProgress,
            }}
        >
            {children}
        </RequirementsContext.Provider>
    );
}

export const useRequirements = () => {
    const context = useContext(RequirementsContext);
    if (!context) {
        throw new Error('useRequirements must be used within a RequirementsProvider');
    }
    return context;
};
