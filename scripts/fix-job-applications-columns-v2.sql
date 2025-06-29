-- Fix job_applications table structure to use consistent column names
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        
        -- Ensure we have the correct columns
        -- The table should use post_id (not job_id) to match the existing codebase
        
        -- Check if post_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'post_id') THEN
            
            -- If job_id exists, rename it to post_id
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'job_id') THEN
                ALTER TABLE job_applications RENAME COLUMN job_id TO post_id;
            ELSE
                -- Add post_id column
                ALTER TABLE job_applications ADD COLUMN post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE;
            END IF;
        END IF;
        
        -- Ensure we have candidate_id (not user_id) to match existing structure
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'candidate_id') THEN
            
            -- If user_id exists, rename it to candidate_id
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'user_id') THEN
                ALTER TABLE job_applications RENAME COLUMN user_id TO candidate_id;
            ELSE
                -- Add candidate_id column
                ALTER TABLE job_applications ADD COLUMN candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
            END IF;
        END IF;
        
        -- Ensure we have the required columns for the application system
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'application_type') THEN
            ALTER TABLE job_applications ADD COLUMN application_type VARCHAR(20) DEFAULT 'platform';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'recruiter_notes') THEN
            ALTER TABLE job_applications ADD COLUMN recruiter_notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'resume_pdf_url') THEN
            ALTER TABLE job_applications ADD COLUMN resume_pdf_url TEXT;
        END IF;
        
        -- Update RLS policies to match the correct column names
        DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
        DROP POLICY IF EXISTS "Users can create their own applications" ON job_applications;
        DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON job_applications;
        
        -- Create updated policies
        CREATE POLICY "Users can view their own applications" ON job_applications
            FOR SELECT USING (auth.uid() = candidate_id);
            
        CREATE POLICY "Users can create their own applications" ON job_applications
            FOR INSERT WITH CHECK (auth.uid() = candidate_id);
            
        CREATE POLICY "Users can update their own applications" ON job_applications
            FOR UPDATE USING (auth.uid() = candidate_id);
            
        CREATE POLICY "Recruiters can view applications for their jobs" ON job_applications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM job_posts 
                    WHERE job_posts.id = job_applications.post_id 
                    AND job_posts.author_id = auth.uid()
                )
            );
            
        CREATE POLICY "Recruiters can update applications for their jobs" ON job_applications
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM job_posts 
                    WHERE job_posts.id = job_applications.post_id 
                    AND job_posts.author_id = auth.uid()
                )
            );
        
        -- Create proper indexes
        DROP INDEX IF EXISTS idx_job_applications_user_job;
        DROP INDEX IF EXISTS idx_job_applications_job_id;
        DROP INDEX IF EXISTS idx_job_applications_user_id;
        
        CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_post ON job_applications(candidate_id, post_id);
        CREATE INDEX IF NOT EXISTS idx_job_applications_post_id ON job_applications(post_id);
        CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON job_applications(candidate_id);
        CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);
        CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
        
        -- Ensure unique constraint
        DROP CONSTRAINT IF EXISTS job_applications_post_id_candidate_id_key;
        ALTER TABLE job_applications ADD CONSTRAINT job_applications_post_id_candidate_id_key UNIQUE(post_id, candidate_id);
        
    END IF;
END $$;

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
ORDER BY ordinal_position;
