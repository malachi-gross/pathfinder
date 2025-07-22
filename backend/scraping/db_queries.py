import psycopg2
from urllib.parse import urlparse
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import json

load_dotenv()

class CourseDatabase:
    def __init__(self, db_url: str = None):
        """Initialize database connection."""
        self.db_url = os.getenv('DATABASE_URL')

        if not self.db_url:
            raise ValueError("Database URL must be provided via db_url param or DATABASE_URL env var")

        url = urlparse(self.db_url)
        
        conn_params = {
            "host": url.hostname,
            "port": url.port,
            "database": url.path[1:],
            "user": url.username,
            "password": url.password,
            "sslmode": "require",
            "gssencmode": "disable"
        }
        
        self.conn = psycopg2.connect(**conn_params)
        self.cur = self.conn.cursor(cursor_factory=RealDictCursor)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cur.close()
        self.conn.close()
    
    # Course queries
    def get_course(self, course_id: str) -> Optional[Dict]:
        """Get a single course by ID (e.g., 'COMP 110')."""
        self.cur.execute("""
            SELECT c.*, d.code as department_code
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            WHERE c.course_id = %s
        """, (course_id,))
        return self.cur.fetchone()
    
    def search_courses(self, query: str, limit: int = 20) -> List[Dict]:
        """Full-text search for courses."""
        self.cur.execute("""
            SELECT c.*, d.code as department_code,
                   ts_rank(c.search_vector, plainto_tsquery('english', %s)) AS rank
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            WHERE c.search_vector @@ plainto_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
        """, (query, query, limit))
        return self.cur.fetchall()
    
    def get_department_courses(self, dept_code: str) -> List[Dict]:
        """Get all courses for a department."""
        self.cur.execute("""
            SELECT c.*, d.code as department_code
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            WHERE d.code = %s
            ORDER BY c.course_number
        """, (dept_code,))
        return self.cur.fetchall()
    
    def get_course_prerequisites(self, course_id: str) -> Dict:
        """Get prerequisites for a course with proper grouping."""
        # Get the course
        self.cur.execute("SELECT id FROM courses WHERE course_id = %s", (course_id,))
        course = self.cur.fetchone()
        if not course:
            return None
        
        # Get prerequisites grouped properly
        self.cur.execute("""
            SELECT 
                p.prereq_group,
                p.is_corequisite,
                array_agg(
                    json_build_object(
                        'course_id', pc.course_id,
                        'course_name', pc.name,
                        'credits', pc.credits
                    )
                ) as options
            FROM prerequisites p
            JOIN courses pc ON p.prereq_course_id = pc.id
            WHERE p.course_id = %s
            GROUP BY p.prereq_group, p.is_corequisite
            ORDER BY p.prereq_group
        """, (course['id'],))
        
        prereq_groups = self.cur.fetchall()
        
        # Get grade requirements
        self.cur.execute("""
            SELECT rc.course_id, gr.minimum_grade
            FROM grade_requirements gr
            JOIN courses rc ON gr.required_course_id = rc.id
            WHERE gr.course_id = %s
        """, (course['id'],))
        
        grade_reqs = {row['course_id']: row['minimum_grade'] for row in self.cur.fetchall()}
        
        # Format results
        prerequisites = []
        corequisites = []
        
        for group in prereq_groups:
            if group['is_corequisite']:
                corequisites.append(group['options'])
            else:
                prerequisites.append(group['options'])
        
        return {
            'prerequisites': prerequisites,
            'corequisites': corequisites,
            'grade_requirements': grade_reqs
        }
    
    def check_prerequisites_met(self, student_id: str, course_id: str) -> Dict:
        """Check if a student has met prerequisites for a course."""
        self.cur.execute("""
            SELECT check_prerequisites_met(%s, 
                (SELECT id FROM courses WHERE course_id = %s))
        """, (student_id, course_id))
        
        result = self.cur.fetchone()
        return {'prerequisites_met': result['check_prerequisites_met']}
    
    # Program queries
    def get_program(self, program_id: str) -> Optional[Dict]:
        """Get a program by ID."""
        self.cur.execute("""
            SELECT * FROM programs WHERE program_id = %s
        """, (program_id,))
        return self.cur.fetchone()
    
    def get_program_requirements(self, program_id: str) -> List[Dict]:
        """Get all requirements for a program."""
        self.cur.execute("""
            SELECT 
                pr.*,
                array_agg(
                    json_build_object(
                        'course_id', c.course_id,
                        'course_name', c.name,
                        'credits', c.credits,
                        'is_required', prc.is_required
                    ) ORDER BY c.course_id
                ) FILTER (WHERE c.id IS NOT NULL) as courses
            FROM program_requirements pr
            JOIN programs p ON pr.program_id = p.id
            LEFT JOIN program_requirement_courses prc ON pr.id = prc.requirement_id
            LEFT JOIN courses c ON prc.course_id = c.id
            WHERE p.program_id = %s
            GROUP BY pr.id
            ORDER BY pr.display_order, pr.requirement_type
        """, (program_id,))
        return self.cur.fetchall()
    
    def search_programs(self, query: str) -> List[Dict]:
        """Search for programs by name."""
        self.cur.execute("""
            SELECT * FROM programs
            WHERE name ILIKE %s
            ORDER BY name
        """, (f'%{query}%',))
        return self.cur.fetchall()
    
    # Analysis queries
    def get_database_stats(self) -> Dict:
        """Get statistics about the database."""
        stats = {}
        
        # Count courses
        self.cur.execute("SELECT COUNT(*) as count FROM courses")
        stats['total_courses'] = self.cur.fetchone()['count']
        
        # Count departments
        self.cur.execute("SELECT COUNT(*) as count FROM departments")
        stats['total_departments'] = self.cur.fetchone()['count']
        
        # Count programs
        self.cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN program_type = 'major' THEN 1 END) as majors,
                COUNT(CASE WHEN program_type = 'minor' THEN 1 END) as minors
            FROM programs
        """)
        program_stats = self.cur.fetchone()
        stats.update(program_stats)
        
        # Prerequisites stats
        self.cur.execute("""
            SELECT 
                COUNT(DISTINCT course_id) as courses_with_prereqs,
                COUNT(*) as total_prereq_relationships
            FROM prerequisites
        """)
        prereq_stats = self.cur.fetchone()
        stats.update(prereq_stats)
        
        # Top departments by course count
        self.cur.execute("""
            SELECT d.code, COUNT(c.id) as course_count
            FROM departments d
            LEFT JOIN courses c ON d.id = c.department_id
            GROUP BY d.id, d.code
            ORDER BY course_count DESC
            LIMIT 10
        """)
        stats['top_departments'] = self.cur.fetchall()
        
        return stats
    
    def get_course_graph_data(self, course_id: str, depth: int = 2) -> Dict:
        """Get prerequisite graph data for visualization."""
        # Recursive CTE to get prerequisite tree
        self.cur.execute("""
            WITH RECURSIVE prereq_tree AS (
                -- Base case: the target course
                SELECT 
                    c.id, c.course_id, c.name, 0 as depth
                FROM courses c
                WHERE c.course_id = %s
                
                UNION ALL
                
                -- Recursive case: prerequisites of courses in the tree
                SELECT 
                    c.id, c.course_id, c.name, pt.depth + 1
                FROM prereq_tree pt
                JOIN prerequisites p ON pt.id = p.course_id
                JOIN courses c ON p.prereq_course_id = c.id
                WHERE pt.depth < %s
            )
            SELECT DISTINCT * FROM prereq_tree;
        """, (course_id, depth))
        
        nodes = self.cur.fetchall()
        
        # Get edges (prerequisite relationships)
        node_ids = [n['id'] for n in nodes]
        self.cur.execute("""
            SELECT 
                c1.course_id as source,
                c2.course_id as target,
                p.prereq_group,
                p.is_corequisite
            FROM prerequisites p
            JOIN courses c1 ON p.course_id = c1.id
            JOIN courses c2 ON p.prereq_course_id = c2.id
            WHERE p.course_id = ANY(%s) AND p.prereq_course_id = ANY(%s)
        """, (node_ids, node_ids))
        
        edges = self.cur.fetchall()
        
        return {
            'nodes': nodes,
            'edges': edges
        }
    
    # Utility functions
    def find_course_paths(self, start_course: str, end_course: str, max_depth: int = 5) -> List[List[str]]:
        """Find possible paths from one course to another through prerequisites."""
        # This would use a graph algorithm to find paths
        # Simplified version here
        self.cur.execute("""
            WITH RECURSIVE course_paths AS (
                -- Start with the end course
                SELECT 
                    c.id,
                    c.course_id,
                    ARRAY[c.course_id] as path,
                    0 as depth
                FROM courses c
                WHERE c.course_id = %s
                
                UNION ALL
                
                -- Find courses that have current course as prerequisite
                SELECT 
                    c.id,
                    c.course_id,
                    cp.path || c.course_id,
                    cp.depth + 1
                FROM course_paths cp
                JOIN prerequisites p ON cp.id = p.prereq_course_id
                JOIN courses c ON p.course_id = c.id
                WHERE 
                    cp.depth < %s
                    AND c.course_id != ALL(cp.path)  -- Avoid cycles
            )
            SELECT path 
            FROM course_paths 
            WHERE course_id = %s
        """, (end_course, max_depth, start_course))
        
        paths = [row['path'] for row in self.cur.fetchall()]
        return paths

# Example usage and verification script
def verify_scraping():
    """Verify the migration was successful."""
    with CourseDatabase() as db:
        print("🔍 Database Statistics:")
        stats = db.get_database_stats()
        print(f"   Total courses: {stats['total_courses']}")
        print(f"   Total departments: {stats['total_departments']}")
        print(f"   Total programs: {stats['total']} ({stats['majors']} majors, {stats['minors']} minors)")
        print(f"   Courses with prerequisites: {stats['courses_with_prereqs']}")
        print(f"   Total prerequisite relationships: {stats['total_prereq_relationships']}")
        
        print("\n📊 Top departments by course count:")
        for dept in stats['top_departments']:
            print(f"   {dept['code']}: {dept['course_count']} courses")
        
        # Test specific queries
        print("\n🧪 Testing queries:")
        
        # Test course lookup
        course = db.get_course('COMP 110')
        if course:
            print(f"   ✓ Found course: {course['course_id']} - {course['name']}")
        
        # Test prerequisite lookup
        prereqs = db.get_course_prerequisites('COMP 211')
        if prereqs:
            print(f"   ✓ Found prerequisites for COMP 211: {len(prereqs['prerequisites'])} groups")
        
        # Test search
        results = db.search_courses('data structures')
        print(f"   ✓ Search for 'data structures' returned {len(results)} results")
        
        # Test program lookup
        program = db.get_program('computer-science-major-bs')
        if program:
            print(f"   ✓ Found program: {program['name']}")
            requirements = db.get_program_requirements(program['program_id'])
            print(f"     Has {len(requirements)} requirement categories")

if __name__ == "__main__":
    verify_scraping()