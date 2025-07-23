import { CoursePrerequisites } from "@/types/course";
import { ProgramRequirements } from "@/types/program";

// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
};

export const courseApi = {
  getAll: () => api.get('/api/courses'),
  getOne: (courseId: string) => api.get(`/api/courses/${courseId}`),
  searchCourses: (query: string) => api.get(`/api/courses/search?q=${query}&limit=20`),
  getDepartments: () => api.get('/api/departments'),
  getByDepartment: (deptCode: string) => api.get(`/api/departments/${deptCode}/courses`),
  getPrerequisites: (courseId: string) => api.get(`/api/courses/${encodeURIComponent(courseId)}/prerequisites`),
};

export const programApi = {
  getAll: () => api.get('/api/programs'),
  getOne: (programId: string) => api.get(`/api/programs/${programId}`),
  getProgramRequirements: async (programId: string) => api.get(`/api/programs/${programId}/requirements`),
  searchPrograms: (query?: string, type?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type && type !== 'all') params.append('type', type);

    // Only append ? if there are params
    const queryString = params.toString();
    return api.get(`/api/programs${queryString ? `?${queryString}` : ''}`);
  },
  getProgress: (programId: string, completedCourses: string[]) =>
    api.post(`/api/programs/${programId}/progress`, { completed_courses: completedCourses }),
  getByType: (type: string) => api.get(`/api/programs?type=${type}`),
};

export const genEdApi = {
  getProgress: (completedCourses: string[]) =>
    api.post('/api/gen-ed/progress', { completed_courses: completedCourses }),
  getCoursesByGenEd: (genEdCode: string) =>
    api.get(`/api/gen-ed/${genEdCode}/courses`),
};

export const plannerApi = {
  checkPrerequisites: (courseId: string, completedCourses: string[]) =>
    api.post('/api/planner/check-prerequisites', {
      course_id: courseId,
      completed_courses: completedCourses,
    }),
  validateSemester: (semesterCourses: string[], completedCourses: string[]) =>
    api.post('/api/planner/validate-semester', {
      semester_courses: semesterCourses,
      completed_courses: completedCourses,
    }),
};

// Helper function to build query strings
export const buildQueryString = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams.toString();
};