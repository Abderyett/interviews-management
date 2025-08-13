-- Migration script to add missing columns to admission_students table
-- Run this in Supabase SQL Editor to add test and interview management columns

-- Add test management columns
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS test_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS test_status TEXT DEFAULT 'not_started' CHECK (test_status IN ('not_started', 'in_progress', 'completed', 'absent')),
ADD COLUMN IF NOT EXISTS test_duration INTEGER; -- duration in minutes

-- Add interview management columns
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_status TEXT DEFAULT 'not_registered' CHECK (interview_status IN ('not_registered', 'in_queue', 'interviewing', 'completed')),
ADD COLUMN IF NOT EXISTS interview_queue_number INTEGER,
ADD COLUMN IF NOT EXISTS interview_completed_time TIMESTAMPTZ;

-- Add student registry connection
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS student_registry_id TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admission_students_interview_status ON admission_students(interview_status);
CREATE INDEX IF NOT EXISTS idx_admission_students_test_status ON admission_students(test_status);
CREATE INDEX IF NOT EXISTS idx_admission_students_interview_date ON admission_students(interview_date);

-- Update existing records to have default values
UPDATE admission_students 
SET test_status = 'not_started' 
WHERE test_status IS NULL;

UPDATE admission_students 
SET interview_status = 'not_registered' 
WHERE interview_status IS NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN admission_students.test_start_time IS 'When the student started their entrance test';
COMMENT ON COLUMN admission_students.test_end_time IS 'When the student completed their entrance test';
COMMENT ON COLUMN admission_students.test_status IS 'Current status of the entrance test';
COMMENT ON COLUMN admission_students.test_duration IS 'Duration of the test in minutes';
COMMENT ON COLUMN admission_students.interview_status IS 'Current status in the interview process';
COMMENT ON COLUMN admission_students.interview_queue_number IS 'Queue number for interview';
COMMENT ON COLUMN admission_students.interview_completed_time IS 'When the interview was completed';
COMMENT ON COLUMN admission_students.student_registry_id IS 'Connection to student registry system';