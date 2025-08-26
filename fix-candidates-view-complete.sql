-- ===============================================
-- CORREÇÃO COMPLETA DA VIEW CANDIDATES_SUMMARY
-- ===============================================
-- Execute este script no Supabase SQL Editor para corrigir definitivamente

-- 1. VERIFICAR DADOS EXISTENTES
-- Primeiro vamos verificar se existem dados nas tabelas
SELECT 'Candidatos na tabela candidates:' as info, COUNT(*) as total FROM candidates;
SELECT 'Respostas na tabela answers:' as info, COUNT(*) as total FROM answers;

-- Verificar se há respostas para os candidatos específicos
SELECT 
    c.name,
    c.email,
    COUNT(a.id) as respostas_count
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
GROUP BY c.id, c.name, c.email
ORDER BY c.created_at DESC;

-- 2. REMOVER A VIEW EXISTENTE
DROP VIEW IF EXISTS candidates_summary;

-- 3. RECRIAR A VIEW COM CORREÇÕES
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

-- 4. CONFIGURAR PERMISSÕES ADEQUADAS
-- Revogar permissões antigas
REVOKE ALL ON candidates_summary FROM anon, authenticated;

-- Conceder permissões novas
GRANT SELECT ON candidates_summary TO authenticated;
GRANT SELECT ON candidates_summary TO anon;

-- 5. VERIFICAR RLS (Row Level Security)
-- Verificar se RLS está causando problemas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('candidates', 'answers', 'questions', 'alternatives');

-- Verificar RLS detalhado usando pg_class
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname IN ('candidates', 'answers', 'questions', 'alternatives');

-- 6. TESTAR A VIEW CORRIGIDA
SELECT 
    'Teste da view candidates_summary:' as info,
    COUNT(*) as total_registros
FROM candidates_summary;

-- Testar dados específicos
SELECT 
    name,
    email,
    fit_score,
    fit_label,
    completed_at,
    total_answers,
    answered_questions,
    created_at
FROM candidates_summary 
ORDER BY created_at DESC
LIMIT 10;

-- 7. DIAGNÓSTICO ADICIONAL
-- Verificar se há problemas de permissão nas tabelas base
SELECT 
    'Teste direto na tabela candidates:' as info,
    COUNT(*) as total
FROM candidates;

SELECT 
    'Teste direto na tabela answers:' as info,
    COUNT(*) as total
FROM answers;

-- Query manual para comparar com a view
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
    COALESCE(COUNT(a.id), 0)::INTEGER as total_answers_manual,
    COALESCE(COUNT(DISTINCT a.question_id), 0)::INTEGER as answered_questions_manual
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
ORDER BY c.created_at DESC
LIMIT 5;

-- 8. ATUALIZAR FUNÇÃO RPC TAMBÉM (caso seja necessária)
-- Remover função existente primeiro
DROP FUNCTION IF EXISTS get_candidates_with_answers();

-- Recriar função com tipo correto
CREATE OR REPLACE FUNCTION get_candidates_with_answers()
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  fit_score INTEGER,
  fit_label VARCHAR(50),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_answers BIGINT,
  answered_questions BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
    COALESCE(COUNT(a.id), 0) as total_answers,
    COALESCE(COUNT(DISTINCT a.question_id), 0) as answered_questions
  FROM candidates c
  LEFT JOIN answers a ON c.id = a.candidate_id
  GROUP BY c.id, c.name, c.email, c.phone, c.fit_score, c.fit_label, c.completed_at, c.created_at, c.updated_at
  ORDER BY c.created_at DESC;
END;
$$;

-- Garantir permissões na função
GRANT EXECUTE ON FUNCTION get_candidates_with_answers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_with_answers() TO anon;

-- ===============================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ===============================================

/*
PASSOS PARA EXECUTAR:

1. Copie todo este script
2. Cole no SQL Editor do Supabase
3. Execute o script completo
4. Verifique os resultados dos SELECTs de diagnóstico
5. Se ainda houver problemas, verifique:
   - Se RLS está bloqueando o acesso
   - Se as políticas de segurança estão corretas
   - Se há dados reais na tabela answers

POSSÍVEIS CAUSAS DO PROBLEMA:
- View não atualizada com a correção
- RLS bloqueando acesso à tabela answers
- Falta de dados na tabela answers
- Problemas de permissão entre tabelas
*/
