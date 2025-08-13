-- Complete Test and Interview Management Database Setup
-- Run this script in your Supabase SQL editor to add all required columns

-- Add test management columns
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_start_time TIMESTAMPTZ;

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_end_time TIMESTAMPTZ;

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'not_started';

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_duration INTEGER;

-- Add interview management columns
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_status VARCHAR(20) DEFAULT 'not_registered';

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_queue_number INTEGER;

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_completed_time TIMESTAMPTZ;

-- Add constraints for valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admission_students_test_status_check'
    ) THEN
        ALTER TABLE admission_students 
        ADD CONSTRAINT admission_students_test_status_check 
        CHECK (test_status IN ('not_started', 'in_progress', 'completed', 'absent'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admission_students_interview_status_check'
    ) THEN
        ALTER TABLE admission_students 
        ADD CONSTRAINT admission_students_interview_status_check 
        CHECK (interview_status IN ('not_registered', 'in_queue', 'interviewing', 'completed'));
    END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_admission_students_test_status 
ON admission_students(test_status);

CREATE INDEX IF NOT EXISTS idx_admission_students_test_start_time 
ON admission_students(test_start_time);

CREATE INDEX IF NOT EXISTS idx_admission_students_interview_status 
ON admission_students(interview_status);

CREATE INDEX IF NOT EXISTS idx_admission_students_interview_queue_number 
ON admission_students(interview_queue_number);

-- Update existing records with default values
UPDATE admission_students 
SET test_status = 'not_started' 
WHERE test_status IS NULL;

UPDATE admission_students 
SET interview_status = 'not_registered' 
WHERE interview_status IS NULL;

-- Add helpful comments
COMMENT ON COLUMN admission_students.test_start_time IS 'Timestamp when student started the entrance test';
COMMENT ON COLUMN admission_students.test_end_time IS 'Timestamp when student completed the entrance test';
COMMENT ON COLUMN admission_students.test_status IS 'Current status of the entrance test: not_started, in_progress, completed, absent';
COMMENT ON COLUMN admission_students.test_duration IS 'Duration of the test in minutes (calculated when completed)';
COMMENT ON COLUMN admission_students.interview_status IS 'Current status of the interview: not_registered, in_queue, interviewing, completed';
COMMENT ON COLUMN admission_students.interview_queue_number IS 'Queue position number when student is waiting for interview';
COMMENT ON COLUMN admission_students.interview_completed_time IS 'Timestamp when student completed the interview';

-- Verify the setup
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'admission_students' 
  AND column_name IN (
    'test_start_time', 'test_end_time', 'test_status', 'test_duration',
    'interview_status', 'interview_queue_number', 'interview_completed_time'
  )
ORDER BY column_name;