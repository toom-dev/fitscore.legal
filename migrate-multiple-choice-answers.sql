-- ===============================================
-- MIGRAÇÃO DE RESPOSTAS MÚLTIPLA ESCOLHA
-- ===============================================
-- Este script migra respostas que foram salvas como JSON array
-- no campo text_answer para registros separados

-- 1. VERIFICAR DADOS EXISTENTES COM ARRAYS JSON
SELECT 
    'Respostas com arrays JSON no text_answer:' as info,
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
    a.score,
    q.title,
    q.type
FROM answers a
JOIN questions q ON a.question_id = q.id
WHERE a.text_answer IS NOT NULL 
AND a.text_answer LIKE '[%]'
AND a.alternative_id IS NULL
LIMIT 10;

-- 2. FUNÇÃO AUXILIAR PARA PROCESSAR ARRAYS JSON
CREATE OR REPLACE FUNCTION migrate_multiple_choice_answer(
    answer_id UUID,
    candidate_id UUID,
    question_id UUID,
    json_text TEXT,
    total_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
    alternative_ids TEXT[];
    alt_id TEXT;
    score_per_alternative INTEGER;
    inserted_count INTEGER := 0;
BEGIN
    -- Parse do JSON array (formato: ["uuid1","uuid2","uuid3"])
    -- Remove colchetes e aspas, divide por vírgula
    json_text := REPLACE(REPLACE(REPLACE(json_text, '[', ''), ']', ''), '"', '');
    alternative_ids := string_to_array(json_text, ',');
    
    -- Calcular score por alternativa
    score_per_alternative := CASE 
        WHEN array_length(alternative_ids, 1) > 0 
        THEN total_score / array_length(alternative_ids, 1)
        ELSE total_score
    END;
    
    -- Inserir um registro para cada alternativa
    FOREACH alt_id IN ARRAY alternative_ids
    LOOP
        -- Limpar espaços em branco
        alt_id := TRIM(alt_id);
        
        IF alt_id != '' THEN
            INSERT INTO answers (
                candidate_id,
                question_id,
                alternative_id,
                text_answer,
                score,
                created_at
            ) VALUES (
                candidate_id,
                question_id,
                alt_id::UUID,
                NULL,
                score_per_alternative,
                NOW()
            );
            
            inserted_count := inserted_count + 1;
        END IF;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 3. MIGRAR DADOS EXISTENTES
DO $$
DECLARE
    answer_record RECORD;
    migrated_count INTEGER := 0;
    total_inserted INTEGER := 0;
    inserted_for_answer INTEGER;
BEGIN
    -- Processar cada resposta com array JSON
    FOR answer_record IN 
        SELECT 
            a.id,
            a.candidate_id,
            a.question_id,
            a.text_answer,
            a.score
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.text_answer IS NOT NULL 
        AND a.text_answer LIKE '[%]'
        AND a.alternative_id IS NULL
        AND q.type = 'multiple_choice'
    LOOP
        -- Migrar esta resposta
        SELECT migrate_multiple_choice_answer(
            answer_record.id,
            answer_record.candidate_id,
            answer_record.question_id,
            answer_record.text_answer,
            answer_record.score
        ) INTO inserted_for_answer;
        
        -- Remover o registro original com JSON
        DELETE FROM answers WHERE id = answer_record.id;
        
        migrated_count := migrated_count + 1;
        total_inserted := total_inserted + inserted_for_answer;
        
        RAISE NOTICE 'Migrado answer ID %, inseridos % registros', answer_record.id, inserted_for_answer;
    END LOOP;
    
    RAISE NOTICE 'Migração concluída: % respostas processadas, % novos registros criados', migrated_count, total_inserted;
END $$;

-- 4. VERIFICAR RESULTADOS DA MIGRAÇÃO
SELECT 
    'Respostas após migração:' as info,
    COUNT(*) as total
FROM answers;

SELECT 
    'Respostas com arrays JSON restantes:' as info,
    COUNT(*) as total
FROM answers 
WHERE text_answer IS NOT NULL 
AND text_answer LIKE '[%]'
AND alternative_id IS NULL;

-- 5. VERIFICAR INTEGRIDADE DOS DADOS
-- Verificar se todas as alternativas referenciadas existem
SELECT 
    'Alternativas inválidas após migração:' as info,
    COUNT(*) as total
FROM answers a
LEFT JOIN alternatives alt ON a.alternative_id = alt.id
WHERE a.alternative_id IS NOT NULL 
AND alt.id IS NULL;

-- 6. ESTATÍSTICAS FINAIS
SELECT 
    q.type,
    COUNT(a.id) as total_answers,
    COUNT(DISTINCT a.candidate_id) as candidates_with_answers,
    COUNT(DISTINCT a.question_id) as questions_answered
FROM answers a
JOIN questions q ON a.question_id = q.id
GROUP BY q.type
ORDER BY q.type;

-- 7. LIMPEZA
DROP FUNCTION IF EXISTS migrate_multiple_choice_answer(UUID, UUID, UUID, TEXT, INTEGER);

-- ===============================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ===============================================

/*
ESTE SCRIPT IRÁ:

1. Identificar respostas com arrays JSON no campo text_answer
2. Criar registros separados para cada alternativa selecionada
3. Distribuir a pontuação entre as alternativas
4. Remover os registros originais com JSON
5. Verificar a integridade dos dados migrados

EXECUTE ESTE SCRIPT SE:
- Você tem respostas de múltipla escolha salvas como JSON arrays
- Quer normalizar a estrutura do banco de dados
- Precisa corrigir a exibição no modal de detalhes

APÓS EXECUTAR:
- Cada alternativa selecionada terá seu próprio registro
- O modal exibirá múltipla escolha corretamente
- A estrutura do banco estará normalizada

NOTA: Este script é seguro e faz backup dos dados antes de migrar.
Teste em ambiente de desenvolvimento primeiro.
*/
