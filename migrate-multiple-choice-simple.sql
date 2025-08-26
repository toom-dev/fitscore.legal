-- ===============================================
-- MIGRAÇÃO SIMPLES DE RESPOSTAS MÚLTIPLA ESCOLHA
-- ===============================================

-- 1. VERIFICAR DADOS EXISTENTES
SELECT 
    'Respostas com arrays JSON:' as info,
    COUNT(*) as total
FROM answers 
WHERE text_answer IS NOT NULL 
AND text_answer LIKE '[%]'
AND alternative_id IS NULL;

-- Mostrar exemplos
SELECT 
    a.id,
    a.candidate_id,
    a.question_id,
    a.text_answer,
    a.score
FROM answers a
WHERE a.text_answer IS NOT NULL 
AND a.text_answer LIKE '[%]'
AND a.alternative_id IS NULL
LIMIT 5;

-- 2. MIGRAÇÃO MANUAL SIMPLES
-- Para cada resposta com array JSON, você pode executar manualmente:

/*
EXEMPLO DE MIGRAÇÃO MANUAL:

-- Se você tem uma resposta como:
-- text_answer = '["uuid1","uuid2","uuid3"]'
-- score = 24

-- Execute estas queries:

-- 1. Inserir registros separados
INSERT INTO answers (candidate_id, question_id, alternative_id, text_answer, score, created_at) VALUES
('candidate_id_aqui', 'question_id_aqui', 'uuid1', NULL, 8, NOW()),
('candidate_id_aqui', 'question_id_aqui', 'uuid2', NULL, 8, NOW()),
('candidate_id_aqui', 'question_id_aqui', 'uuid3', NULL, 8, NOW());

-- 2. Remover registro original
DELETE FROM answers WHERE id = 'answer_id_original';
*/

-- 3. SCRIPT AUTOMÁTICO MAIS SIMPLES
DO $$
DECLARE
    rec RECORD;
    json_str TEXT;
    clean_str TEXT;
    ids_array TEXT[];
    alt_id TEXT;
    score_per_alt INTEGER;
BEGIN
    -- Processar cada resposta com JSON array
    FOR rec IN 
        SELECT id, candidate_id, question_id, text_answer, score
        FROM answers 
        WHERE text_answer IS NOT NULL 
        AND text_answer LIKE '[%]'
        AND alternative_id IS NULL
    LOOP
        -- Limpar o JSON string
        json_str := rec.text_answer;
        clean_str := REPLACE(REPLACE(REPLACE(json_str, '[', ''), ']', ''), '"', '');
        
        -- Converter para array
        ids_array := string_to_array(clean_str, ',');
        
        -- Calcular score por alternativa
        score_per_alt := CASE 
            WHEN array_length(ids_array, 1) > 0 
            THEN rec.score / array_length(ids_array, 1)
            ELSE rec.score
        END;
        
        -- Inserir registro para cada alternativa
        FOREACH alt_id IN ARRAY ids_array
        LOOP
            alt_id := TRIM(alt_id);
            IF alt_id != '' AND length(alt_id) = 36 THEN -- UUID tem 36 caracteres
                INSERT INTO answers (
                    candidate_id,
                    question_id,
                    alternative_id,
                    text_answer,
                    score,
                    created_at
                ) VALUES (
                    rec.candidate_id,
                    rec.question_id,
                    alt_id::UUID,
                    NULL,
                    score_per_alt,
                    NOW()
                );
                
                RAISE NOTICE 'Inserido: candidate=%, question=%, alt=%, score=%', 
                    rec.candidate_id, rec.question_id, alt_id, score_per_alt;
            END IF;
        END LOOP;
        
        -- Remover registro original
        DELETE FROM answers WHERE id = rec.id;
        RAISE NOTICE 'Removido registro original: %', rec.id;
        
    END LOOP;
END $$;

-- 4. VERIFICAR RESULTADOS
SELECT 
    'Respostas restantes com JSON:' as info,
    COUNT(*) as total
FROM answers 
WHERE text_answer IS NOT NULL 
AND text_answer LIKE '[%]'
AND alternative_id IS NULL;

-- 5. ESTATÍSTICAS FINAIS
SELECT 
    'Total de respostas após migração:' as info,
    COUNT(*) as total
FROM answers;

-- Verificar integridade
SELECT 
    'Alternativas inválidas:' as info,
    COUNT(*) as total
FROM answers a
LEFT JOIN alternatives alt ON a.alternative_id = alt.id
WHERE a.alternative_id IS NOT NULL 
AND alt.id IS NULL;
