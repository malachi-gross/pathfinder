// lib/api.ts
import axios from 'axios';
import { Course, CoursePrerequisites, Department, SearchResult } from '@/types/course';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const courseApi = {
  // Get a single course
  getCourse: async (courseId: string): Promise<Course> => {
    const { data } = await api.get(`/api/courses/${encodeURIComponent(courseId)}`);
    return data;
  },

  // Get course prerequisites
  getPrerequisites: async (courseId: string): Promise<CoursePrerequisites> => {
    const { data } = await api.get(`/api/courses/${encodeURIComponent(courseId)}/prerequisites`);
    return data;
  },

  // Search courses
  searchCourses: async (query: string, limit: number = 20): Promise<SearchResult[]> => {
    const { data } = await api.get('/api/courses/search', {
      params: { q: query, limit },
    });
    return data;
  },

  // Get all departments
  getDepartments: async (): Promise<Department[]> => {
    const { data } = await api.get('/api/departments');
    return data;
  },

  // Get courses by department
  getDepartmentCourses: async (deptCode: string): Promise<Course[]> => {
    const { data } = await api.get(`/api/departments/${deptCode}/courses`);
    return data;
  },
};

export const programApi = {
  // Get all programs
  getPrograms: async (programType?: string): Promise<Program[]> => {
    const { data } = await api.get('/api/programs', {
      params: programType ? { program_type: programType } : undefined,
    });
    return data;
  },

  // Get a single program
  getProgram: async (programId: string): Promise<Program> => {
    const { data } = await api.get(`/api/programs/${programId}`);
    return data;
  },

  // Get program requirements
  getProgramRequirements: async (programId: string): Promise<ProgramRequirements> => {
    const { data } = await api.get(`/api/programs/${programId}/requirements`);
    return data;
  },
};