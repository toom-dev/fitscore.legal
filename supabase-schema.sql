-- ===============================================
-- SCHEMA SUPABASE - FIT SCORE LEGAL
-- ===============================================
-- Execute este script no SQL Editor do Supabase
-- para criar todas as tabelas necessárias

-- Tabela de Perguntas
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'performance', 'energia', 'cultura'
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'single_choice', -- 'single_choice', 'multiple_choice', 'open_text'
  order_index INTEGER NOT NULL DEFAULT 0, -- ordem das perguntas
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alternativas das Perguntas
CREATE TABLE alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0, -- pontos da alternativa
  order_index INTEGER NOT NULL DEFAULT 0, -- ordem das alternativas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Candidatos
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  fit_score INTEGER, -- pontuação total
  fit_label VARCHAR(50), -- 'Fit Altíssimo', 'Fit Aprovado', etc
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Respostas
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  alternative_id UUID REFERENCES alternatives(id) ON DELETE CASCADE, -- NULL para open_text
  text_answer TEXT, -- para respostas abertas ou múltipla escolha (JSON array)
  score INTEGER DEFAULT 0, -- pontos obtidos nesta resposta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_alternatives_question ON alternatives(question_id);
CREATE INDEX idx_answers_candidate ON answers(candidate_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_candidates_email ON candidates(email);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- DADOS INICIAIS DE EXEMPLO
-- ===============================================

-- Perguntas de Performance
INSERT INTO questions (category, title, description, type, order_index) VALUES
('performance', 'Como você avalia sua produtividade atual?', 'Avalie seu nível de produtividade no trabalho', 'single_choice', 1),
('performance', 'Quais são seus principais objetivos de desempenho?', 'Selecione seus principais focos', 'multiple_choice', 2),
('performance', 'Que obstáculos mais afetam seu desempenho?', 'Identifique os principais desafios', 'single_choice', 3),
('performance', 'Como você mede seus resultados?', 'Descreva suas métricas de sucesso', 'open_text', 4);

-- Perguntas de Energia
INSERT INTO questions (category, title, description, type, order_index) VALUES
('energia', 'Como está seu nível de energia durante o trabalho?', 'Avalie sua energia ao longo do dia', 'single_choice', 1),
('energia', 'O que mais drena sua energia?', 'Selecione os principais fatores', 'multiple_choice', 2),
('energia', 'O que te energiza e motiva?', 'Identifique suas fontes de motivação', 'single_choice', 3),
('energia', 'Como você recupera energia após o trabalho?', 'Descreva suas estratégias de recuperação', 'open_text', 4);

-- Perguntas de Cultura
INSERT INTO questions (category, title, description, type, order_index) VALUES
('cultura', 'Como você se sente em relação à cultura da empresa?', 'Avalie seu alinhamento cultural', 'single_choice', 1),
('cultura', 'Que valores são mais importantes para você?', 'Selecione seus valores principais', 'multiple_choice', 2),
('cultura', 'Como você contribui para uma cultura positiva?', 'Descreva suas contribuições', 'open_text', 3);

-- Alternativas para pergunta 1 (Produtividade)
INSERT INTO alternatives (question_id, text, value, order_index) VALUES
((SELECT id FROM questions WHERE title = 'Como você avalia sua produtividade atual?' LIMIT 1), 'Excelente - Sempre supero expectativas', 25, 1),
((SELECT id FROM questions WHERE title = 'Como você avalia sua produtividade atual?' LIMIT 1), 'Boa - Cumpro meus objetivos consistentemente', 20, 2),
((SELECT id FROM questions WHERE title = 'Como você avalia sua produtividade atual?' LIMIT 1), 'Regular - Às vezes tenho dificuldades', 10, 3),
((SELECT id FROM questions WHERE title = 'Como você avalia sua produtividade atual?' LIMIT 1), 'Baixa - Preciso melhorar significativamente', 5, 4);

-- Alternativas para pergunta 2 (Objetivos - múltipla escolha)
INSERT INTO alternatives (question_id, text, value, order_index) VALUES
((SELECT id FROM questions WHERE title = 'Quais são seus principais objetivos de desempenho?' LIMIT 1), 'Aumentar produtividade', 8, 1),
((SELECT id FROM questions WHERE title = 'Quais são seus principais objetivos de desempenho?' LIMIT 1), 'Desenvolver novas habilidades', 7, 2),
((SELECT id FROM questions WHERE title = 'Quais são seus principais objetivos de desempenho?' LIMIT 1), 'Liderar equipes', 6, 3),
((SELECT id FROM questions WHERE title = 'Quais são seus principais objetivos de desempenho?' LIMIT 1), 'Inovar processos', 8, 4),
((SELECT id FROM questions WHERE title = 'Quais são seus principais objetivos de desempenho?' LIMIT 1), 'Crescimento profissional', 6, 5);

-- Alternativas para pergunta 3 (Obstáculos)
INSERT INTO alternatives (question_id, text, value, order_index) VALUES
((SELECT id FROM questions WHERE title = 'Que obstáculos mais afetam seu desempenho?' LIMIT 1), 'Falta de recursos adequados', 15, 1),
((SELECT id FROM questions WHERE title = 'Que obstáculos mais afetam seu desempenho?' LIMIT 1), 'Sobrecarga de trabalho', 10, 2),
((SELECT id FROM questions WHERE title = 'Que obstáculos mais afetam seu desempenho?' LIMIT 1), 'Falta de clareza nos objetivos', 8, 3),
((SELECT id FROM questions WHERE title = 'Que obstáculos mais afetam seu desempenho?' LIMIT 1), 'Conflitos interpessoais', 5, 4);

-- Continue com as outras perguntas de energia e cultura...
-- (Para brevidade, incluo apenas algumas alternativas exemplo)

-- Alternativas para energia (pergunta 5)
INSERT INTO alternatives (question_id, text, value, order_index) VALUES
((SELECT id FROM questions WHERE title = 'Como está seu nível de energia durante o trabalho?' LIMIT 1), 'Muito alto - Me sinto energizado o dia todo', 25, 1),
((SELECT id FROM questions WHERE title = 'Como está seu nível de energia durante o trabalho?' LIMIT 1), 'Bom - Tenho energia na maior parte do tempo', 20, 2),
((SELECT id FROM questions WHERE title = 'Como está seu nível de energia durante o trabalho?' LIMIT 1), 'Moderado - Varia durante o dia', 12, 3),
((SELECT id FROM questions WHERE title = 'Como está seu nível de energia durante o trabalho?' LIMIT 1), 'Baixo - Me sinto cansado frequentemente', 5, 4);

-- Alternativas para cultura (pergunta 9)
INSERT INTO alternatives (question_id, text, value, order_index) VALUES
((SELECT id FROM questions WHERE title = 'Como você se sente em relação à cultura da empresa?' LIMIT 1), 'Totalmente alinhado - É exatamente o que busco', 25, 1),
((SELECT id FROM questions WHERE title = 'Como você se sente em relação à cultura da empresa?' LIMIT 1), 'Bem alinhado - Me identifico bastante', 20, 2),
((SELECT id FROM questions WHERE title = 'Como você se sente em relação à cultura da empresa?' LIMIT 1), 'Parcialmente alinhado - Alguns aspectos me agradam', 12, 3),
((SELECT id FROM questions WHERE title = 'Como você se sente em relação à cultura da empresa?' LIMIT 1), 'Pouco alinhado - Não combina comigo', 5, 4);

-- ===============================================
-- VIEWS ÚTEIS
-- ===============================================

-- View para questões completas com alternativas
CREATE VIEW questions_with_alternatives AS
SELECT 
    q.id,
    q.category,
    q.title,
    q.description,
    q.type,
    q.order_index,
    q.is_active,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', a.id,
                'text', a.text,
                'value', a.value,
                'order_index', a.order_index
            ) ORDER BY a.order_index
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
    ) as alternatives
