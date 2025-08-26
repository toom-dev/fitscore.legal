-- ===============================================
-- CORRIGIR VIEW CANDIDATES_SUMMARY
-- ===============================================
-- Execute no Supabase SQL Editor para corrigir a view

-- Remover a view existente
DROP VIEW IF EXISTS candidates_summary;

-- Recriar a view com campos corretos
CREATE VIEW candidates_summary AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.fit_score,
    c.fit_label,
    c.completed_at,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(a.id), 0)::INTEGER as total_answers,
    COALESCE(COUNT(DISTINCT a.question_id), 0)::INTEGER as answered_questions
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
GROUP BY 
    c.id, 
    c.name, 
    c.email, 
    c.phone, 
    c.fit_score, 
    c.fit_label, 
    c.completed_at, 
    c.created_at,
    c.updated_at
ORDER BY c.created_at DESC;

-- Garantir permissões
GRANT SELECT ON candidates_summary TO authenticated;
GRANT SELECT ON candidates_summary TO anon;

-- Testar a view
SELECT 
    name,
    email,
    fit_score,
    fit_label,
    completed_at,
    total_answers,
    answered_questions
FROM candidates_summary 
LIMIT 5;
