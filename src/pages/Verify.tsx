import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Student, EnrolledCourse } from '@/types/database';
import { CheckCircle2, XCircle, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';

const Verify = () => {
  const { matricNumber } = useParams<{ matricNumber: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyStudent = async () => {
      if (!matricNumber) return;
      
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('matric_number', matricNumber)
        .single();

      if (studentError || !studentData) {
        setIsLoading(false);
        return;
      }

      setStudent(studentData);

      const { data: coursesData } = await supabase
        .from('enrolled_courses')
        .select('*')
        .eq('matric_number', matricNumber);

      if (coursesData) {
        setCourses(coursesData);
      }
      
      setIsLoading(false);
    }
    verifyStudent();
  }, [matricNumber]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Verifying Record...</div>;

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Verification Status Header */}
        <div className={`rounded-3xl p-8 text-center shadow-2xl border-2 backdrop-blur-xl ${student ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex flex-col items-center gap-4">
            {student ? (
              <>
                <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-green-500 uppercase tracking-tighter">Verified Student</h1>
                  <p className="text-green-400/80 font-bold text-xs uppercase tracking-widest">Official Record Authenticated</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <XCircle className="h-12 w-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter">Invalid ID</h1>
                  <p className="text-red-400/80 font-bold text-xs uppercase tracking-widest">No record found in database</p>
                </div>
              </>
            )}
          </div>
        </div>

        {student && (
          <>
            {/* Student Profile Card */}
            <div className="bg-card/50 rounded-3xl p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="h-48 w-40 shrink-0 rounded-2xl overflow-hidden border-4 border-white/5 shadow-2xl bg-slate-800">
                {student.photo_url ? (
                  <img src={student.photo_url} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-700">
                    <ShieldCheck className="h-16 w-16 opacity-20" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left w-full">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-1">Student Identity</p>
                  <h2 className="text-3xl font-black text-foreground leading-tight uppercase tracking-tighter">{student.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Matric Number</p>
                    <p className="font-mono text-primary font-black text-lg">{student.matric_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Level</p>
                    <p className="font-black text-foreground text-lg">{student.level} LEVEL</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">College / Department</p>
                    <p className="font-bold text-foreground/80 uppercase text-sm">{student.college} / {student.department}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Registration Table */}
            <div className="bg-card/50 rounded-3xl p-8 shadow-2xl border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Registered Courses</h3>
              </div>

              <div className="space-y-3">
                {courses.length > 0 ? courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-card shadow-lg flex items-center justify-center text-xs font-black text-muted-foreground group-hover:text-primary transition-colors">
                        {course.course_code.slice(0, 3)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{course.course_code}</p>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{course.course_title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Units</p>
                      <p className="text-lg font-black text-foreground">{course.unit}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground italic font-medium">No registered courses found for current session.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Institutional Footer */}
        <div className="flex items-center justify-center gap-2 pt-8 opacity-50 grayscale">
           <GraduationCap className="h-5 w-5" />
           <p className="text-xs font-bold uppercase tracking-[0.3em]">Mountain Top University</p>
        </div>
      </div>
    </div>
  );
}

export default Verify;