FROM questions q
LEFT JOIN alternatives a ON q.id = a.question_id
WHERE q.is_active = true
GROUP BY q.id, q.category, q.title, q.description, q.type, q.order_index, q.is_active
ORDER BY q.category, q.order_index;

-- View para candidatos com estatísticas
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
    COUNT(a.id) as total_answers,
    COUNT(DISTINCT a.question_id) as answered_questions
FROM candidates c
LEFT JOIN answers a ON c.id = a.candidate_id
GROUP BY c.id, c.name, c.email, c.phone, c.fit_score, c.fit_label, c.completed_at, c.created_at
ORDER BY c.created_at DESC;

-- ===============================================
-- RLS (Row Level Security) - Configuração Completa
-- ===============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- POLÍTICAS PARA QUESTIONS
-- ===============================================

-- Permitir leitura pública apenas de perguntas ativas (para o formulário)
CREATE POLICY "Public can view active questions" ON questions 
FOR SELECT 
USING (is_active = true);

-- Administradores podem gerenciar todas as perguntas
-- (Ajustar conforme seu sistema de autenticação)
CREATE POLICY "Authenticated users can manage questions" ON questions 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ===============================================
-- POLÍTICAS PARA ALTERNATIVES
-- ===============================================

-- Permitir leitura pública das alternativas de perguntas ativas
CREATE POLICY "Public can view alternatives of active questions" ON alternatives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM questions 
    WHERE questions.id = alternatives.question_id 
    AND questions.is_active = true
  )
);

