-- Cria a tabela para armazenar os setores
CREATE TABLE IF NOT EXISTS sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Insere a lista de setores, ignorando duplicados
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
