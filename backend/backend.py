import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

app = FastAPI(title="UNC Course API")

# Add CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    url = urlparse(database_url)
    print(f"Connecting to database at {url.hostname}:{url.port}/{url.path[1:]} as user {url.username}")
    conn_params = {
        "host": url.hostname,
        "port": url.port,
        "database": url.path[1:],
        "user": url.username,
        "password": url.password,
        "sslmode": "require",
        "gssencmode": "disable"
    }
    
    return psycopg2.connect(**conn_params)

# Pydantic models
class Course(BaseModel):
    course_id: str
    name: str
    credits: Optional[str]
    description: Optional[str]
    department_code: str

class PrerequisiteGroup(BaseModel):
    group: int
    courses: List[dict]
    is_corequisite: bool

class Program(BaseModel):
    program_id: str
    name: str
    program_type: str
    degree_type: Optional[str]
    total_hours: Optional[int]
    url: Optional[str]

class ProgramRequirement(BaseModel):
    id: int
    requirement_type: str
    category_name: Optional[str]
    min_credits: Optional[int]
    min_courses: Optional[int]
    selection_notes: Optional[str]
    level_requirement: Optional[str]
    other_restrictions: Optional[str]
    courses: Optional[List[dict]]

class PrerequisiteCheckRequest(BaseModel):
    course_id: str
    completed_courses: List[str]

class PrerequisiteCheckResponse(BaseModel):
    course_id: str
    can_take: bool
    missing_prerequisites: List[str]
    warnings: List[str]

# API Endpoints
## Course Endpoints
@app.get("/")
def read_root():
    return {"message": "UNC Course API", "version": "1.0"}

@app.get("/api/courses/search")
def search_courses(q: str, limit: int = 20):
    if not q or len(q) < 1:
        return []
    
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Use the full-text search that we know works
            cur.execute("""
                SELECT c.*, d.code as department_code
                FROM courses c
                JOIN departments d ON c.department_id = d.id
                WHERE c.search_vector @@ plainto_tsquery('english', %s)
                ORDER BY ts_rank(c.search_vector, plainto_tsquery('english', %s)) DESC
                LIMIT %s
            """, (q, q, limit))
            
            results = cur.fetchall()
            
            # If no results with full-text, try simple ILIKE as fallback
            if not results:
                search_pattern = f"%{q}%"
                cur.execute("""
                    SELECT c.*, d.code as department_code
                    FROM courses c
                    JOIN departments d ON c.department_id = d.id
                    WHERE 
                        c.course_id ILIKE %s OR 
                        c.name ILIKE %s OR 
                        d.code ILIKE %s
                    ORDER BY c.course_id
                    LIMIT %s
                """, (search_pattern, search_pattern, search_pattern, limit))
                
                results = cur.fetchall()
            
            return results if results else []

@app.get("/api/courses/{course_id}", response_model=Course)
def get_course(course_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT c.*, d.code as department_code
                FROM courses c
                JOIN departments d ON c.department_id = d.id
                WHERE c.course_id = %s
            """, (course_id,))
            
            course = cur.fetchone()
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            
            return course

@app.get("/api/courses/{course_id}/prerequisites")
def get_prerequisites(course_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get course ID
            cur.execute("SELECT id FROM courses WHERE course_id = %s", (course_id,))
            course = cur.fetchone()
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            
            # Get prerequisites
            cur.execute("""
                SELECT 
                    p.prereq_group,
                    p.is_corequisite,
                    json_agg(
                        json_build_object(
                            'course_id', pc.course_id,
                            'name', pc.name
                        )
                    ) as courses
                FROM prerequisites p
                JOIN courses pc ON p.prereq_course_id = pc.id
                WHERE p.course_id = %s
                GROUP BY p.prereq_group, p.is_corequisite
                ORDER BY p.prereq_group
            """, (course['id'],))
            
            groups = cur.fetchall()
            
            return {
                "course_id": course_id,
                "prerequisite_groups": [g for g in groups if not g['is_corequisite']],
                "corequisite_groups": [g for g in groups if g['is_corequisite']]
            }

@app.get("/api/departments")
def get_departments():
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT d.*, COUNT(c.id) as course_count
                FROM departments d
                LEFT JOIN courses c ON d.id = c.department_id
                GROUP BY d.id
                ORDER BY d.code
            """)
            
            return cur.fetchall()

