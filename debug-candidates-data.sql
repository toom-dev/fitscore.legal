-- ===============================================
-- DEBUG - VERIFICAR DADOS DOS CANDIDATOS
-- ===============================================
-- Execute no Supabase SQL Editor para investigar

-- 1. Verificar quantos candidatos existem
SELECT 
    'Total candidatos' as info,
    COUNT(*) as count
FROM candidates;

-- 2. Verificar estado dos campos importantes
SELECT 
    name,
    email,
    fit_score,
    fit_label,
    completed_at,
    created_at
FROM candidates 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar respostas existentes
SELECT 
    'Total respostas' as info,
    COUNT(*) as count
FROM answers;

-- 4. Verificar candidatos com respostas
SELECT 
    c.name,
    c.email,
    c.fit_score,
    c.completed_at,
    COUNT(a.id) as total_answers
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
GROUP BY c.id, c.name, c.email, c.fit_score, c.completed_at
ORDER BY c.created_at DESC;

-- 5. Verificar se algum candidato tem completed_at mas não tem fit_score
SELECT 
    'Candidatos completos sem score' as problema,
    COUNT(*) as count
FROM candidates
WHERE completed_at IS NOT NULL 
AND (fit_score IS NULL OR fit_label IS NULL);

-- 6. Verificar estrutura da tabela candidates
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
ORDER BY ordinal_position;
