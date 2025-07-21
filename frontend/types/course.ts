// types/course.ts
export interface Course {
  course_id: string;
  name: string;
  credits: string | null;
  description: string | null;
  department_code: string;
  gen_ed: string[] | null;
  grading_status: string | null;
}

export interface PrerequisiteGroup {
  prereq_group: number;
  is_corequisite: boolean;
  courses: Array<{
    course_id: string;
    name: string;
  }>;
}

export interface CoursePrerequisites {
  course_id: string;
  prerequisite_groups: PrerequisiteGroup[];
  corequisite_groups: PrerequisiteGroup[];
}

export interface Department {
  id: number;
  code: string;
  name: string | null;
  course_count: number;
}

export interface SearchResult extends Course {
  rank?: number;
}