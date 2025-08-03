-- Create admission_students table for the Interview Management system
-- This table stores student admission applications submitted by sales users

CREATE TABLE IF NOT EXISTS public.admission_students (
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
    validation VARCHAR(20) DEFAULT 'pending' CHECK (validation IN ('pending', 'accepted', 'rejected')),
    interview_date DATE,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sales_person_id INTEGER NOT NULL,
    
    -- Create indexes for better performance
    CONSTRAINT chk_moyenne_generale CHECK (moyenne_generale IS NULL OR (moyenne_generale >= 0 AND moyenne_generale <= 20)),
    CONSTRAINT chk_maths CHECK (maths IS NULL OR (maths >= 0 AND maths <= 20)),
    CONSTRAINT chk_francais CHECK (francais IS NULL OR (francais >= 0 AND francais <= 20)),
    CONSTRAINT chk_physique CHECK (physique IS NULL OR (physique >= 0 AND physique <= 20))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_sales_person_id ON public.admission_students(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_admission_students_specialite ON public.admission_students(specialite);
CREATE INDEX IF NOT EXISTS idx_admission_students_validation ON public.admission_students(validation);
CREATE INDEX IF NOT EXISTS idx_admission_students_interview_date ON public.admission_students(interview_date);
CREATE INDEX IF NOT EXISTS idx_admission_students_date_created ON public.admission_students(date_created);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admission_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Sales users can only see their own students
CREATE POLICY "Sales users can view their own students" ON public.admission_students
    FOR SELECT USING (sales_person_id = auth.uid()::integer OR auth.role() = 'authenticated');

-- Sales users can insert their own students
CREATE POLICY "Sales users can insert students" ON public.admission_students
    FOR INSERT WITH CHECK (sales_person_id = auth.uid()::integer OR auth.role() = 'authenticated');

-- Sales users can update their own students
CREATE POLICY "Sales users can update their own students" ON public.admission_students
    FOR UPDATE USING (sales_person_id = auth.uid()::integer OR auth.role() = 'authenticated');

-- Sales users can delete their own students
CREATE POLICY "Sales users can delete their own students" ON public.admission_students
    FOR DELETE USING (sales_person_id = auth.uid()::integer OR auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.admission_students TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.admission_students_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.admission_students IS 'Stores student admission applications submitted by sales users';
COMMENT ON COLUMN public.admission_students.id IS 'Unique identifier for each admission record';
COMMENT ON COLUMN public.admission_students.nom IS 'Student last name';
COMMENT ON COLUMN public.admission_students.prenom IS 'Student first name';
COMMENT ON COLUMN public.admission_students.mobile IS 'Student mobile phone number';
COMMENT ON COLUMN public.admission_students.bac_type IS 'Type of baccalaureate (e.g., bac_science, bac_maths)';
COMMENT ON COLUMN public.admission_students.annee_bac IS 'Year of baccalaureate graduation';
COMMENT ON COLUMN public.admission_students.specialite IS 'Desired speciality (LAC, LFC, LINFO, MASTER_MM, MASTER_TD)';
COMMENT ON COLUMN public.admission_students.moyenne_generale IS 'General average grade (0-20)';
COMMENT ON COLUMN public.admission_students.maths IS 'Mathematics grade (0-20)';
COMMENT ON COLUMN public.admission_students.francais IS 'French grade (0-20)';
COMMENT ON COLUMN public.admission_students.physique IS 'Physics grade (0-20)';
COMMENT ON COLUMN public.admission_students.licence_specialite IS 'Previous licence speciality (for MASTER programs)';
COMMENT ON COLUMN public.admission_students.university IS 'Previous university (for MASTER programs)';
COMMENT ON COLUMN public.admission_students.test_required IS 'Whether entrance test is required based on grades';
COMMENT ON COLUMN public.admission_students.test_scores IS 'JSON object containing test scores (maths, logique, francais, cultureGenerale)';
COMMENT ON COLUMN public.admission_students.validation IS 'Admission status: pending, accepted, or rejected';
COMMENT ON COLUMN public.admission_students.interview_date IS 'Scheduled interview date';
COMMENT ON COLUMN public.admission_students.date_created IS 'Timestamp when record was created';
COMMENT ON COLUMN public.admission_students.sales_person_id IS 'ID of the sales person who created this record';