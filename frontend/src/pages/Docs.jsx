import { Code, Book, Zap, Shield, Database, Package } from 'lucide-react';

const Docs = () => {
  const API_URL = window.location.origin;
  // Assume isAdmin is true for admin users and false for regular users.
  // This would typically come from authentication context or user role.
  const isAdmin = true; 

  return (
    <div className="docs-page">
      <div className="page-header">
        <h1>Documentação da API</h1>
        <p>Guia completo para integração com a DB Empresas</p>
      </div>

      <div className="docs-container">
        <div className="docs-nav">
          <h3>Índice</h3>
          <ul>
            <li><a href="#intro">Introdução</a></li>
            <li><a href="#auth">Autenticação</a></li>
            <li><a href="#endpoints">Endpoints</a></li>
            <li><a href="#batch">Consultas em Lote</a></li>
            <li><a href="#examples">Exemplos de Código</a></li>
            <li><a href="#codes">Códigos de Referência</a></li>
            <li><a href="#errors">Códigos de Erro HTTP</a></li>
          </ul>
        </div>

        <div className="docs-content">
          <section id="intro" className="doc-section">
            <div className="section-icon">
              <Book size={32} />
            </div>
            <h2>Introdução</h2>
            <p>
              Bem-vindo à documentação da API de Consulta de CNPJs! Esta API oferece acesso programático
              aos dados públicos de empresas registradas na Receita Federal do Brasil.
            </p>
            <p>
              Com nossa API, você pode consultar informações detalhadas sobre empresas, sócios, endereços,
              CNAEs e muito mais. Perfeita para integração em sistemas de CRM, ERPs, validação de dados
              e análises de mercado.
            </p>

            <div className="info-card" style={{ marginTop: '30px', background: '#fef2f2', border: '1px solid #fca5a5', padding: '20px' }}>
              <h3 style={{ color: '#991b1b', marginBottom: '12px', fontSize: '16px' }}>
                ⚠️ Autenticação Obrigatória
              </h3>
              <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '10px' }}>
                Todas as requisições à API precisam do header:
              </p>
              <div className="code-block" style={{ marginTop: '10px' }}>
                <code style={{ fontSize: '14px' }}>X-API-Key: sua_chave_api_aqui</code>
              </div>
              <p style={{ color: '#7f1d1d', fontSize: '13px', marginTop: '12px' }}>
                Sem este header, você receberá erro 401 Unauthorized.<br/>
                Obtenha sua chave em: Dashboard → Chaves de API → Nova Chave
              </p>
            </div>
          </section>

          <section id="auth" className="doc-section">
            <div className="section-icon">
              <Shield size={32} />
            </div>
            <h2>Autenticação</h2>
            <p>Todas as requisições à API requerem autenticação via <strong>API Key</strong> no header:</p>
            <div className="code-block">
              <code>
                X-API-Key: sua_chave_api_aqui
              </code>
            </div>

            <div className="info-card" style={{ marginTop: '20px', background: '#fef3c7', border: '2px solid #f59e0b' }}>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>🔑 Como obter sua API Key:</h4>
              <ol style={{ color: '#92400e', marginLeft: '20px' }}>
                <li>Acesse a página de registro/login do sistema</li>
                <li>Crie sua conta ou faça login</li>
                <li>Acesse a página "Chaves de API" no dashboard</li>
                <li>Clique em "Nova Chave"</li>
                <li>Copie sua chave e guarde em local seguro</li>
              </ol>
            </div>

            <div className="info-card" style={{ marginTop: '20px', background: '#dbeafe', border: '2px solid #3b82f6' }}>
              <h4 style={{ color: '#1e40af', marginBottom: '8px' }}>💡 Autenticação Simplificada</h4>
              <p style={{ color: '#1e40af', fontSize: '14px' }}>
                Este sistema utiliza <strong>apenas API Key</strong> para autenticação. 
                Não é necessário gerenciar tokens JWT ou sessões. Basta incluir o header 
                <code>X-API-Key</code> em todas as suas requisições.
              </p>
            </div>

            <h3 style={{ marginTop: '24px' }}>Exemplo de Requisição Autenticada:</h3>
            <div className="code-block">
              <pre>{`GET ${API_URL}/cnpj/00000000000191
X-API-Key: sk_live_abc123xyz456...`}</pre>
            </div>
          </section>

          <section id="endpoints" className="doc-section">
            <div className="section-icon">
              <Code size={32} />
            </div>
            <h2>Endpoints Principais</h2>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj</code>
              </div>
              <p>Consulta informações completas de uma empresa por CNPJ.</p>
              <div className="endpoint-example">
                <h4>Exemplo de Requisição:</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta (200 OK):</h4>
                <pre>{`{
  "cnpj_completo": "00000000000191",
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "02",
  "uf": "DF",
  "municipio": "BRASÍLIA",
  ...
}`}</pre>
              </div>
            </div>

            {isAdmin && (
              <div className="endpoint">
                <div className="endpoint-header">
                  <span className="method get">GET</span>
                  <code>/search</code>
                </div>
                <p>Busca avançada com múltiplos filtros. Retorna resultados paginados. <strong>28 filtros disponíveis!</strong></p>

                <div className="params-table">
                  <h4>📊 Dados da Empresa:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>cnpj</code></td>
                        <td>string</td>
                        <td>CNPJ completo ou parcial</td>
                        <td>33000167</td>
                      </tr>
                      <tr>
                        <td><code>razao_social</code></td>
                        <td>string</td>
                        <td>Busca parcial (case-insensitive)</td>
                        <td>PETROBRAS</td>
                      </tr>
                      <tr>
                        <td><code>nome_fantasia</code></td>
                        <td>string</td>
                        <td>Busca parcial</td>
                        <td>Extra</td>
                      </tr>
                      <tr>
                        <td><code>natureza_juridica</code></td>
                        <td>string</td>
                        <td>Código da natureza jurídica</td>
                        <td>2062</td>
                      </tr>
                      <tr>
                        <td><code>porte</code></td>
                        <td>string</td>
                        <td>1=Micro, 2=Pequena, 3=Média, 4=Grande, 5=Demais</td>
                        <td>4</td>
                      </tr>
                      <tr>
                        <td><code>capital_social_min</code></td>
                        <td>number</td>
                        <td>Capital social mínimo</td>
                        <td>100000</td>
                      </tr>
                      <tr>
                        <td><code>capital_social_max</code></td>
                        <td>number</td>
                        <td>Capital social máximo</td>
                        <td>1000000</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>📍 Localização:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>uf</code></td>
                        <td>string</td>
                        <td>Sigla do estado</td>
                        <td>SP</td>
                      </tr>
                      <tr>
                        <td><code>municipio</code></td>
                        <td>string</td>
                        <td>Código do município (IBGE)</td>
                        <td>3550308</td>
                      </tr>
                      <tr>
                        <td><code>cep</code></td>
                        <td>string</td>
                        <td>CEP completo ou parcial</td>
                        <td>01310</td>
                      </tr>
                      <tr>
                        <td><code>bairro</code></td>
                        <td>string</td>
                        <td>Nome do bairro (busca parcial)</td>
                        <td>Centro</td>
                      </tr>
                      <tr>
                        <td><code>logradouro</code></td>
                        <td>string</td>
                        <td>Nome da rua/avenida (busca parcial)</td>
                        <td>Paulista</td>
                      </tr>
                      <tr>
                        <td><code>tipo_logradouro</code></td>
                        <td>string</td>
                        <td>Tipo do logradouro (busca parcial)</td>
                        <td>AVENIDA</td>
                      </tr>
                      <tr>
                        <td><code>numero</code></td>
                        <td>string</td>
                        <td>Número do estabelecimento</td>
                        <td>1000</td>
                      </tr>
                      <tr>
                        <td><code>complemento</code></td>
                        <td>string</td>
                        <td>Complemento do endereço</td>
                        <td>SALA</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>📊 Situação Cadastral:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>situacao_cadastral</code></td>
                        <td>string</td>
                        <td>01=Nula, 02=Ativa, 03=Suspensa, 04=Inapta, 08=Baixada</td>
                        <td>02</td>
                      </tr>
                      <tr>
                        <td><code>motivo_situacao_cadastral</code></td>
                        <td>string</td>
                        <td>Motivo da situação (busca parcial)</td>
                        <td>ENCERRAMENTO</td>
                      </tr>
                      <tr>
                        <td><code>data_situacao_cadastral_de</code></td>
                        <td>date</td>
                        <td>Data da situação cadastral DE (YYYY-MM-DD)</td>
                        <td>2020-01-01</td>
                      </tr>
                      <tr>
                        <td><code>data_situacao_cadastral_ate</code></td>
                        <td>date</td>
                        <td>Data da situação cadastral ATÉ (YYYY-MM-DD)</td>
                        <td>2024-12-31</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>📅 Datas:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>data_inicio_atividade_min</code></td>
                        <td>date</td>
                        <td>Data de início mínima (YYYY-MM-DD)</td>
                        <td>2020-01-01</td>
                      </tr>
                      <tr>
                        <td><code>data_inicio_atividade_max</code></td>
                        <td>date</td>
                        <td>Data de início máxima (YYYY-MM-DD)</td>
                        <td>2024-12-31</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>🏭 Atividade Econômica:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>cnae</code></td>
                        <td>string</td>
                        <td>CNAE principal (atividade econômica)</td>
                        <td>4712100</td>
                      </tr>
                      <tr>
                        <td><code>cnae_secundario</code></td>
                        <td>string</td>
                        <td>CNAE secundário (busca parcial)</td>
                        <td>6421</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>🏪 Tipo de Estabelecimento:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>identificador_matriz_filial</code></td>
                        <td>string</td>
                        <td>1=Matriz, 2=Filial</td>
                        <td>1</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>💼 Regime Tributário:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>simples</code></td>
                        <td>string</td>
                        <td>Optante pelo Simples Nacional (S/N)</td>
                        <td>S</td>
                      </tr>
                      <tr>
                        <td><code>mei</code></td>
                        <td>string</td>
                        <td>Optante pelo MEI (S/N)</td>
                        <td>S</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '24px' }}>📄 Paginação:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parâmetro</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>page</code></td>
                        <td>number</td>
                        <td>Número da página (padrão: 1)</td>
                        <td>1</td>
                      </tr>
                      <tr>
                        <td><code>per_page</code></td>
                        <td>number</td>
                        <td>Itens por página (padrão: 20, máx: 100)</td>
                        <td>50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="endpoint-example">
                  <h4>Formato de Resposta:</h4>
                  <pre>{`{
  "total": 1234,
  "page": 1,
  "per_page": 20,
  "total_pages": 62,
  "items": [...]
}`}</pre>

                  <h4>Exemplos de Requisição:</h4>
                  <pre>{`# Empresas ativas em SP
GET ${API_URL}/search?uf=SP&situacao_cadastral=02

# Grandes empresas com capital > 1 milhão
GET ${API_URL}/search?porte=4&capital_social_min=1000000

# MEIs no RJ
GET ${API_URL}/search?mei=S&uf=RJ&situacao_cadastral=02

# Empresas abertas em 2024
GET ${API_URL}/search?data_inicio_atividade_de=2024-01-01&data_inicio_atividade_ate=2024-12-31`}</pre>
                </div>
              </div>
            )}

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj/socios</code>
              </div>
              <p>Lista os sócios de uma empresa.</p>
              <div className="endpoint-example">
                <h4>Exemplo:</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191/socios
