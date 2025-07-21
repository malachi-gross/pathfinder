// types/planner.ts
export interface Semester {
  id: string;
  year: number;
  term: 'Fall' | 'Spring' | 'Summer I' | 'Summer II';
  courses: PlannedCourse[];
}

export interface PlannedCourse {
  course_id: string;
  name: string;
  credits: string;
  department_code: string;
  prereqsMet?: boolean;
  warnings?: string[];
}

export interface Schedule {
  id: string;
  name: string;
  semesters: Semester[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PrerequisiteCheck {
  course_id: string;
  canTake: boolean;
  missingPrereqs: string[];
  warnings: string[];
}