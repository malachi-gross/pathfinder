export interface Program {
  id: number;
  program_id: string;
  name: string;
  program_type: 'major' | 'minor' | 'certificate';
  degree_type: string | null;
  total_hours: number | null;
  url: string | null;
}

export interface ProgramRequirement {
  id: number;
  requirement_type: 'gateway' | 'core' | 'elective' | 'allied_science';
  category_name: string | null;
  min_credits: number | null;
  min_courses: number | null;
  selection_notes: string | null;
  level_requirement: string | null;
  other_restrictions: string | null;
  courses: Array<{
    course_id: string;
    name: string;
    credits: string | null;
    is_required: boolean;
  }>;
}

export interface ProgramRequirements {
  program_id: string;
  requirements_by_type: {
    [key: string]: ProgramRequirement[];
  };
  all_requirements: ProgramRequirement[];
}