X-API-Key: sua_chave_api`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj/cnaes-secundarios</code>
              </div>
              <p>Retorna todos os CNAEs secundários de uma empresa com suas descrições completas.</p>
              <div className="endpoint-example">
                <h4>O que são CNAEs Secundários?</h4>
                <p style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                  CNAEs secundários são as atividades econômicas complementares que uma empresa pode exercer, além da sua atividade principal (CNAE principal).
                </p>
                <h4>Performance:</h4>
                <p>Resultados em cache por 1 hora para consultas otimizadas</p>
                <h4>Exemplo de Requisição:</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191/cnaes-secundarios
X-API-Key: sua_chave_api`}</pre>
                <h4>Exemplo de Resposta:</h4>
                <pre>{`[
  {
    "codigo": "6421200",
    "descricao": "Bancos comerciais"
  },
  {
    "codigo": "6422100",
    "descricao": "Bancos múltiplos, com carteira comercial"
  },
  {
    "codigo": "6423900",
    "descricao": "Caixas econômicas"
  }
]`}</pre>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#059669' }}>
                  ✅ <strong>Dica:</strong> Use este endpoint para entender todas as atividades que a empresa está autorizada a exercer.
                </p>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/socios/search</code>
              </div>
              <p>Busca avançada de sócios com filtros. Ideal para encontrar empresas através de características dos sócios.</p>
              <div className="params-table">
                <h4>Parâmetros disponíveis:</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Parâmetro</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Valores/Exemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>nome_socio</code></td>
                      <td>string</td>
                      <td>Nome do sócio (busca parcial, case-insensitive)</td>
                      <td>JOÃO SILVA</td>
                    </tr>
                    <tr>
                      <td><code>cpf_cnpj</code></td>
                      <td>string</td>
                      <td>CPF ou CNPJ do sócio (completo ou parcial)</td>
                      <td>12345678900</td>
                    </tr>
                    <tr>
                      <td><code>identificador_socio</code></td>
                      <td>string</td>
                      <td>Tipo de sócio: 1=PJ, 2=PF, 3=Estrangeiro</td>
                      <td>2</td>
                    </tr>
                    <tr>
                      <td><code>qualificacao_socio</code></td>
                      <td>string</td>
                      <td>Qualificação: 05=Administrador, 10=Diretor, 16=Presidente, 49=Sócio-Administrador</td>
                      <td>05</td>
                    </tr>
                    <tr>
                      <td><code>faixa_etaria</code></td>
                      <td>string</td>
                      <td>Faixa etária: 1=0-12, 2=13-20, 3=21-30, 4=31-40, 5=41-50, 6=51-60, 7=61-70, 8=71-80, 9=80+</td>
                      <td>4</td>
                    </tr>
                    <tr>
                      <td><code>limit</code></td>
                      <td>number</td>
                      <td>Limite de resultados (padrão: 100, máx: 1000)</td>
                      <td>500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="endpoint-example">
                <h4>Exemplos:</h4>
                <pre>{`# Buscar pessoas físicas que são administradores
GET ${API_URL}/socios/search?identificador_socio=2&qualificacao_socio=05

# Buscar sócios com CPF específico
GET ${API_URL}/socios/search?cpf_cnpj=12345678900

# Buscar sócios por nome
GET ${API_URL}/socios/search?nome_socio=SILVA&limit=50

# Buscar sócios de faixa etária 31-40 anos
GET ${API_URL}/socios/search?faixa_etaria=4&identificador_socio=2`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnaes</code>
              </div>
              <p>Lista códigos CNAE (atividades econômicas) com suas descrições.</p>
              <div className="params-table">
                <h4>Parâmetros opcionais:</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Parâmetro</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>search</code></td>
                      <td>string</td>
                      <td>Busca parcial na descrição</td>
                    </tr>
                    <tr>
                      <td><code>limit</code></td>
                      <td>number</td>
                      <td>Limite de resultados (padrão: 100)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="endpoint-example">
                <h4>Exemplo:</h4>
                <pre>{`GET ${API_URL}/cnaes?search=comercio&limit=50
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta:</h4>
                <pre>{`[
  {
    "codigo": "4711302",
    "descricao": "Comércio varejista de mercadorias em geral..."
  }
]`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/municipios/:uf</code>
              </div>
              <p>Lista todos os municípios de um estado.</p>
              <div className="endpoint-example">
                <h4>Exemplo:</h4>
                <pre>{`GET ${API_URL}/municipios/SP
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta:</h4>
                <pre>{`[
  {
    "codigo": "3550308",
    "descricao": "SAO PAULO"
  },
  {
    "codigo": "3509502",
    "descricao": "CAMPINAS"
  }
]`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/stats</code>
              </div>
              <p>Retorna estatísticas gerais do banco de dados (não requer autenticação).</p>
              <div className="endpoint-example">
                <h4>Resposta:</h4>
                <pre>{`{
  "total_empresas": 52678123,
  "total_estabelecimentos": 60345892,
  "total_socios": 31234567,
  "total_cnaes": 1358,
  "total_municipios": 5570
}`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/api/v1/cnpj/:cnpj/socios</code>
              </div>
              <p>Retorna os sócios de uma empresa (máximo 1.000 resultados).</p>
              <div className="endpoint-example">
                <h4>Base de dados:</h4>
                <p>26,5 milhões de sócios cadastrados</p>
                <h4>Performance:</h4>
                <p>Consulta otimizada com cache de 30 minutos</p>
                <h4>Exemplo de Requisição:</h4>
                <pre>{`GET ${API_URL}/api/v1/cnpj/00000000000191/socios
X-API-Key: sua_chave_api`}</pre>
                <h4>Exemplo de Resposta:</h4>
                <pre>{`[
  {
    "cnpj_basico": "00000000",
    "identificador_socio": "2",
    "nome_socio": "JOÃO DA SILVA",
    "cnpj_cpf_socio": "***123456**",
    "qualificacao_socio": "49",
    "data_entrada_sociedade": "2020-01-15"
  }
]`}</pre>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#dc2626' }}>
                  ⚠️ <strong>Nota:</strong> Por questões de performance, empresas com mais de 1.000 sócios terão seus resultados limitados.
                </p>
              </div>
            </div>
          </section>

          <section id="batch" className="doc-section">
            <div className="section-icon">
              <Package size={32} />
            </div>
            <h2>⚡ Consultas em Lote (Batch Queries)</h2>

            <div className="info-card" style={{ background: '#dbeafe', border: '2px solid #3b82f6', marginBottom: '24px' }}>
              <h3 style={{ color: '#1e40af', marginBottom: '12px' }}>📦 O que são Consultas em Lote?</h3>
              <p style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
                Consultas em lote permitem que você pesquise <strong>milhares de empresas de uma vez</strong> usando filtros avançados
                como CNAE, localização, porte empresarial, capital social, e muito mais. É a solução ideal para:
              </p>
              <ul style={{ color: '#1e40af', marginLeft: '20px', marginTop: '12px' }}>
                <li>📊 Análises de mercado e inteligência competitiva</li>
                <li>🎯 Prospecção de clientes em segmentos específicos</li>
                <li>📈 Estudos de viabilidade e pesquisas de mercado</li>
                <li>🔍 Mapeamento de concorrentes por região/setor</li>
              </ul>
            </div>

            <h3>🎯 Como Funciona?</h3>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '24px' }}>
              <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>Compre um pacote de créditos</strong> (pagamento único via Stripe)</li>
                <li><strong>Use o endpoint /batch/search</strong> com seus filtros desejados</li>
                <li><strong>Cada empresa retornada consome 1 crédito</strong></li>
                <li><strong>Créditos não expiram</strong> - use quando precisar!</li>
              </ol>
            </div>

            <h3>💰 Pacotes Disponíveis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '2px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>Starter</h4>
                <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>1.000</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>créditos</p>
                <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#374151', fontWeight: '500' }}>~R$ 0,10/crédito</p>
              </div>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '2px solid #8b5cf6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>Business</h4>
                <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>5.000</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>créditos</p>
                <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#374151', fontWeight: '500' }}>~R$ 0,08/crédito</p>
              </div>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '2px solid #10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>Enterprise</h4>
                <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>25.000</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>créditos</p>
                <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#374151', fontWeight: '500' }}>~R$ 0,06/crédito</p>
              </div>
            </div>

            <div className="info-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b', marginBottom: '24px' }}>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>💡 Dica de Economia</h4>
              <p style={{ color: '#92400e', fontSize: '14px' }}>
                Quanto maior o pacote, menor o custo por crédito! Economize até <strong>40%</strong> comprando pacotes maiores.
                Os créditos nunca expiram, então você pode comprar agora e usar quando quiser.
              </p>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/api/v1/batch/search</code>
              </div>
              <p>Executa uma busca em lote com filtros avançados. Retorna empresas que correspondem aos critérios.</p>

              <div className="params-table">
                <h4>📊 Filtros Disponíveis (Corpo da Requisição - JSON):</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Parâmetro</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Exemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>razao_social</code></td>
                      <td>string</td>
                      <td>Busca parcial na razão social</td>
                      <td>"TECH"</td>
                    </tr>
                    <tr>
                      <td><code>cnae</code></td>
                      <td>string</td>
                      <td>Código CNAE (atividade econômica)</td>
                      <td>"6201500"</td>
                    </tr>
                    <tr>
                      <td><code>uf</code></td>
                      <td>string</td>
                      <td>Sigla do estado</td>
                      <td>"SP"</td>
                    </tr>
                    <tr>
                      <td><code>municipio</code></td>
                      <td>string</td>
                      <td>Código do município (IBGE)</td>
                      <td>"3550308"</td>
                    </tr>
                    <tr>
                      <td><code>porte</code></td>
                      <td>string</td>
                      <td>1=Micro, 2=Pequena, 3=Média, 4=Grande</td>
                      <td>"4"</td>
                    </tr>
                    <tr>
                      <td><code>situacao_cadastral</code></td>
                      <td>string</td>
                      <td>02=Ativa, 04=Inapta, 08=Baixada</td>
                      <td>"02"</td>
                    </tr>
                    <tr>
                      <td><code>capital_social_min</code></td>
                      <td>number</td>
                      <td>Capital social mínimo</td>
                      <td>1000000</td>
                    </tr>
                    <tr>
                      <td><code>capital_social_max</code></td>
                      <td>number</td>
                      <td>Capital social máximo</td>
                      <td>10000000</td>
                    </tr>
                    <tr>
                      <td><code>limit</code></td>
                      <td>number</td>
                      <td>Limite de resultados (máx: 10.000)</td>
                      <td>100</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="endpoint-example">
                <h4>💳 Consumo de Créditos:</h4>
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
                    ⚠️ <strong>Importante:</strong> Cada empresa retornada na resposta consome <strong>1 crédito</strong>.
                    Se sua busca retornar 500 empresas, você gastará 500 créditos. Use o parâmetro <code>limit</code> para
                    controlar o consumo.
                  </p>
                </div>

                <h4>Exemplo 1: Buscar empresas de tecnologia ativas em SP</h4>
                <pre>{`POST ${API_URL}/api/v1/batch/search
X-API-Key: sua_chave_api
Content-Type: application/json

{
  "cnae": "6201500",
  "uf": "SP",
  "situacao_cadastral": "02",
  "limit": 100
}

Resposta:
{
  "success": true,
  "total_found": 1234,
  "returned": 100,
  "credits_used": 100,
  "remaining_credits": 900,
  "results": [
    {
      "cnpj": "12345678000190",
      "razao_social": "TECH SOLUTIONS LTDA",
      "nome_fantasia": "TECH SOLUTIONS",
      "cnae": "6201500",
      "uf": "SP",
      "municipio": "SAO PAULO",
      "porte": "2",
      "capital_social": "50000.00",
      "situacao_cadastral": "02"
    },
    ...
  ]
}`}</pre>

                <h4>Exemplo 2: Grandes empresas com capital maior que R$ 1 milhão no RJ</h4>
                <pre>{`POST ${API_URL}/api/v1/batch/search
X-API-Key: sua_chave_api
Content-Type: application/json

{
  "uf": "RJ",
  "porte": "4",
  "capital_social_min": 1000000,
  "situacao_cadastral": "02",
  "limit": 50
}

# Retorna até 50 empresas
# Consome 50 créditos (ou menos se houver menos resultados)`}</pre>

                <h4>Exemplo 3: Buscar por razão social parcial</h4>
                <pre>{`POST ${API_URL}/api/v1/batch/search
X-API-Key: sua_chave_api
Content-Type: application/json

{
  "razao_social": "RESTAURANTE",
  "uf": "SP",
  "municipio": "3550308",
  "limit": 200
}

# Busca todas as empresas com "RESTAURANTE" no nome
# em São Paulo/SP, retorna até 200 resultados`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/api/v1/batch/credits</code>
              </div>
              <p>Consulta o saldo atual de créditos de consultas em lote.</p>
              <div className="endpoint-example">
                <h4>Exemplo de Requisição:</h4>
                <pre>{`GET ${API_URL}/api/v1/batch/credits
X-API-Key: sua_chave_api

Resposta:
{
  "total_credits": 1000,
  "used_credits": 250,
  "remaining_credits": 750
}`}</pre>
              </div>
            </div>

            <div className="info-card" style={{ background: '#d1fae5', border: '2px solid #10b981', marginTop: '24px' }}>
              <h4 style={{ color: '#065f46', marginBottom: '8px' }}>✅ Boas Práticas</h4>
              <ul style={{ color: '#065f46', marginLeft: '20px', fontSize: '14px' }}>
                <li>Sempre use o parâmetro <code>limit</code> para controlar o consumo de créditos</li>
                <li>Teste suas buscas com limites baixos primeiro (ex: limit=10)</li>
                <li>Combine múltiplos filtros para resultados mais precisos</li>
                <li>Verifique seu saldo de créditos antes de executar buscas grandes</li>
                <li>Créditos não expiram - compre pacotes maiores para economizar!</li>
              </ul>
            </div>
          </section>

          <section id="examples" className="doc-section">
            <div className="section-icon">
              <Code size={32} />
            </div>
            <h2>Exemplos de Código</h2>

            <div className="info-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b', marginBottom: '24px' }}>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>🔑 Antes de começar:</h4>
              <ol style={{ color: '#92400e', marginLeft: '20px' }}>
                <li>Obtenha sua chave de API na página <a href="/api-keys" style={{ color: '#b45309', fontWeight: 'bold' }}>API Keys</a></li>
                <li>Substitua <code>sua_chave_api_aqui</code> pela sua chave nos exemplos abaixo</li>
                <li>Use a URL base: <code>{API_URL}</code></li>
              </ol>
            </div>

            <h3>JavaScript / Node.js</h3>
            <div className="code-block">
              <pre>{`const axios = require('axios');

const api = axios.create({
  baseURL: '${API_URL}',
  headers: {
    'X-API-Key': 'sua_chave_api_aqui'
  }
});

// Consultar CNPJ específico
const consultarCNPJ = async (cnpj) => {
  try {
    const response = await api.get(\`/cnpj/\${cnpj}\`);
    console.log(response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
};

consultarCNPJ('00000000000191');

${isAdmin ? `
// Buscar empresas com filtros (APENAS ADMIN)
const buscarEmpresas = async () => {
  try {
    const response = await api.get('/search', {
      params: {
        uf: 'SP',
        situacao_cadastral: '02',
        page: 1,
        per_page: 20
      }
    });
    console.log('Total:', response.data.total);
    console.log('Empresas:', response.data.items);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
};

buscarEmpresas();` : '// Endpoint /search disponível apenas para administrador'}

// Listar sócios de uma empresa
const listarSocios = async (cnpj) => {
  try {
    const response = await api.get(\`/cnpj/\${cnpj}/socios\`);
    console.log('Sócios:', response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
};

listarSocios('00000000000191');

// Buscar CNAEs secundários de uma empresa
const buscarCNAEsSecundarios = async (cnpj) => {
  try {
    const response = await api.get(\`/cnpj/\${cnpj}/cnaes-secundarios\`);
    console.log('CNAEs Secundários:', response.data);
    response.data.forEach(cnae => {
      console.log(\`- [\${cnae.codigo}] \${cnae.descricao}\`);
    });
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
};

buscarCNAEsSecundarios('00000000000191');`}</pre>
            </div>

            <h3>Python</h3>
            <div className="code-block">
              <pre>{`import requests

API_URL = '${API_URL}'
API_KEY = 'sua_chave_api_aqui'

headers = {
    'X-API-Key': API_KEY
}

# Consultar CNPJ específico
def consultar_cnpj(cnpj):
    response = requests.get(f'{API_URL}/cnpj/{cnpj}', headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Erro: {response.status_code} - {response.text}')
        return None

# Exemplo de uso
resultado = consultar_cnpj('00000000000191')
if resultado:
    print(f"Razão Social: {resultado['razao_social']}")
    print(f"CNPJ: {resultado['cnpj_completo']}")

${isAdmin ? `
# 2. Buscar empresas com filtros (APENAS ADMIN)
def buscar_empresas(filtros):
    response = requests.get(f'{API_URL}/search', params=filtros, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Erro: {response.status_code} - {response.text}')
        return None

# Exemplo: Buscar empresas de grande porte em SP, ativas
filtros = {
    "uf": "SP",
    "porte": "4",
    "situacao_cadastral": "02",
    "page": 1,
    "per_page": 50
}

resultado = buscar_empresas(filtros)
if resultado:
    print(f"Total de empresas encontradas: {resultado['total']}")
    print(f"Página {resultado['page']} de {resultado['total_pages']}")
    
    for empresa in resultado['items']:
        print(f"{empresa['cnpj_completo']} - {empresa['razao_social']}")` : '# Endpoint /search disponível apenas para administrador'}

# 3. Listar sócios
def listar_socios(cnpj):
    response = requests.get(f'{API_URL}/cnpj/{cnpj}/socios', headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Erro: {response.status_code}')
        return None

socios = listar_socios('00000000000191')
if socios:
    print(f'Encontrados {len(socios)} sócios')
    for socio in socios:
        print(f"- {socio['nome_socio']}")

# 4. Buscar CNAEs secundários
def buscar_cnaes_secundarios(cnpj):
    response = requests.get(f'{API_URL}/cnpj/{cnpj}/cnaes-secundarios', headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Erro: {response.status_code}')
        return None

cnaes = buscar_cnaes_secundarios('00000000000191')
if cnaes:
    print(f'Encontrados {len(cnaes)} CNAEs secundários:')
    for cnae in cnaes:
        print(f"- [{cnae['codigo']}] {cnae['descricao']}")`}</pre>
            </div>

            <h3>PHP</h3>
            <div className="code-block">
              <pre>{`<?php

$apiUrl = '${API_URL}';
$apiKey = 'sua_chave_api_aqui';

// Função auxiliar para fazer requisições
function apiRequest($url, $apiKey) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-Key: ' . $apiKey
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        echo "Erro $httpCode: $response\\n";
        return null;
    }
}

// Consultar CNPJ
$cnpj = '00000000000191';
$empresa = apiRequest("$apiUrl/cnpj/$cnpj", $apiKey);
if ($empresa) {
    echo "Razão Social: " . $empresa['razao_social'] . "\\n";
}

${isAdmin ? `
// Buscar empresas com filtros (APENAS ADMIN)
$params = http_build_query([
    'uf' => 'SP',
    'situacao_cadastral' => '02',
    'page' => 1
]);
$resultado = apiRequest("$apiUrl/search?$params", $apiKey);
if ($resultado) {
    echo "Total: " . $resultado['total'] . "\\n";
    foreach ($resultado['items'] as $emp) {
        echo $emp['razao_social'] . " - " . $emp['cnpj_completo'] . "\\n";
    }
}` : '// Endpoint /search disponível apenas para administrador'}

// Buscar CNAEs secundários
$cnpj = '00000000000191';
$cnaes = apiRequest("$apiUrl/cnpj/$cnpj/cnaes-secundarios", $apiKey);
if ($cnaes) {
    echo "Encontrados " . count($cnaes) . " CNAEs secundários:\\n";
    foreach ($cnaes as $cnae) {
        echo "- [" . $cnae['codigo'] . "] " . $cnae['descricao'] . "\\n";
    }
}

?>`}</pre>
            </div>

            <h3>cURL (Terminal)</h3>
            <div className="code-block">
              <pre>{`# Consultar CNPJ específico
curl -X GET "${API_URL}/cnpj/00000000000191" \\
  -H "X-API-Key: sua_chave_api"

${isAdmin ? `# 2. Buscar empresas ativas em SP (APENAS ADMIN)
curl -X GET "${API_URL}/search?uf=SP&situacao_cadastral=02&page=1&per_page=20" \\
  -H "X-API-Key: sua_chave_api"

# 3. Buscar empresas com múltiplos filtros (APENAS ADMIN)
curl -X GET "${API_URL}/search?uf=RJ&porte=4&capital_social_min=1000000&simples=N&identificador_matriz_filial=1" \\
  -H "X-API-Key: sua_chave_api"` : '# Endpoints /search disponíveis apenas para administrador'}

# Listar sócios de uma empresa
curl -X GET "${API_URL}/cnpj/00000000000191/socios" \\
  -H "X-API-Key: sua_chave_api"

# Buscar CNAEs secundários de uma empresa
curl -X GET "${API_URL}/cnpj/00000000000191/cnaes-secundarios" \\
  -H "X-API-Key: sua_chave_api"

# Buscar por razão social
curl -X GET "${API_URL}/search?razao_social=petrobras&page=1" \\
  -H "X-API-Key: sua_chave_api"

# Ver estatísticas gerais (não requer API Key)
curl -X GET "${API_URL}/stats"`}</pre>
            </div>

            <div className="info-card" style={{ marginTop: '32px', background: '#dbeafe', border: '2px solid #3b82f6' }}>
              <h4 style={{ color: '#1e40af', marginBottom: '12px' }}>💡 Dicas de Integração</h4>
              <ul style={{ color: '#1e40af', marginLeft: '20px', fontSize: '14px' }}>
                <li>Sempre trate os erros adequadamente (400, 401, 404, 429, 500)</li>
                <li>Use paginação para grandes resultados (parâmetros <code>page</code> e <code>per_page</code>)</li>
                <li>Armazene sua API Key de forma segura (variáveis de ambiente)</li>
                <li>Implemente cache local para reduzir requisições repetidas</li>
                <li>Respeite os limites de rate limiting do seu plano</li>
              </ul>
            </div>

            <div className="info-card" style={{ marginTop: '20px', background: '#fee2e2', border: '2px solid #ef4444' }}>
              <h4 style={{ color: '#991b1b', marginBottom: '8px' }}>⚠️ Importante: Segurança</h4>
              <ul style={{ color: '#991b1b', marginLeft: '20px', fontSize: '14px' }}>
                <li><strong>NUNCA</strong> exponha sua API Key em código frontend público</li>
                <li><strong>NUNCA</strong> commit suas chaves no Git/GitHub</li>
                <li>Use variáveis de ambiente para armazenar credenciais</li>
                <li>Crie chaves diferentes para ambientes de teste e produção</li>
                <li>Revogue imediatamente chaves comprometidas</li>
              </ul>
            </div>
          </section>

          <section id="codes" className="doc-section">
            <div className="section-icon">
              <Database size={32} />
            </div>
            <h2>Códigos de Referência</h2>
            <p>Valores válidos para usar nos filtros da API:</p>

            <div className="info-card" style={{ background: '#f0f9ff', border: '2px solid #0ea5e9', marginBottom: '24px' }}>
              <h3 style={{ color: '#0c4a6e', marginBottom: '16px' }}>📊 Situação Cadastral</h3>
              <table className="errors-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Uso Comum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>01</code></td>
                    <td>Nula</td>
                    <td>Empresa sem validade jurídica</td>
                  </tr>
                  <tr>
                    <td><code>02</code></td>
                    <td>Ativa</td>
                    <td>⭐ Mais usado - empresa em funcionamento</td>
                  </tr>
                  <tr>
                    <td><code>03</code></td>
                    <td>Suspensa</td>
                    <td>Empresa com atividades suspensas</td>
                  </tr>
                  <tr>
                    <td><code>04</code></td>
                    <td>Inapta</td>
                    <td>Empresa irregular perante a Receita</td>
                  </tr>
                  <tr>
                    <td><code>08</code></td>
                    <td>Baixada</td>
                    <td>Empresa encerrada</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b', marginBottom: '24px' }}>
              <h3 style={{ color: '#92400e', marginBottom: '16px' }}>🏢 Porte da Empresa</h3>
              <table className="errors-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Característica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>1</code></td>
                    <td>Micro Empresa</td>
                    <td>Faturamento até R$ 360 mil/ano</td>
                  </tr>
                  <tr>
                    <td><code>2</code></td>
                    <td>Empresa de Pequeno Porte</td>
                    <td>Faturamento até R$ 4,8 milhões/ano</td>
                  </tr>
                  <tr>
                    <td><code>3</code></td>
                    <td>Empresa de Médio Porte</td>
                    <td>Faturamento intermediário</td>
                  </tr>
                  <tr>
                    <td><code>4</code></td>
                    <td>Grande Empresa</td>
                    <td>Alto faturamento</td>
                  </tr>
                  <tr>
                    <td><code>5</code></td>
                    <td>Demais</td>
                    <td>Sem classificação específica</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-card" style={{ background: '#f0fdf4', border: '2px solid #22c55e', marginBottom: '24px' }}>
              <h3 style={{ color: '#14532d', marginBottom: '16px' }}>🏪 Identificador Matriz/Filial</h3>
              <table className="errors-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Quando Usar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>1</code></td>
                    <td>Matriz</td>
                    <td>Sede principal da empresa</td>
                  </tr>
                  <tr>
                    <td><code>2</code></td>
                    <td>Filial</td>
                    <td>Unidades secundárias</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-card" style={{ background: '#fae8ff', border: '2px solid #a855f7', marginBottom: '24px' }}>
              <h3 style={{ color: '#581c87', marginBottom: '16px' }}>💼 Regime Tributário</h3>
              <table className="errors-table">
                <thead>
                  <tr>
                    <th>Parâmetro</th>
                    <th>Valor</th>
                    <th>Significado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>simples</code></td>
                    <td>S</td>
                    <td>Optante pelo Simples Nacional</td>
                  </tr>
                  <tr>
                    <td><code>simples</code></td>
                    <td>N</td>
                    <td>Não optante pelo Simples Nacional</td>
                  </tr>
                  <tr>
                    <td><code>mei</code></td>
                    <td>S</td>
                    <td>Microempreendedor Individual</td>
                  </tr>
                  <tr>
                    <td><code>mei</code></td>
                    <td>N</td>
                    <td>Não é MEI</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-card" style={{ background: '#ffe4e6', border: '2px solid #f43f5e', marginBottom: '24px' }}>
              <h3 style={{ color: '#881337', marginBottom: '16px' }}>📅 Formato de Datas</h3>
              <p style={{ color: '#881337', marginBottom: '12px' }}>
                Todas as datas devem estar no formato <strong>YYYY-MM-DD</strong> (Ano-Mês-Dia):
              </p>
              <ul style={{ color: '#881337', marginLeft: '20px' }}>
                <li>✅ Correto: <code>2024-01-15</code></li>
                <li>✅ Correto: <code>2020-12-31</code></li>
                <li>❌ Errado: <code>15/01/2024</code></li>
                <li>❌ Errado: <code>2024/01/15</code></li>
              </ul>
            </div>
          </section>

          <section id="errors" className="doc-section">
            <div className="section-icon">
              <Shield size={32} />
            </div>
            <h2>Códigos de Erro HTTP</h2>
            <table className="errors-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Solução</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>400</code></td>
                  <td>Bad Request</td>
                  <td>Verifique os parâmetros enviados</td>
                </tr>
                <tr>
                  <td><code>401</code></td>
                  <td>Unauthorized</td>
                  <td>API Key não fornecida ou inválida</td>
                </tr>
                <tr>
                  <td><code>404</code></td>
                  <td>Not Found</td>
                  <td>CNPJ não encontrado no banco</td>
                </tr>
                <tr>
                  <td><code>429</code></td>
                  <td>Too Many Requests</td>
                  <td>Limite de requisições excedido</td>
                </tr>
                <tr>
                  <td><code>500</code></td>
                  <td>Internal Server Error</td>
                  <td>Erro no servidor, contate o suporte</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Docs;