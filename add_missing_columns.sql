-- Add missing columns to admission_students table if they don't exist
-- Run this script in your Supabase SQL editor if you encounter column missing errors

-- Add validation_comment column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS validation_comment TEXT DEFAULT '';

-- Add student_status column  
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS student_status VARCHAR(20) DEFAULT 'en_cours';

-- Add constraint to ensure valid student status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admission_students_student_status_check'
    ) THEN
        ALTER TABLE admission_students 
        ADD CONSTRAINT admission_students_student_status_check 
        CHECK (student_status IN ('inscrit', 'en_cours', 'abandonner'));
    END IF;
END $$;

-- Update any existing records that might have NULL values
UPDATE admission_students 
SET validation_comment = '' 
WHERE validation_comment IS NULL;

UPDATE admission_students 
SET student_status = 'en_cours' 
WHERE student_status IS NULL;