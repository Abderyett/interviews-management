-- Simple script to create admission_students table
-- Copy and paste this EXACTLY in Supabase SQL Editor

CREATE TABLE admission_students (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    mobile TEXT NOT NULL,
    bac_type TEXT NOT NULL,
    annee_bac TEXT NOT NULL,
    specialite TEXT NOT NULL,
    moyenne_generale DECIMAL(4,2),
    maths DECIMAL(4,2),
    francais DECIMAL(4,2),
    physique DECIMAL(4,2),
    licence_specialite TEXT,
    university TEXT,
    test_required BOOLEAN DEFAULT false,
    test_scores JSON,
    validation TEXT DEFAULT 'pending',
    interview_date DATE,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sales_person_id INTEGER NOT NULL,
    student_registry_id TEXT
);

-- Give full access (we'll secure it later)
ALTER TABLE admission_students ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations" ON admission_students FOR ALL USING (true) WITH CHECK (true);

-- Test insert
INSERT INTO admission_students (nom, prenom, mobile, bac_type, annee_bac, specialite, sales_person_id) 
VALUES ('Test', 'User', '123456789', 'bac_science', '2024', 'LAC', 1);

-- Verify table exists and has data
SELECT * FROM admission_students;