@app.get("/api/departments/{dept_code}/courses")
def get_department_courses(dept_code: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT c.*, d.code as department_code
                FROM courses c
                JOIN departments d ON c.department_id = d.id
                WHERE d.code = %s
                ORDER BY c.course_number
            """, (dept_code.upper(),))
            
            courses = cur.fetchall()
            if not courses:
                raise HTTPException(status_code=404, detail=f"No courses found for department {dept_code}")
            
            return courses

## Program Endpoints
@app.get("/api/programs")
def get_programs(program_type: Optional[str] = None):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT * FROM programs
                WHERE 1=1
            """
            params = []
            
            if program_type:
                query += " AND program_type = %s"
                params.append(program_type)
            
            query += " ORDER BY name"
            
            cur.execute(query, params)
            return cur.fetchall()

@app.get("/api/programs/{program_id}")
def get_program(program_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get program details
            cur.execute("""
                SELECT * FROM programs WHERE program_id = %s
            """, (program_id,))
            
            program = cur.fetchone()
            if not program:
                raise HTTPException(status_code=404, detail="Program not found")
            
            return program

@app.get("/api/programs/{program_id}/requirements")
def get_program_requirements(program_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get program ID
            cur.execute("SELECT id FROM programs WHERE program_id = %s", (program_id,))
            program = cur.fetchone()
            if not program:
                raise HTTPException(status_code=404, detail="Program not found")
            
            # Get requirements with courses
            cur.execute("""
                SELECT 
                    pr.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'course_id', c.course_id,
                                'name', c.name,
                                'credits', c.credits,
                                'is_required', prc.is_required
                            ) ORDER BY c.course_id
                        ) FILTER (WHERE c.id IS NOT NULL),
                        '[]'::json
                    ) as courses
                FROM program_requirements pr
                LEFT JOIN program_requirement_courses prc ON pr.id = prc.requirement_id
                LEFT JOIN courses c ON prc.course_id = c.id
                WHERE pr.program_id = %s
                GROUP BY pr.id
                ORDER BY pr.display_order, pr.requirement_type
            """, (program['id'],))
            
            requirements = cur.fetchall()
            
            # Group by requirement type
            grouped = {}
            for req in requirements:
                req_type = req['requirement_type']
                if req_type not in grouped:
                    grouped[req_type] = []
                grouped[req_type].append(req)
            
            return {
                "program_id": program_id,
                "requirements_by_type": grouped,
                "all_requirements": requirements
            }

## Planning Endpoints
@app.post("/api/planner/check-prerequisites", response_model=PrerequisiteCheckResponse)
def check_prerequisites(request: PrerequisiteCheckRequest):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get course ID from database
            cur.execute("SELECT id FROM courses WHERE course_id = %s", (request.course_id,))
            course = cur.fetchone()
            
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            
            # Get prerequisites for the course
            cur.execute("""
                SELECT 
                    p.prereq_group,
                    array_agg(pc.course_id) as required_courses
                FROM prerequisites p
                JOIN courses pc ON p.prereq_course_id = pc.id
                WHERE p.course_id = %s AND NOT p.is_corequisite
                GROUP BY p.prereq_group
                ORDER BY p.prereq_group
            """, (course['id'],))
            
            prereq_groups = cur.fetchall()
            
            # Check if prerequisites are met
            can_take = True
            missing_prerequisites = []
            warnings = []
            
            # For each AND group
            for group in prereq_groups:
                # Check if at least one course in the OR group is completed
                group_satisfied = False
                for req_course in group['required_courses']:
                    if req_course in request.completed_courses:
                        group_satisfied = True
                        break
                
                if not group_satisfied:
                    can_take = False
                    missing_prerequisites.extend(group['required_courses'])
            
            # Remove duplicates from missing prerequisites
            missing_prerequisites = list(set(missing_prerequisites))
            
            # Add warnings for edge cases
            if not prereq_groups:
                warnings.append("No prerequisites found for this course")
            
            return PrerequisiteCheckResponse(
                course_id=request.course_id,
                can_take=can_take,
                missing_prerequisites=missing_prerequisites,
                warnings=warnings
            )

@app.post("/api/planner/validate-semester")
def validate_semester(semester_courses: List[str], completed_courses: List[str]):
    """Validate all courses in a semester for prerequisites and corequisites"""
    validation_results = []
    
    for course_id in semester_courses:
        # Check prerequisites (excluding courses in the same semester)
        prereq_check = check_prerequisites(
            PrerequisiteCheckRequest(
                course_id=course_id,
                completed_courses=completed_courses
            )
        )
        
        validation_results.append({
            "course_id": course_id,
            "valid": prereq_check.can_take,
            "issues": prereq_check.missing_prerequisites,
            "warnings": prereq_check.warnings
        })
    
    return {
        "semester_valid": all(r["valid"] for r in validation_results),
        "course_validations": validation_results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)