-- Administradores podem gerenciar alternativas
CREATE POLICY "Authenticated users can manage alternatives" ON alternatives 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ===============================================
-- POLÍTICAS PARA CANDIDATES
-- ===============================================

-- Permitir inserção pública de candidatos (para cadastro no formulário)
CREATE POLICY "Anyone can create candidates" ON candidates 
FOR INSERT 
WITH CHECK (true);

-- Permitir que candidatos vejam apenas seus próprios dados
-- (Baseado no email - ajustar conforme necessário)
CREATE POLICY "Users can view own candidate data" ON candidates 
FOR SELECT 
USING (
  -- Se autenticado, pode ver seus dados baseado no email
  (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email')
  OR
  -- Ou se é um admin autenticado (ajustar conforme seu sistema)
  (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin')
);

-- Permitir atualização do próprio registro (para completar dados após submissão)
CREATE POLICY "Users can update own candidate data" ON candidates 
FOR UPDATE 
USING (
  -- Se autenticado, pode atualizar seus dados baseado no email
  (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email')
  OR
  -- Ou se é um admin autenticado
  (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin')
)
WITH CHECK (
  (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email')
  OR
  (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin')
);

-- Administradores podem gerenciar todos os candidatos
CREATE POLICY "Admins can manage all candidates" ON candidates 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ===============================================
-- POLÍTICAS PARA ANSWERS
-- ===============================================

-- Permitir inserção pública de respostas (para submissão do formulário)
CREATE POLICY "Anyone can create answers" ON answers 
FOR INSERT 
WITH CHECK (true);

-- Permitir que candidatos vejam apenas suas próprias respostas
CREATE POLICY "Users can view own answers" ON answers 
FOR SELECT 
USING (
  -- Verificar se o candidate_id corresponde ao usuário autenticado
  EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id = answers.candidate_id 
    AND (
      (auth.role() = 'authenticated' AND candidates.email = auth.jwt() ->> 'email')
      OR
      (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin')
    )
  )
);

-- Administradores podem gerenciar todas as respostas
CREATE POLICY "Admins can manage all answers" ON answers 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ===============================================
-- POLÍTICAS PARA VIEWS (Se necessário)
-- ===============================================

-- As views herdam as políticas das tabelas base, 
-- mas se precisar de políticas específicas:

-- CREATE POLICY "Public can view questions with alternatives" ON questions_with_alternatives
-- FOR SELECT USING (is_active = true);

-- CREATE POLICY "Admins can view candidate summaries" ON candidates_summary
-- FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ===============================================
-- FUNÇÕES AUXILIARES (Opcional)
-- ===============================================

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role' = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é o próprio usuário
CREATE OR REPLACE FUNCTION is_own_candidate(candidate_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' 
    AND candidate_email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- CONFIGURAÇÕES ADICIONAIS DE SEGURANÇA
-- ===============================================

-- Revogar acesso direto às tabelas para usuários não autenticados
-- (As políticas controlam o acesso)
REVOKE ALL ON questions FROM anon, authenticated;
REVOKE ALL ON alternatives FROM anon, authenticated;
REVOKE ALL ON candidates FROM anon, authenticated;
REVOKE ALL ON answers FROM anon, authenticated;

-- Conceder acesso às tabelas baseado nas políticas
GRANT SELECT ON questions TO anon, authenticated;
GRANT SELECT ON alternatives TO anon, authenticated;
GRANT INSERT ON candidates TO anon, authenticated;
GRANT INSERT ON answers TO anon, authenticated;

-- Para usuários autenticados (candidatos)
GRANT SELECT, UPDATE ON candidates TO authenticated;
GRANT SELECT ON answers TO authenticated;

-- Acesso às views
GRANT SELECT ON questions_with_alternatives TO anon, authenticated;
GRANT SELECT ON candidates_summary TO authenticated;

-- ===============================================
-- NOTAS IMPORTANTES
-- ===============================================

/*
CONFIGURAÇÃO PARA PRODUÇÃO:

1. Ajuste as políticas baseado no seu sistema de autenticação
2. Se não usar Supabase Auth, remova referências a auth.jwt()
3. Para acesso totalmente público (sem autenticação):
   - Remova as verificações de auth.role()
   - Mantenha apenas INSERT para candidates e answers
   - Mantenha SELECT para questions e alternatives

4. Para admin panel:
   - Configure auth.jwt() ->> 'role' = 'admin' no seu sistema
   - Ou use uma tabela separada para controle de acesso

5. Exemplo de política mais simples (sem autenticação):
   
   CREATE POLICY "Public access" ON candidates FOR INSERT WITH CHECK (true);
   CREATE POLICY "Public read questions" ON questions FOR SELECT USING (is_active = true);
*/

COMMIT;
