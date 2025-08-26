-- ===============================================
-- CORRIGIR CANDIDATOS INCOMPLETOS
-- ===============================================
-- Este script calcula e atualiza fit_score, fit_label e completed_at
-- para candidatos que têm respostas mas não foram finalizados

-- 1. VERIFICAR CANDIDATOS INCOMPLETOS
SELECT 
    'Candidatos incompletos (com respostas mas sem fit_score):' as info,
    COUNT(*) as total
FROM candidates c
WHERE c.fit_score IS NULL 
AND EXISTS (
    SELECT 1 FROM answers a WHERE a.candidate_id = c.id
);

-- Mostrar detalhes dos candidatos incompletos
SELECT 
    c.id,
    c.name,
    c.email,
    c.fit_score,
    c.fit_label,
    c.completed_at,
    COUNT(a.id) as total_respostas,
    SUM(a.score) as pontuacao_calculada
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
WHERE c.fit_score IS NULL
GROUP BY c.id, c.name, c.email, c.fit_score, c.fit_label, c.completed_at
HAVING COUNT(a.id) > 0
ORDER BY c.created_at DESC;

-- 2. FUNÇÃO PARA CALCULAR FIT_LABEL
-- Recriar a função que calcula o label baseado na pontuação
CREATE OR REPLACE FUNCTION calculate_fit_label(score INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    IF score >= 80 THEN
        RETURN 'Fit Altíssimo';
    ELSIF score >= 60 THEN
        RETURN 'Fit Aprovado';
    ELSIF score >= 40 THEN
        RETURN 'Fit Questionável';
    ELSE
        RETURN 'Fora do Perfil';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. ATUALIZAR CANDIDATOS INCOMPLETOS
-- Calcular e atualizar fit_score, fit_label e completed_at para candidatos com respostas
WITH candidate_scores AS (
    SELECT 
        c.id,
        c.name,
        c.email,
        COALESCE(SUM(a.score), 0) as total_score,
        COUNT(a.id) as total_answers
    FROM candidates c
    LEFT JOIN answers a ON c.id = a.candidate_id
    WHERE c.fit_score IS NULL  -- Apenas candidatos sem pontuação
    GROUP BY c.id, c.name, c.email
    HAVING COUNT(a.id) > 0  -- Apenas candidatos com respostas
)
UPDATE candidates 
SET 
    fit_score = candidate_scores.total_score::INTEGER,
    fit_label = calculate_fit_label(candidate_scores.total_score::INTEGER),
    completed_at = NOW(),
    updated_at = NOW()
FROM candidate_scores
WHERE candidates.id = candidate_scores.id;

-- 4. VERIFICAR RESULTADOS
SELECT 
    'Candidatos atualizados:' as info,
    COUNT(*) as total
FROM candidates 
WHERE fit_score IS NOT NULL 
AND completed_at IS NOT NULL;

-- Mostrar candidatos atualizados
SELECT 
    c.id,
    c.name,
    c.email,
    c.fit_score,
    c.fit_label,
    c.completed_at,
    COUNT(a.id) as total_respostas
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
WHERE c.fit_score IS NOT NULL
GROUP BY c.id, c.name, c.email, c.fit_score, c.fit_label, c.completed_at
ORDER BY c.completed_at DESC;

-- 5. VERIFICAR A VIEW CANDIDATES_SUMMARY APÓS CORREÇÃO
SELECT 
    'Teste final da view candidates_summary:' as info,
    COUNT(*) as total_registros
FROM candidates_summary;

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

-- 6. ESTATÍSTICAS FINAIS
SELECT 
    fit_label,
    COUNT(*) as quantidade,
    ROUND(AVG(fit_score), 2) as pontuacao_media,
    MIN(fit_score) as pontuacao_minima,
    MAX(fit_score) as pontuacao_maxima
FROM candidates 
WHERE fit_score IS NOT NULL
GROUP BY fit_label
ORDER BY pontuacao_media DESC;

-- 7. LIMPEZA (Opcional)
-- Remover função auxiliar se não for mais necessária
-- DROP FUNCTION IF EXISTS calculate_fit_label(INTEGER);

-- ===============================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ===============================================

/*
ESTE SCRIPT IRÁ:

1. Identificar candidatos que têm respostas mas não têm fit_score
2. Calcular a pontuação total baseada nas respostas existentes
3. Determinar o fit_label baseado na pontuação
4. Atualizar completed_at com timestamp atual
5. Verificar os resultados

EXECUTE ESTE SCRIPT SE:
- Você tem candidatos com respostas mas fit_score = null
- O dashboard mostra estatísticas incorretas
- Candidatos aparecem como "incompletos" mas têm respostas

APÓS EXECUTAR:
- Todos os candidatos com respostas terão fit_score calculado
- A view candidates_summary mostrará dados corretos
- O dashboard exibirá estatísticas precisas

NOTA: Este script é seguro e só atualiza candidatos que realmente
têm respostas no banco mas não foram finalizados corretamente.
*/
