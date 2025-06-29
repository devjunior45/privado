-- Atualizar status de candidaturas para os novos valores
UPDATE job_applications 
SET status = CASE 
  WHEN status = 'shortlisted' THEN 'interview'
  WHEN status = 'hired' THEN 'hired'
  WHEN status = 'rejected' THEN 'rejected'
  ELSE 'pending'
END;

-- Atualizar constraint para novos status
ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('pending', 'interview', 'hired', 'rejected'));

-- Criar índice para ordenação por status e data
CREATE INDEX IF NOT EXISTS idx_job_applications_status_date 
ON job_applications(post_id, 
  CASE 
    WHEN status = 'hired' THEN 1
    WHEN status = 'interview' THEN 2
    WHEN status = 'pending' THEN 3
    WHEN status = 'rejected' THEN 4
  END,
  created_at ASC
);
