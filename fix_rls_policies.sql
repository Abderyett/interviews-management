-- Fix the RLS policies for admission_students table
-- Run this AFTER creating the table

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Sales users can view their own students" ON public.admission_students;
DROP POLICY IF EXISTS "Sales users can insert students" ON public.admission_students;
DROP POLICY IF EXISTS "Sales users can update their own students" ON public.admission_students;
DROP POLICY IF EXISTS "Sales users can delete their own students" ON public.admission_students;

-- Create simpler policies that allow all authenticated users (for now)
-- You can restrict these later once the system is working

CREATE POLICY "Allow all authenticated users to select" ON public.admission_students
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert" ON public.admission_students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update" ON public.admission_students
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete" ON public.admission_students
    FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to completely disable RLS for now (easier for testing)
-- Uncomment the line below if the above policies still cause issues
-- ALTER TABLE public.admission_students DISABLE ROW LEVEL SECURITY;

-- Test that the table works
INSERT INTO public.admission_students (
    nom, prenom, mobile, bac_type, annee_bac, specialite, 
    moyenne_generale, maths, francais, test_required, 
    validation, sales_person_id
) VALUES (
    'Test', 'Student', '0123456789', 'bac_science', '2024', 'LAC',
    15.5, 16.0, 15.0, false,
    'pending', 1
);

-- Verify the insert worked
SELECT * FROM public.admission_students;