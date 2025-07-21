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

# API Endpoints
## Course Endpoints
@app.get("/")
def read_root():
    return {"message": "UNC Course API", "version": "1.0"}

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

@app.get("/api/courses/search")
def search_courses(q: str, limit: int = 20):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT c.*, d.code as department_code
                FROM courses c
                JOIN departments d ON c.department_id = d.id
                WHERE c.search_vector @@ plainto_tsquery('english', %s)
                ORDER BY ts_rank(c.search_vector, plainto_tsquery('english', %s)) DESC
                LIMIT %s
            """, (q, q, limit))
            
            return cur.fetchall()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)