-- Update artifact state constraint to include new workflow states
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_state_check;

ALTER TABLE artifacts ADD CONSTRAINT artifacts_state_check 
CHECK (state IN (
    'DRAFT', 
    'GENERATING', 
    'VALIDATING', 
    'READY_FOR_QA', 
    'ESCALATED', 
    'APPROVED', 
    'REJECTED', 
    'PUBLISHED', 
    'ARCHIVED'
));
