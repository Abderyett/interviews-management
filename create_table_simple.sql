-- Create the interview_evaluations table
CREATE TABLE interview_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    professor_id INTEGER NOT NULL,
    situation_etudes TEXT NOT NULL,
    motivation_domaine INTEGER NOT NULL,
    motivation_domaine_comment TEXT,
    motivation_ifag INTEGER NOT NULL,
    motivation_ifag_comment TEXT,
    projet_etudes INTEGER NOT NULL,
    projet_etudes_comment TEXT,
    projet_professionnel INTEGER NOT NULL,
    projet_professionnel_comment TEXT,
    aisance_verbale INTEGER NOT NULL,
    aisance_verbale_comment TEXT,
    interaction_jury INTEGER NOT NULL,
    interaction_jury_comment TEXT,
    culture_generale INTEGER NOT NULL,
    culture_generale_comment TEXT,
    decision_jury TEXT NOT NULL,
    commentaire_global TEXT NOT NULL,
    membre_jury TEXT NOT NULL,
    date_evaluation DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on interview_evaluations" ON interview_evaluations
    FOR ALL USING (true) WITH CHECK (true);