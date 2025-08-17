-- Add presence tracking columns to admission_students table
-- Run this script in your Supabase SQL editor

-- Add presence status column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS presence_status VARCHAR(20) DEFAULT 'not_checked';

-- Add presence checked at timestamp column  
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS presence_checked_at TIMESTAMPTZ;

-- Add presence checked by user column
ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS presence_checked_by VARCHAR(100);

-- Add constraint to ensure valid presence status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admission_students_presence_status_check'
    ) THEN
        ALTER TABLE admission_students 
        ADD CONSTRAINT admission_students_presence_status_check 
        CHECK (presence_status IN ('not_checked', 'present', 'absent', 'late'));
    END IF;
END $$;

-- Create index on presence_status for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_presence_status 
ON admission_students(presence_status);

-- Create index on presence_checked_at for better query performance
CREATE INDEX IF NOT EXISTS idx_admission_students_presence_checked_at 
ON admission_students(presence_checked_at);

-- Update any existing records to have default presence status
UPDATE admission_students 
SET presence_status = 'not_checked' 
WHERE presence_status IS NULL;

-- Add comments to table explaining the new columns
COMMENT ON COLUMN admission_students.presence_status IS 'Current presence status: not_checked, present, absent, late';
COMMENT ON COLUMN admission_students.presence_checked_at IS 'Timestamp when presence status was last updated';
COMMENT ON COLUMN admission_students.presence_checked_by IS 'User or system that updated the presence status (e.g., test_manager, auto_interview_completion)';