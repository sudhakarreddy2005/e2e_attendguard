import { apiClient } from './api';
import { Student, StudentAnalytics } from '../types/student';

export const studentService = {
  getStudents: async (): Promise<Student[]> => {
    const res = await apiClient.get('/api/students/');
    return res.data;
  },

  getStudentImage: (rollNo: string): string => {
    return `/api/students/${rollNo}/image`;
  },

  getStudentAnalytics: async (rollNo: string, semester?: string): Promise<StudentAnalytics> => {
    const url = `/api/students/${rollNo}/analytics${semester ? `?semester=${encodeURIComponent(semester)}` : ''}`;
    const res = await apiClient.get(url);
    return res.data.data;
  },

  registerStudent: async (formData: FormData): Promise<any> => {
    const res = await apiClient.post('/api/students/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  searchStudents: async (query: string): Promise<Student[]> => {
    const res = await apiClient.get(`/api/search/?q=${encodeURIComponent(query)}`);
    return res.data.data?.students || [];
  },

  deleteStudent: async (rollNo: string): Promise<any> => {
    const res = await apiClient.delete(`/api/students/${rollNo}`);
    return res.data;
  },

  updateStudent: async (rollNo: string, payload: Partial<Student> & { phone?: string; email?: string }): Promise<any> => {
    const res = await apiClient.put(`/api/students/${rollNo}`, payload);
    return res.data;
  },

  importStudents: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getImportTemplateUrl: (): string => {
    return '/api/students/import-template';
  },
};
