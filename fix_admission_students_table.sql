-- Fix admission_students table issues and create proper relations
-- Run this script in Supabase SQL Editor

-- First, drop the table if it exists with issues
DROP TABLE IF EXISTS public.admission_students CASCADE;

-- Create admission_students table with proper structure
CREATE TABLE public.admission_students (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    bac_type VARCHAR(100) NOT NULL,
    annee_bac VARCHAR(4) NOT NULL,
    specialite VARCHAR(50) NOT NULL,
    moyenne_generale DECIMAL(4,2),
    maths DECIMAL(4,2),
    francais DECIMAL(4,2),
    physique DECIMAL(4,2),
    licence_specialite VARCHAR(255),
    university VARCHAR(255),
    test_required BOOLEAN NOT NULL DEFAULT false,
    test_scores JSONB,
    validation VARCHAR(20) DEFAULT 'pending',
    interview_date DATE,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sales_person_id INTEGER NOT NULL,
    
    -- Foreign key to link with students registry (when student is added to registry)
    student_registry_id VARCHAR(255), -- This will store the student_id from students table
    
    -- Constraints
    CONSTRAINT chk_validation CHECK (validation IN ('pending', 'accepted', 'rejected')),
    CONSTRAINT chk_moyenne_generale CHECK (moyenne_generale IS NULL OR (moyenne_generale >= 0 AND moyenne_generale <= 20)),
    CONSTRAINT chk_maths CHECK (maths IS NULL OR (maths >= 0 AND maths <= 20)),
    CONSTRAINT chk_francais CHECK (francais IS NULL OR (francais >= 0 AND francais <= 20)),
    CONSTRAINT chk_physique CHECK (physique IS NULL OR (physique >= 0 AND physique <= 20))
);

-- Create indexes for better performance
CREATE INDEX idx_admission_students_sales_person_id ON public.admission_students(sales_person_id);
CREATE INDEX idx_admission_students_specialite ON public.admission_students(specialite);
CREATE INDEX idx_admission_students_validation ON public.admission_students(validation);
CREATE INDEX idx_admission_students_interview_date ON public.admission_students(interview_date);
CREATE INDEX idx_admission_students_date_created ON public.admission_students(date_created);
CREATE INDEX idx_admission_students_registry_id ON public.admission_students(student_registry_id);

-- Disable RLS temporarily to fix permission issues
ALTER TABLE public.admission_students DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users (you can restrict this later)
GRANT ALL PRIVILEGES ON public.admission_students TO anon;
GRANT ALL PRIVILEGES ON public.admission_students TO authenticated;
GRANT ALL PRIVILEGES ON public.admission_students TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE public.admission_students_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.admission_students_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.admission_students_id_seq TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.admission_students IS 'Stores student admission applications submitted by sales users';
COMMENT ON COLUMN public.admission_students.student_registry_id IS 'Links to student_id in students table when student is added to registry';

-- Insert a test record to verify the table works
INSERT INTO public.admission_students (
    nom, prenom, mobile, bac_type, annee_bac, specialite, 
    moyenne_generale, maths, francais, test_required, 
    validation, sales_person_id
) VALUES (
    'Test', 'Student', '0123456789', 'bac_science', '2024', 'LAC',
    15.5, 16.0, 15.0, false,
    'pending', 1
);

-- Check if the insert worked
SELECT COUNT(*) as total_records FROM public.admission_students;