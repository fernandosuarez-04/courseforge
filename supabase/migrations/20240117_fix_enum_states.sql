-- Corrige el error de ENUM añadiendo los valores faltantes al tipo 'artifact_state'
-- PostgreSQL no permite ALTER TYPE dentro de transacciones en algunas versiones, 
-- pero este bloque DO gestiona la existencia para evitar errores.

DO $$
BEGIN
    -- 1. GENERATING
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'GENERATING') THEN
        ALTER TYPE artifact_state ADD VALUE 'GENERATING';
    END IF;

    -- 2. VALIDATING
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'VALIDATING') THEN
        ALTER TYPE artifact_state ADD VALUE 'VALIDATING';
    END IF;

    -- 3. READY_FOR_QA
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'READY_FOR_QA') THEN
        ALTER TYPE artifact_state ADD VALUE 'READY_FOR_QA';
    END IF;

    -- 4. ESCALATED
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'ESCALATED') THEN
        ALTER TYPE artifact_state ADD VALUE 'ESCALATED';
    END IF;

    -- 5. PUBLISHED (El error indicaba que este quizás faltaba o causaba conflicto)
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'PUBLISHED') THEN
        ALTER TYPE artifact_state ADD VALUE 'PUBLISHED';
    END IF;
    
    -- 6. REJECTED
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'REJECTED') THEN
        ALTER TYPE artifact_state ADD VALUE 'REJECTED';
    END IF;

    -- 7. ARCHIVED
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_state' AND e.enumlabel = 'ARCHIVED') THEN
        ALTER TYPE artifact_state ADD VALUE 'ARCHIVED';
    END IF;
END$$;

-- Eliminamos el CHECK constraint manual fallido si se llegó a crear parcialmente, 
-- ya que el tipo ENUM se encarga de validar los valores permitidos.
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_state_check;
