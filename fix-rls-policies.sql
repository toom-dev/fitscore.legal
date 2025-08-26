-- ===============================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA ADMIN
-- ===============================================
-- Execute este script se a view ainda não funcionar após a correção anterior

-- 1. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('candidates', 'answers', 'questions', 'alternatives')
ORDER BY tablename, policyname;

-- 2. ADICIONAR POLÍTICAS ESPECÍFICAS PARA ADMIN/VIEW ACCESS

-- Para a tabela candidates - permitir leitura completa para views
DROP POLICY IF EXISTS "Admin can view all candidates" ON candidates;
CREATE POLICY "Admin can view all candidates" ON candidates 
FOR SELECT 
USING (true);  -- Permite leitura total para views e consultas administrativas

-- Para a tabela answers - permitir leitura completa para views
DROP POLICY IF EXISTS "Admin can view all answers" ON answers;
CREATE POLICY "Admin can view all answers" ON answers 
FOR SELECT 
USING (true);  -- Permite leitura total para views e consultas administrativas

-- 3. POLÍTICA ALTERNATIVA MAIS PERMISSIVA (se necessário)
-- Se as políticas acima não funcionarem, use estas mais permissivas:

-- DROP POLICY IF EXISTS "Public read candidates for views" ON candidates;
-- CREATE POLICY "Public read candidates for views" ON candidates 
-- FOR SELECT 
-- USING (true);

-- DROP POLICY IF EXISTS "Public read answers for views" ON answers;
-- CREATE POLICY "Public read answers for views" ON answers 
-- FOR SELECT 
-- USING (true);

-- 4. VERIFICAR SE RLS ESTÁ CAUSANDO PROBLEMAS
-- Temporariamente desabilitar RLS para teste (CUIDADO: só para debug)
-- ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE answers DISABLE ROW LEVEL SECURITY;

-- Testar a view sem RLS
-- SELECT * FROM candidates_summary LIMIT 5;

-- Reabilitar RLS após teste
-- ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICA ESPECÍFICA PARA VIEWS
-- Criar política que permite acesso total para operações de view

DROP POLICY IF EXISTS "Views can access candidates" ON candidates;
CREATE POLICY "Views can access candidates" ON candidates 
FOR SELECT 
USING (
  -- Permitir acesso se for uma consulta de view ou admin
  current_setting('role', true) = 'postgres' 
  OR current_setting('request.jwt.claims', true)::json ->> 'role' = 'admin'
  OR true  -- Temporariamente permissivo para views
);

DROP POLICY IF EXISTS "Views can access answers" ON answers;
CREATE POLICY "Views can access answers" ON answers 
FOR SELECT 
USING (
  -- Permitir acesso se for uma consulta de view ou admin  
  current_setting('role', true) = 'postgres'
  OR current_setting('request.jwt.claims', true)::json ->> 'role' = 'admin'
  OR true  -- Temporariamente permissivo para views
);

-- 6. TESTAR ACESSO DIRETO ÀS TABELAS
SELECT 'Teste candidates:' as teste, COUNT(*) FROM candidates;
SELECT 'Teste answers:' as teste, COUNT(*) FROM answers;
SELECT 'Teste view:' as teste, COUNT(*) FROM candidates_summary;

-- 7. DIAGNÓSTICO COMPLETO
-- Verificar se o problema é RLS ou dados
WITH candidate_answers AS (
  SELECT 
    c.id,
    c.name,
    c.email,
    (SELECT COUNT(*) FROM answers a WHERE a.candidate_id = c.id) as answer_count
  FROM candidates c
  ORDER BY c.created_at DESC
  LIMIT 5
)
SELECT * FROM candidate_answers;

-- ===============================================
-- INSTRUÇÕES
-- ===============================================

/*
EXECUTE ESTE SCRIPT SE:
1. A view candidates_summary ainda retorna total_answers = 0
2. Você suspeita que RLS está bloqueando o acesso
3. O script anterior não resolveu o problema

PASSOS:
1. Execute este script no SQL Editor do Supabase
2. Verifique os resultados dos testes
3. Se ainda não funcionar, considere temporariamente desabilitar RLS para debug
4. Após identificar o problema, reabilite RLS com políticas corretas

NOTA IMPORTANTE:
As políticas aqui são mais permissivas para resolver o problema da view.
Em produção, você pode querer políticas mais restritivas baseadas em autenticação.
*/
