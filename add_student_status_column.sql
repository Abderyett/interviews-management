-- Add student_status column to admission_students table
-- This column will store the enrollment status of students (inscrit, en_cours, abandonner)

-- Add the student_status column
ALTER TABLE public.admission_students 
ADD COLUMN IF NOT EXISTS student_status VARCHAR(20) DEFAULT 'en_cours' CHECK (student_status IN ('inscrit', 'en_cours', 'abandonner'));

-- Add comment for documentation
COMMENT ON COLUMN public.admission_students.student_status IS 'Student enrollment status: inscrit (enrolled), en_cours (in progress), abandonner (dropped)';

-- Create index for better query performance on student status
CREATE INDEX IF NOT EXISTS idx_admission_students_student_status 
ON public.admission_students(student_status);

-- Update existing records to have default status 'en_cours'
UPDATE public.admission_students 
SET student_status = 'en_cours' 
WHERE student_status IS NULL;

-- Add constraint to ensure only valid status values
ALTER TABLE public.admission_students 
ADD CONSTRAINT chk_student_status CHECK (student_status IN ('inscrit', 'en_cours', 'abandonner'));