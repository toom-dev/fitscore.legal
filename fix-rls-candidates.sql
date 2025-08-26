-- ===============================================
-- CORRIGIR POLÍTICAS RLS PARA CANDIDATES
-- ===============================================

-- 1. Verificar políticas existentes
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'candidates';

-- 2. Remover políticas problemáticas se existirem
DROP POLICY IF EXISTS "Allow public insert" ON candidates;
DROP POLICY IF EXISTS "Allow public update" ON candidates; 
DROP POLICY IF EXISTS "Public can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can manage candidates" ON candidates;

-- 3. Criar políticas corretas para candidates
-- Permitir INSERT público (para criação de candidatos)
CREATE POLICY "Public can create candidates" ON candidates 
FOR INSERT 
WITH CHECK (true);

-- Permitir UPDATE público (para atualizar score após submissão)
CREATE POLICY "Public can update candidates" ON candidates 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Permitir SELECT para usuários autenticados (admin panel)
CREATE POLICY "Authenticated can view candidates" ON candidates 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Verificar se as novas políticas foram criadas
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'candidates';

-- ===============================================
-- RECALCULAR SCORES PARA CANDIDATOS EXISTENTES
-- ===============================================

-- 5. Função para recalcular scores de candidatos com respostas
CREATE OR REPLACE FUNCTION recalculate_candidate_scores()
RETURNS TABLE(candidate_id UUID, new_score INTEGER, new_label TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    candidate_record RECORD;
    total_score INTEGER;
    fit_label TEXT;
BEGIN
    -- Para cada candidato que tem respostas mas não tem score
    FOR candidate_record IN 
        SELECT DISTINCT c.id, c.name
        FROM candidates c
        INNER JOIN answers a ON c.id = a.candidate_id
        WHERE c.fit_score IS NULL OR c.completed_at IS NULL
    LOOP
        -- Calcular pontuação total
        SELECT COALESCE(SUM(score), 0) INTO total_score
        FROM answers 
        WHERE candidate_id = candidate_record.id;
        
        -- Calcular label baseado na pontuação
        IF total_score >= 80 THEN
            fit_label := 'Fit Altíssimo';
        ELSIF total_score >= 60 THEN
            fit_label := 'Fit Aprovado';
        ELSIF total_score >= 40 THEN
            fit_label := 'Fit Questionável';
        ELSE
            fit_label := 'Fora do Perfil';
        END IF;
        
        -- Atualizar candidato
        UPDATE candidates 
        SET 
            fit_score = total_score,
            fit_label = fit_label,
            completed_at = COALESCE(completed_at, NOW()),
            updated_at = NOW()
        WHERE id = candidate_record.id;
        
        -- Retornar resultado
        RETURN QUERY SELECT candidate_record.id, total_score, fit_label;
        
        RAISE NOTICE 'Candidato % atualizado: % pontos (%)', candidate_record.name, total_score, fit_label;
    END LOOP;
    
    RETURN;
END;
$$;

-- 6. Executar a função para recalcular
SELECT * FROM recalculate_candidate_scores();

-- 7. Verificar resultados
SELECT 
    name,
    email,
    fit_score,
    fit_label,
    completed_at,
    (SELECT COUNT(*) FROM answers WHERE candidate_id = c.id) as total_answers
FROM candidates c
WHERE fit_score IS NOT NULL
ORDER BY created_at DESC;
