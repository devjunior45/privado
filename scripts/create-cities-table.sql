-- Criar tabela de cidades
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  region VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Inserir principais cidades brasileiras
INSERT INTO cities (name, state, region) VALUES
-- Norte
('Manaus', 'AM', 'Norte'),
('Belém', 'PA', 'Norte'),
('Porto Velho', 'RO', 'Norte'),
('Rio Branco', 'AC', 'Norte'),
('Macapá', 'AP', 'Norte'),
('Boa Vista', 'RR', 'Norte'),
('Palmas', 'TO', 'Norte'),

-- Nordeste
('Salvador', 'BA', 'Nordeste'),
('Fortaleza', 'CE', 'Nordeste'),
('Recife', 'PE', 'Nordeste'),
('São Luís', 'MA', 'Nordeste'),
('Natal', 'RN', 'Nordeste'),
('João Pessoa', 'PB', 'Nordeste'),
('Maceió', 'AL', 'Nordeste'),
('Aracaju', 'SE', 'Nordeste'),
('Teresina', 'PI', 'Nordeste'),
('Feira de Santana', 'BA', 'Nordeste'),
('Jaboatão dos Guararapes', 'PE', 'Nordeste'),
('Olinda', 'PE', 'Nordeste'),
('Caruaru', 'PE', 'Nordeste'),

-- Centro-Oeste
('Brasília', 'DF', 'Centro-Oeste'),
('Goiânia', 'GO', 'Centro-Oeste'),
('Campo Grande', 'MS', 'Centro-Oeste'),
('Cuiabá', 'MT', 'Centro-Oeste'),
('Anápolis', 'GO', 'Centro-Oeste'),
('Dourados', 'MS', 'Centro-Oeste'),

-- Sudeste
('São Paulo', 'SP', 'Sudeste'),
('Rio de Janeiro', 'RJ', 'Sudeste'),
('Belo Horizonte', 'MG', 'Sudeste'),
('Vitória', 'ES', 'Sudeste'),
('Guarulhos', 'SP', 'Sudeste'),
('Campinas', 'SP', 'Sudeste'),
('São Bernardo do Campo', 'SP', 'Sudeste'),
('Santo André', 'SP', 'Sudeste'),
('Osasco', 'SP', 'Sudeste'),
('São José dos Campos', 'SP', 'Sudeste'),
('Ribeirão Preto', 'SP', 'Sudeste'),
('Sorocaba', 'SP', 'Sudeste'),
('Contagem', 'MG', 'Sudeste'),
('Uberlândia', 'MG', 'Sudeste'),
('Juiz de Fora', 'MG', 'Sudeste'),
('Nova Iguaçu', 'RJ', 'Sudeste'),
('Niterói', 'RJ', 'Sudeste'),
('Campos dos Goytacazes', 'RJ', 'Sudeste'),
('Vila Velha', 'ES', 'Sudeste'),
('Serra', 'ES', 'Sudeste'),

-- Sul
('Porto Alegre', 'RS', 'Sul'),
('Curitiba', 'PR', 'Sul'),
('Florianópolis', 'SC', 'Sul'),
('Caxias do Sul', 'RS', 'Sul'),
('Pelotas', 'RS', 'Sul'),
('Canoas', 'RS', 'Sul'),
('Londrina', 'PR', 'Sul'),
('Maringá', 'PR', 'Sul'),
('Ponta Grossa', 'PR', 'Sul'),
('Cascavel', 'PR', 'Sul'),
('Joinville', 'SC', 'Sul'),
('Blumenau', 'SC', 'Sul'),
('Caxias do Sul', 'RS', 'Sul')
ON CONFLICT (name, state) DO NOTHING;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
