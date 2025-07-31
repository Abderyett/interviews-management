// Type definitions for Interview Management System

export interface Student {
  studentId: string;
  name: string;
}

export interface QueueEntry extends Student {
  queueNumber: number;
  arrivalTime: Date;
  status: 'waiting' | 'in-progress' | 'completed';
  assignedRoom: string | null;
}

export interface CompletedInterview extends Student {
  queueNumber: number;
  completedTime: Date;
  interviewDuration: number; // in minutes
  professorName: string;
  room: string;
}

export interface Professor {
  id: number;
  name: string;
  room: string;
  floor: string;
  status: 'available' | 'busy' | 'unavailable';
  currentStudent: QueueEntry | null;
  interviewStartTime: Date | null;
}

export interface DateData {
  registeredStudents: Student[];
  waitingQueue: QueueEntry[];
  completedInterviews: CompletedInterview[];
  currentNumber: number;
  professors: Professor[];
}

export interface DateDataState {
  [date: string]: DateData;
}

export interface DeleteModalState {
  show: boolean;
  student: Student | null;
}

export interface DatabaseStudent {
  id: string;
  student_id: string;
  name: string;
  interview_date: string;
  created_at: string;
}

export interface DatabaseQueueEntry {
  id: string;
  student_id: string;
  name: string;
  queue_number: number;
  arrival_time: string;
  status: string;
  assigned_room: string | null;
  interview_date: string;
  created_at: string;
}

export interface DatabaseCompletedInterview {
  id: string;
  student_id: string;
  name: string;
  queue_number: number;
  completed_time: string;
  interview_duration: number;
  professor_name: string;
  room: string;
  interview_date: string;
  created_at: string;
}

export interface DatabaseProfessorStatus {
  id: string;
  professor_id: number;
  name: string;
  room: string;
  floor: string;
  status: string;
  current_student_id: string | null;
  current_student_name: string | null;
  interview_start_time: string | null;
  date: string;
  created_at: string;
}

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success';
export type ButtonSize = 'default' | 'sm' | 'lg';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';