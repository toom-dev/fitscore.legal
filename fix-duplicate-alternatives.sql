-- ===============================================
-- SCRIPT PARA LIMPAR ALTERNATIVAS DUPLICADAS
-- ===============================================

-- Primeiro, vamos ver o estado atual
SELECT 
    q.title,
    COUNT(a.id) as total_alternatives,
    COUNT(DISTINCT a.text) as unique_texts
FROM questions q
LEFT JOIN alternatives a ON q.id = a.question_id
GROUP BY q.id, q.title
HAVING COUNT(a.id) > 10
ORDER BY COUNT(a.id) DESC;

-- Identificar duplicatas por pergunta
WITH duplicates AS (
    SELECT 
        a.id,
        a.question_id,
        a.text,
        a.value,
        a.order_index,
        ROW_NUMBER() OVER (
            PARTITION BY a.question_id, a.text, a.value 
            ORDER BY a.created_at ASC
        ) as rn
    FROM alternatives a
)
SELECT 
    q.title,
    d.text,
    d.value,
    COUNT(*) as duplicates_count
FROM duplicates d
JOIN questions q ON d.question_id = q.id
WHERE d.rn > 1
GROUP BY q.id, q.title, d.text, d.value
ORDER BY duplicates_count DESC;

-- LIMPAR DUPLICATAS - manter apenas a primeira ocorrência de cada alternativa
WITH duplicates AS (
    SELECT 
        a.id,
        a.question_id,
        a.text,
        a.value,
        ROW_NUMBER() OVER (
            PARTITION BY a.question_id, a.text, a.value 
            ORDER BY a.created_at ASC
        ) as rn
    FROM alternatives a
)
DELETE FROM alternatives 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- Reordenar as alternativas restantes
WITH ordered_alternatives AS (
    SELECT 
        a.id,
        a.question_id,
        ROW_NUMBER() OVER (
            PARTITION BY a.question_id 
            ORDER BY a.order_index ASC, a.created_at ASC
        ) as new_order
    FROM alternatives a
)
UPDATE alternatives 
SET order_index = ordered_alternatives.new_order
FROM ordered_alternatives
WHERE alternatives.id = ordered_alternatives.id;

-- Verificar resultado final
SELECT 
    q.title,
    COUNT(a.id) as total_alternatives,
    STRING_AGG(a.text || ' (' || a.value || 'pts)', ', ' ORDER BY a.order_index) as alternatives_list
FROM questions q
LEFT JOIN alternatives a ON q.id = a.question_id
GROUP BY q.id, q.title
ORDER BY q.title;

-- Verificar se ainda há duplicatas
SELECT 
    q.title,
    a.text,
    a.value,
    COUNT(*) as count
FROM alternatives a
JOIN questions q ON a.question_id = q.id
GROUP BY q.id, q.title, a.text, a.value
HAVING COUNT(*) > 1
ORDER BY count DESC;
