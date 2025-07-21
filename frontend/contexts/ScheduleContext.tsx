// contexts/ScheduleContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Semester, PlannedCourse, Schedule } from '@/types/planner';

interface ScheduleContextType {
  schedule: Schedule;
  addSemester: () => void;
  removeSemester: (semesterId: string) => void;
  addCourse: (semesterId: string, course: PlannedCourse) => void;
  removeCourse: (semesterId: string, courseId: string) => void;
  moveCourse: (fromSemesterId: string, toSemesterId: string, courseId: string) => void;
  getCompletedCourses: (beforeSemesterId?: string) => string[];
  getTotalCredits: (semesterId: string) => number;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedule, setSchedule] = useState<Schedule>({
    id: '1',
    name: 'My Schedule',
    semesters: [
      {
        id: 'fall-2024',
        year: 2024,
        term: 'Fall',
        courses: [],
      },
      {
        id: 'spring-2025',
        year: 2025,
        term: 'Spring',
        courses: [],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const addSemester = useCallback(() => {
    const lastSemester = schedule.semesters[schedule.semesters.length - 1];
    let newYear = lastSemester.year;
    let newTerm: Semester['term'] = 'Fall';

    if (lastSemester.term === 'Fall') {
      newTerm = 'Spring';
      newYear += 1;
    } else if (lastSemester.term === 'Spring') {
      newTerm = 'Summer I';
    } else if (lastSemester.term === 'Summer I') {
      newTerm = 'Summer II';
    } else {
      newTerm = 'Fall';
    }

    const newSemester: Semester = {
      id: `${newTerm.toLowerCase().replace(' ', '-')}-${newYear}`,
      year: newYear,
      term: newTerm,
      courses: [],
    };

    setSchedule((prev) => ({
      ...prev,
      semesters: [...prev.semesters, newSemester],
      updatedAt: new Date(),
    }));
  }, [schedule.semesters]);

  const removeSemester = useCallback((semesterId: string) => {
    setSchedule((prev) => ({
      ...prev,
      semesters: prev.semesters.filter((s) => s.id !== semesterId),
      updatedAt: new Date(),
    }));
  }, []);

  const addCourse = useCallback((semesterId: string, course: PlannedCourse) => {
    setSchedule((prev) => ({
      ...prev,
      semesters: prev.semesters.map((sem) =>
        sem.id === semesterId
          ? { ...sem, courses: [...sem.courses, course] }
          : sem
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const removeCourse = useCallback((semesterId: string, courseId: string) => {
    setSchedule((prev) => ({
      ...prev,
      semesters: prev.semesters.map((sem) =>
        sem.id === semesterId
          ? { ...sem, courses: sem.courses.filter((c) => c.course_id !== courseId) }
          : sem
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const moveCourse = useCallback(
    (fromSemesterId: string, toSemesterId: string, courseId: string) => {
      const fromSemester = schedule.semesters.find((s) => s.id === fromSemesterId);
      const course = fromSemester?.courses.find((c) => c.course_id === courseId);

      if (!course) return;

      setSchedule((prev) => ({
        ...prev,
        semesters: prev.semesters.map((sem) => {
          if (sem.id === fromSemesterId) {
            return { ...sem, courses: sem.courses.filter((c) => c.course_id !== courseId) };
          }
          if (sem.id === toSemesterId) {
            return { ...sem, courses: [...sem.courses, course] };
          }
          return sem;
        }),
        updatedAt: new Date(),
      }));
    },
    [schedule.semesters]
  );

  const getCompletedCourses = useCallback(
    (beforeSemesterId?: string): string[] => {
      const completedCourses: string[] = [];
      
      for (const semester of schedule.semesters) {
        if (beforeSemesterId && semester.id === beforeSemesterId) {
          break;
        }
        completedCourses.push(...semester.courses.map((c) => c.course_id));
      }
      
      return completedCourses;
    },
    [schedule.semesters]
  );

  const getTotalCredits = useCallback((semesterId: string): number => {
    const semester = schedule.semesters.find((s) => s.id === semesterId);
    if (!semester) return 0;

    return semester.courses.reduce((total, course) => {
      const credits = parseInt(course.credits) || 0;
      return total + credits;
    }, 0);
  }, [schedule.semesters]);

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        addSemester,
        removeSemester,
        addCourse,
        removeCourse,
        moveCourse,
        getCompletedCourses,
        getTotalCredits,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};