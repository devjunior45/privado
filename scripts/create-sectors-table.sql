-- Criar tabela de setores
CREATE TABLE IF NOT EXISTS sectors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir os setores fornecidos
INSERT INTO sectors (name) VALUES
  ('Administrativo'),
  ('Comercial e Vendas'),
  ('Financeiro e Contábil'),
  ('Recursos Humanos'),
  ('Tecnologia da Informação (TI)'),
  ('Engenharia e Técnica'),
  ('Produção e Operações'),
  ('Logística e Transporte'),
  ('Marketing e Comunicação'),
  ('Atendimento ao Cliente'),
  ('Educação'),
  ('Saúde'),
  ('Serviços Gerais'),
  ('Construção Civil'),
  ('Agro e Meio Ambiente'),
  ('Design e Criatividade'),
  ('Jurídico'),
  ('Hotelaria e Turismo')
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to sectors" ON sectors
  FOR SELECT TO authenticated
  USING (true);
