// types/requirements.ts

export interface Program {
    id: number;
    program_id: string;
    name: string;
    program_type: 'major' | 'minor' | 'certificate';
    degree_type?: string;
    total_hours?: number;
}

export interface ProgramRequirement {
    id: number;
    program_id: number;
    requirement_type: string;
    category_name: string;
    min_credits?: number;
    min_courses?: number;
    selection_notes?: string;
    courses: RequirementCourse[];
}

export interface RequirementCourse {
    course_id: string;
    course_name: string;
    credits: string;
    is_required: boolean;
    is_completed?: boolean;
    is_planned?: boolean;
    grade?: string;
    notes?: string;
}

export interface GenEdRequirement {
    code: string;
    name: string;
    description?: string;
    fulfilled: boolean;
    courses_taken: string[];
    courses_available: string[];
}

export interface StudentPrograms {
    majors: Program[];
    minors: Program[];
    certificates: Program[];
}

export interface RequirementsProgress {
    program: Program;
    total_required_credits: number;
    completed_credits: number;
    planned_credits: number;
    requirements: ProgramRequirement[];
    completion_percentage: number;
}

export interface GenEdProgress {
    requirements: GenEdRequirement[];
    completed_count: number;
    total_count: number;
}