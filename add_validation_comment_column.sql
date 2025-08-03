-- Add validation_comment column to admission_students table
-- This column will store comments made by superadmin users during the validation process

-- Add the validation_comment column
ALTER TABLE public.admission_students 
ADD COLUMN IF NOT EXISTS validation_comment TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.admission_students.validation_comment IS 'Comments added by superadmin during validation process';

-- Create index for better query performance on validation comments
CREATE INDEX IF NOT EXISTS idx_admission_students_validation_comment 
ON public.admission_students(validation_comment) 
WHERE validation_comment IS NOT NULL;

-- Update existing records to have empty string instead of NULL for consistency
UPDATE public.admission_students 
SET validation_comment = '' 
WHERE validation_comment IS NULL;