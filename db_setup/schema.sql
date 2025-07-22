-- UNC Course Planning Database Schema
-- PostgreSQL with pgvector extension for semantic search

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- 'COMP', 'BIOL', etc.
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_id VARCHAR(20) UNIQUE NOT NULL, -- 'COMP 110'
    department_id INTEGER REFERENCES departments(id),
    course_number VARCHAR(10) NOT NULL, -- '110', '101L'
    name TEXT NOT NULL,
    description TEXT,
    credits VARCHAR(10), -- Some are ranges like '3-6'
    grading_status TEXT,
    requisites_note TEXT, -- For "permission of instructor", "may be repeated", etc.
    -- For semantic search
    embedding vector(1536),
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for courses
CREATE INDEX idx_course_id ON courses(course_id);
CREATE INDEX idx_course_dept ON courses(department_id);
CREATE INDEX idx_course_number ON courses(course_number);
CREATE INDEX idx_course_search ON courses USING GIN(search_vector);
CREATE INDEX idx_course_embedding ON courses USING ivfflat (embedding vector_cosine_ops);

-- Update search vector automatically
CREATE OR REPLACE FUNCTION update_course_search_vector()
RETURNS trigger AS $
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.course_id, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_search_vector_trigger
BEFORE INSERT OR UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_course_search_vector();

-- Gen Ed Fulfillments table (NEW)
CREATE TABLE gen_ed_fulfillments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    gen_ed_code VARCHAR(20) NOT NULL, -- 'FY-SEMINAR', 'FC-PAST', etc.
    requirement_group INTEGER DEFAULT 0, -- For AND groups (same group = OR options)
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, gen_ed_code)
);

CREATE INDEX idx_gen_ed_code ON gen_ed_fulfillments(gen_ed_code);
CREATE INDEX idx_gen_ed_course ON gen_ed_fulfillments(course_id);

-- Prerequisites table (many-to-many with grouping)
CREATE TABLE prerequisites (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    prereq_group INTEGER NOT NULL, -- Groups are AND'ed together
    prereq_course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    is_corequisite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, prereq_group, prereq_course_id)
);

-- Grade requirements table
CREATE TABLE grade_requirements (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    required_course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    minimum_grade VARCHAR(5) NOT NULL, -- 'C', 'C+', 'B-', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Programs table (majors, minors, etc.)
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    program_id VARCHAR(100) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    program_type VARCHAR(20) NOT NULL, -- 'major', 'minor', 'certificate'
    degree_type VARCHAR(10), -- 'BA', 'BS', 'BSPH', etc.
    total_hours INTEGER,
    url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Program requirements (flexible structure for various requirement types)
CREATE TABLE program_requirements (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL, -- 'gateway', 'core', 'elective', 'allied_science'
    category_name TEXT,
    min_credits INTEGER,
    min_courses INTEGER,
    max_credits INTEGER,
    selection_notes TEXT,
    level_requirement VARCHAR(50), -- '200+', '300-400', etc.
    other_restrictions TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Program requirement courses (which courses fulfill each requirement)
CREATE TABLE program_requirement_courses (
    id SERIAL PRIMARY KEY,
    requirement_id INTEGER REFERENCES program_requirements(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE, -- TRUE if specifically required, FALSE if it's an option
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(requirement_id, course_id)
);

-- Students table (for future user features)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name TEXT,
    graduation_year INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Student programs (many-to-many)
CREATE TABLE student_programs (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id),
    declared_date DATE DEFAULT CURRENT_DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student course history
CREATE TABLE student_courses (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id),
    semester VARCHAR(20), -- 'Fall 2024'
    grade VARCHAR(5),
    credits_earned INTEGER,
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'enrolled', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester)
);

-- Saved schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    name TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Schedule courses
CREATE TABLE schedule_courses (
    id SERIAL PRIMARY KEY,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id),
    semester VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create views for common queries
CREATE OR REPLACE VIEW course_prerequisites AS
SELECT 
    c.course_id,
    c.name,
    array_agg(
        DISTINCT jsonb_build_object(
            'group', p.prereq_group,
            'course_id', pc.course_id,
            'course_name', pc.name,
            'is_corequisite', p.is_corequisite
        )
    ) AS prerequisites
FROM courses c
LEFT JOIN prerequisites p ON c.id = p.course_id
LEFT JOIN courses pc ON p.prereq_course_id = pc.id
GROUP BY c.id, c.course_id, c.name;

-- View for gen ed courses (NEW)
CREATE OR REPLACE VIEW gen_ed_courses AS
SELECT 
    g.gen_ed_code,
    c.course_id,
    c.name,
    c.credits,
    c.department_id,
    g.requirement_group
FROM gen_ed_fulfillments g
JOIN courses c ON g.course_id = c.id
ORDER BY g.gen_ed_code, g.requirement_group, c.course_id;

-- Function to check if prerequisites are met
CREATE OR REPLACE FUNCTION check_prerequisites_met(
    p_student_id UUID,
    p_course_id INTEGER
) RETURNS BOOLEAN AS $
DECLARE
    prereq_group RECORD;
    group_met BOOLEAN;
BEGIN
    -- Check each prerequisite group (groups are AND'ed)
    FOR prereq_group IN 
        SELECT DISTINCT prereq_group 
        FROM prerequisites 
        WHERE course_id = p_course_id AND NOT is_corequisite
    LOOP
        -- Check if at least one course in the group is completed (OR within group)
        SELECT EXISTS(
            SELECT 1
            FROM prerequisites p
            JOIN student_courses sc ON sc.course_id = p.prereq_course_id
            WHERE p.course_id = p_course_id 
            AND p.prereq_group = prereq_group.prereq_group
            AND sc.student_id = p_student_id
            AND sc.status = 'completed'
            AND sc.grade NOT IN ('F', 'FA', 'AB')
        ) INTO group_met;
        
        IF NOT group_met THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();