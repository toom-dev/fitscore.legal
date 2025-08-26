-- ===============================================
-- FUNÇÃO PARA OBTER CANDIDATOS COM RESPOSTAS
-- ===============================================
-- Execute este SQL no Supabase SQL Editor

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
    COUNT(a.id) as total_answers,
    COUNT(DISTINCT a.question_id) as answered_questions
  FROM candidates c
  LEFT JOIN answers a ON c.id = a.candidate_id
  GROUP BY c.id, c.name, c.email, c.phone, c.fit_score, c.fit_label, c.completed_at, c.created_at
  ORDER BY c.created_at DESC;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_candidates_with_answers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidates_with_answers() TO anon;
