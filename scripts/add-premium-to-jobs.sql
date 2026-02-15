-- Add premium column to job_posts table
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS premium INTEGER DEFAULT 0 CHECK (premium IN (0, 1));

-- Add index for better query performance on premium jobs
CREATE INDEX IF NOT EXISTS idx_job_posts_premium ON job_posts(premium DESC, created_at DESC);

-- Add comment to column
COMMENT ON COLUMN job_posts.premium IS 'Premium job flag: 1 = premium (top of feed), 0 = standard';
