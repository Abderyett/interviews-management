-- Add test management columns to admission_students table
-- Run this script in your Supabase SQL editor

-- Add test start time column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_start_time TIMESTAMPTZ;

-- Add test end time column  
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_end_time TIMESTAMPTZ;

-- Add test status column with default value
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'not_started';

-- Add test duration column (in minutes)
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_duration INTEGER;

-- Add interview status column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_status VARCHAR(20) DEFAULT 'not_registered';

-- Add interview queue number column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_queue_number INTEGER;

-- Add interview completed timestamp
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS interview_completed_time TIMESTAMPTZ;

-- Add constraint to ensure valid test status values
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

-- Add constraint to ensure valid interview status values
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

-- Create index on test_status for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_test_status 
ON admission_students(test_status);

-- Create index on test_start_time for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_test_start_time 
ON admission_students(test_start_time);

-- Create index on interview_status for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_interview_status 
ON admission_students(interview_status);

-- Create index on interview_queue_number for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_interview_queue_number 
ON admission_students(interview_queue_number);

-- Update any existing records to have default status values
UPDATE admission_students 
SET test_status = 'not_started' 
WHERE test_status IS NULL;

UPDATE admission_students 
SET interview_status = 'not_registered' 
WHERE interview_status IS NULL;

-- Add comments to table explaining the new columns
COMMENT ON COLUMN admission_students.test_start_time IS 'Timestamp when student started the entrance test';
COMMENT ON COLUMN admission_students.test_end_time IS 'Timestamp when student completed the entrance test';
COMMENT ON COLUMN admission_students.test_status IS 'Current status of the entrance test: not_started, in_progress, completed, absent';
COMMENT ON COLUMN admission_students.test_duration IS 'Duration of the test in minutes (calculated when completed)';
COMMENT ON COLUMN admission_students.interview_status IS 'Current status of the interview: not_registered, in_queue, interviewing, completed';
COMMENT ON COLUMN admission_students.interview_queue_number IS 'Queue position number when student is waiting for interview';
COMMENT ON COLUMN admission_students.interview_completed_time IS 'Timestamp when student completed the interview';