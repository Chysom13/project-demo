export interface Student {
  id: string;
  created_at: string;
  name: string;
  matric_number: string;
  department: string;
  level: string;
  college: string;
  photo_url: string | null;
  has_printed: boolean;
  last_printed_level: string | null;
  password: string | null;
}

export interface Course {
  id: string;
  course_code: string;
  course_title: string;
  unit: number;
}

export interface EnrolledCourse {
  id: string;
  matric_number: string;
  student_name: string;
  department: string;
  course_code: string;
  course_title: string;
  unit: number;
  enrolled_at: string;
}

export interface IDReplacement {
  id: string;
  created_at: string;
  student_id: string;
  name: string;
  fee_paid: boolean;
  requested_at: string;
  expires_at: string;
}

