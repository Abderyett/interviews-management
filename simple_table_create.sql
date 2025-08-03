-- Simple table creation without RLS complications
-- Copy and paste this in Supabase SQL Editor

-- Drop table if it exists with issues
DROP TABLE IF EXISTS public.admission_students;

-- Create the table
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
    student_registry_id VARCHAR(255)
);

-- Create basic indexes
CREATE INDEX idx_admission_students_sales_person_id ON public.admission_students(sales_person_id);
CREATE INDEX idx_admission_students_specialite ON public.admission_students(specialite);

-- Disable RLS for now (we'll enable it later once everything works)
ALTER TABLE public.admission_students DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles (for testing)
GRANT ALL ON public.admission_students TO anon;
GRANT ALL ON public.admission_students TO authenticated;
GRANT ALL ON public.admission_students TO service_role;

-- Grant sequence permissions
GRANT ALL ON SEQUENCE public.admission_students_id_seq TO anon;
GRANT ALL ON SEQUENCE public.admission_students_id_seq TO authenticated;  
GRANT ALL ON SEQUENCE public.admission_students_id_seq TO service_role;

-- Test insert
INSERT INTO public.admission_students (
    nom, prenom, mobile, bac_type, annee_bac, specialite, 
    moyenne_generale, maths, francais, test_required, 
    validation, sales_person_id
) VALUES (
    'Test', 'Student', '0123456789', 'bac_science', '2024', 'LAC',
    15.5, 16.0, 15.0, false,
    'pending', 1
);

-- Verify everything works
SELECT COUNT(*) as total_records FROM public.admission_students;
SELECT * FROM public.admission_students LIMIT 5;