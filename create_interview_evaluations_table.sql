-- Create the interview_evaluations table in Supabase
CREATE TABLE interview_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    professor_id INTEGER NOT NULL,
    situation_etudes TEXT NOT NULL,
    motivation_domaine INTEGER NOT NULL CHECK (motivation_domaine >= 1 AND motivation_domaine <= 5),
    motivation_domaine_comment TEXT,
    motivation_ifag INTEGER NOT NULL CHECK (motivation_ifag >= 1 AND motivation_ifag <= 5),
    motivation_ifag_comment TEXT,
    projet_etudes INTEGER NOT NULL CHECK (projet_etudes >= 1 AND projet_etudes <= 5),
    projet_etudes_comment TEXT,
    projet_professionnel INTEGER NOT NULL CHECK (projet_professionnel >= 1 AND projet_professionnel <= 5),
    projet_professionnel_comment TEXT,
    aisance_verbale INTEGER NOT NULL CHECK (aisance_verbale >= 1 AND aisance_verbale <= 5),
    aisance_verbale_comment TEXT,
    interaction_jury INTEGER NOT NULL CHECK (interaction_jury >= 1 AND interaction_jury <= 5),
    interaction_jury_comment TEXT,
    culture_generale INTEGER NOT NULL CHECK (culture_generale >= 1 AND culture_generale <= 5),
    culture_generale_comment TEXT,
    decision_jury TEXT NOT NULL CHECK (decision_jury IN ('admis', 'non_admis', 'indecis')),
    commentaire_global TEXT NOT NULL,
    membre_jury TEXT NOT NULL,
    date_evaluation DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to link with admission_students table
ALTER TABLE interview_evaluations 
ADD CONSTRAINT fk_interview_evaluations_student 
FOREIGN KEY (student_id) REFERENCES admission_students(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_interview_evaluations_student_id ON interview_evaluations(student_id);
CREATE INDEX idx_interview_evaluations_date ON interview_evaluations(date_evaluation);
CREATE INDEX idx_interview_evaluations_decision ON interview_evaluations(decision_jury);

-- Enable Row Level Security (RLS)
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication setup)
CREATE POLICY "Allow read access to interview_evaluations" ON interview_evaluations
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to interview_evaluations" ON interview_evaluations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to interview_evaluations" ON interview_evaluations
    FOR UPDATE USING (true) WITH CHECK (true);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_evaluations_updated_at
    BEFORE UPDATE ON interview_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();