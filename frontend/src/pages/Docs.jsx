import { Code, Book, Shield, Database, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Docs = () => {
  const { isAdmin } = useAuth();
  const API_URL = 'https://www.dbempresas.com.br/api/v1';
  const showAdmin = isAdmin();

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
            <div className="section-icon"><Book size={22} /></div>
            <h2>Introdução</h2>
            <p>
              Bem-vindo à documentação da API de consulta de CNPJs. Esta API oferece acesso programático
              aos dados públicos de empresas registradas na Receita Federal do Brasil.
            </p>
            <p>
              Com a API você consulta informações detalhadas sobre empresas, sócios, endereços,
              CNAEs e muito mais. Ideal para integração em sistemas de CRM, ERPs, validação de dados
              e análises de mercado.
            </p>

            <div className="docs-callout warn">
              <h4>Autenticação obrigatória</h4>
              <p>Os endpoints de consulta de dados precisam do header:</p>
              <div className="code-block" style={{ marginTop: '10px' }}>
                <code>X-API-Key: sua_chave_api_aqui</code>
              </div>
              <p style={{ marginTop: '12px' }}>
                Sem este header, você receberá erro 401 Unauthorized. Obtenha sua chave em
                Dashboard → Chaves de API → Nova chave.
              </p>
            </div>
          </section>

          <section id="auth" className="doc-section">
            <div className="section-icon"><Shield size={22} /></div>
            <h2>Autenticação</h2>
            <p>Os endpoints de consulta de dados requerem autenticação via <strong>API Key</strong> no header:</p>
            <div className="code-block">
              <code>X-API-Key: sua_chave_api_aqui</code>
            </div>

            <div className="docs-callout">
              <h4>Como obter sua API Key</h4>
              <ol>
                <li>Acesse a página de registro/login do sistema</li>
                <li>Crie sua conta ou faça login</li>
                <li>Acesse a página "Chaves de API" no dashboard</li>
                <li>Clique em "Nova chave"</li>
                <li>Copie sua chave e guarde em local seguro</li>
              </ol>
            </div>

            <div className="docs-callout info">
              <h4>Dois tipos de autenticação</h4>
              <p>
                Os endpoints de consulta de dados (CNPJ, busca, sócios, CNAEs, municípios e
                consultas em lote via <code>/batch/search</code>) usam apenas o header <code>X-API-Key</code>.
                Já os endpoints de conta — <code>/stats</code>, <code>/batch/credits</code> e{' '}
                <code>/batch/usage</code> — exigem o token JWT da sua sessão web, enviado no header{' '}
                <code>Authorization: Bearer &lt;token&gt;</code> (obtido ao fazer login no dashboard).
              </p>
            </div>

            <h3>Exemplo de requisição autenticada</h3>
            <div className="code-block">
              <pre>{`GET ${API_URL}/cnpj/00000000000191
X-API-Key: sk_live_abc123xyz456...`}</pre>
            </div>
          </section>

          <section id="endpoints" className="doc-section">
            <div className="section-icon"><Code size={22} /></div>
            <h2>Endpoints principais</h2>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj</code>
              </div>
              <p>Consulta informações completas de uma empresa por CNPJ.</p>
              <div className="endpoint-example">
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta (200 OK)</h4>
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

            {showAdmin && (
              <div className="endpoint">
                <div className="endpoint-header">
                  <span className="method get">GET</span>
                  <code>/search</code>
                </div>
                <p>Busca avançada com múltiplos filtros. Retorna resultados paginados. 8 filtros disponíveis.</p>

                <div className="params-table">
                  <h4>Filtros disponíveis</h4>
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
                        <td>Busca parcial (case-insensitive)</td>
                        <td>PETROBRAS</td>
                      </tr>
                      <tr>
                        <td><code>nome_fantasia</code></td>
                        <td>string</td>
                        <td>Busca parcial (case-insensitive)</td>
                        <td>Extra</td>
                      </tr>
                      <tr>
                        <td><code>cnae</code></td>
                        <td>string</td>
                        <td>CNAE principal (código exato)</td>
                        <td>4712100</td>
                      </tr>
                      <tr>
                        <td><code>municipio</code></td>
                        <td>string</td>
                        <td>Código TOM/RFB do município (4 dígitos) ou nome (busca parcial)</td>
                        <td>7107 ou SAO PAULO</td>
                      </tr>
                      <tr>
                        <td><code>uf</code></td>
                        <td>string</td>
                        <td>Sigla do estado</td>
                        <td>SP</td>
                      </tr>
                      <tr>
                        <td><code>situacao</code></td>
                        <td>string</td>
                        <td>Situação cadastral: 01=Nula, 02=Ativa, 03=Suspensa, 04=Inapta, 08=Baixada</td>
                        <td>02</td>
                      </tr>
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

                  <h4 style={{ marginTop: '24px' }}>Paginação</h4>
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
                        <td>Número da página (alternativa a <code>offset</code>)</td>
                        <td>1</td>
                      </tr>
                      <tr>
                        <td><code>per_page</code></td>
                        <td>number</td>
                        <td>Itens por página (1 a 1000; teto conforme plano)</td>
                        <td>50</td>
                      </tr>
                      <tr>
                        <td><code>limit</code></td>
                        <td>number</td>
                        <td>Máximo de resultados quando <code>per_page</code> não é usado (padrão: 100, máx: 1000)</td>
                        <td>100</td>
                      </tr>
                      <tr>
                        <td><code>offset</code></td>
                        <td>number</td>
                        <td>Deslocamento inicial quando <code>page</code> não é usado (padrão: 0)</td>
                        <td>0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="docs-callout info">
                  <h4>Código de município (TOM/RFB)</h4>
                  <p>
                    O parâmetro <code>municipio</code> aceita o código TOM usado pela Receita Federal
                    (4 dígitos, ex: 7107 = São Paulo), e <strong>não</strong> o código IBGE de 7 dígitos.
                    Obtenha os códigos válidos no endpoint <code>/municipios/:uf</code>. Também é possível
                    informar o nome do município (busca parcial, ex: <code>municipio=SAO PAULO</code>).
                  </p>
                </div>

                <div className="endpoint-example">
                  <h4>Formato de resposta</h4>
                  <pre>{`{
  "total": 1234,
  "page": 1,
  "per_page": 100,
  "total_pages": 13,
  "items": [...]
}`}</pre>

                  <h4>Exemplos de requisição</h4>
                  <pre>{`# Empresas ativas em SP
GET ${API_URL}/search?uf=SP&situacao=02

# Busca por razão social
GET ${API_URL}/search?razao_social=PETROBRAS

# Empresas de tecnologia em São Paulo (código TOM 7107)
GET ${API_URL}/search?cnae=6201500&municipio=7107&situacao=02

# Empresas abertas em 2024
GET ${API_URL}/search?data_inicio_atividade_min=2024-01-01&data_inicio_atividade_max=2024-12-31`}</pre>
                </div>
              </div>
            )}

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj/socios</code>
              </div>
              <p>Lista os sócios de uma empresa (máximo 1.000 resultados por CNPJ).</p>
              <div className="endpoint-example">
                <h4>Performance</h4>
                <p>Resultados em cache por 30 minutos.</p>
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191/socios
X-API-Key: sua_chave_api`}</pre>
                <h4>Exemplo de resposta</h4>
                <pre>{`[
  {
    "cnpj_basico": "00000000",
    "identificador_socio": "2",
    "identificador_socio_desc": "Pessoa Física",
    "nome_socio": "JOÃO DA SILVA",
    "cnpj_cpf_socio": "***123456**",
    "qualificacao_socio": "49",
    "qualificacao_socio_desc": "Sócio-Administrador",
    "data_entrada_sociedade": "2020-01-15",
    "faixa_etaria": "4",
    "faixa_etaria_desc": "31-40 anos"
  }
]`}</pre>
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Nota: por questões de performance, empresas com mais de 1.000 sócios terão seus
                  resultados limitados. CPFs de pessoas físicas são retornados mascarados (LGPD).
                </p>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj/cnaes-secundarios</code>
              </div>
              <p>Retorna todos os CNAEs secundários de uma empresa com suas descrições completas.</p>
              <div className="endpoint-example">
                <h4>O que são CNAEs secundários?</h4>
                <p style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  CNAEs secundários são as atividades econômicas complementares que uma empresa pode exercer, além da atividade principal (CNAE principal).
                </p>
                <h4>Performance</h4>
                <p>Resultados em cache por 1 hora para consultas otimizadas.</p>
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/cnpj/00000000000191/cnaes-secundarios
X-API-Key: sua_chave_api`}</pre>
                <h4>Exemplo de resposta</h4>
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
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Dica: use este endpoint para entender todas as atividades que a empresa está autorizada a exercer.
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
                <h4>Parâmetros disponíveis</h4>
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
                <h4>Exemplos</h4>
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
                <h4>Parâmetros opcionais</h4>
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
                <h4>Exemplo</h4>
                <pre>{`GET ${API_URL}/cnaes?search=comercio&limit=50
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta</h4>
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
                <h4>Exemplo</h4>
                <pre>{`GET ${API_URL}/municipios/SP
X-API-Key: sua_chave_api`}</pre>
                <h4>Resposta</h4>
                <pre>{`[
  {
    "codigo": "6291",
    "descricao": "CAMPINAS"
  },
  {
    "codigo": "7107",
    "descricao": "SAO PAULO"
  }
]`}</pre>
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Os códigos retornados são os códigos TOM da Receita Federal (4 dígitos), diferentes
                  dos códigos IBGE (7 dígitos). Use-os no filtro <code>municipio</code> de{' '}
                  <code>/search</code> e <code>/batch/search</code>.
                </p>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/stats</code>
              </div>
              <p>
                Retorna estatísticas gerais do banco de dados. Requer autenticação via token JWT
                (header <code>Authorization: Bearer</code>), obtido ao fazer login — este endpoint
                não aceita <code>X-API-Key</code>. Resultado em cache por 10 minutos.
              </p>
              <div className="endpoint-example">
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/stats
Authorization: Bearer seu_token_jwt`}</pre>
                <h4>Resposta</h4>
                <pre>{`{
  "total_empresas": 52678123,
  "total_estabelecimentos": 60345892,
  "total_socios": 31234567,
  "total_cnaes": 1358,
  "total_municipios": 5570
}`}</pre>
              </div>
            </div>

          </section>

          <section id="batch" className="doc-section">
            <div className="section-icon"><Package size={22} /></div>
            <h2>Consultas em lote</h2>

            <div className="docs-callout info">
              <h4>O que são consultas em lote?</h4>
              <p>
                Consultas em lote permitem pesquisar milhares de empresas de uma vez usando filtros avançados
                como CNAE, localização, porte, capital social e mais. É a solução ideal para:
              </p>
              <ul>
                <li>Análises de mercado e inteligência competitiva</li>
                <li>Prospecção de clientes em segmentos específicos</li>
                <li>Estudos de viabilidade e pesquisas de mercado</li>
                <li>Mapeamento de concorrentes por região/setor</li>
              </ul>
            </div>

            <h3>Como funciona</h3>
            <div className="docs-callout">
              <ol>
                <li>Compre um pacote de créditos (pagamento único via Stripe)</li>
                <li>Use o endpoint <code>/batch/search</code> com seus filtros desejados</li>
                <li>Cada empresa retornada consome 1 crédito</li>
                <li>Créditos não expiram — use quando precisar</li>
              </ol>
            </div>

            <h3>Pacotes disponíveis</h3>
            <div className="price-cards">
              <div className="price-card">
                <h4>Starter</h4>
                <div className="num">1.000</div>
                <p className="unit">créditos</p>
                <p className="per">R$ 49,90 (~R$ 0,05/crédito)</p>
              </div>
              <div className="price-card">
                <h4>Basic</h4>
                <div className="num">5.000</div>
                <p className="unit">créditos</p>
                <p className="per">R$ 199,90 (~R$ 0,04/crédito)</p>
              </div>
              <div className="price-card">
                <h4>Professional</h4>
                <div className="num">10.000</div>
                <p className="unit">créditos</p>
                <p className="per">R$ 349,90 (~R$ 0,035/crédito)</p>
              </div>
              <div className="price-card">
                <h4>Enterprise</h4>
                <div className="num">50.000</div>
                <p className="unit">créditos</p>
                <p className="per">R$ 1.499,90 (~R$ 0,03/crédito)</p>
              </div>
            </div>

            <div className="docs-callout warn">
              <h4>Dica de economia</h4>
              <p>
                Quanto maior o pacote, menor o custo por crédito. Economize até 40% comprando pacotes maiores.
                Os créditos nunca expiram, então você pode comprar agora e usar quando quiser. A lista
                sempre atualizada de pacotes e preços está disponível em <code>GET /batch/packages</code>.
              </p>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method post">POST</span>
                <code>/batch/search</code>
              </div>
              <p>
                Executa uma busca em lote com filtros avançados. Retorna empresas que correspondem
                aos critérios. Autenticação via <code>X-API-Key</code>.
              </p>

              <div className="docs-callout danger">
                <h4>Filtros vão na query string, não no corpo</h4>
                <p>
                  Apesar do método POST, este endpoint <strong>não lê corpo JSON</strong>: todos os
                  filtros devem ser passados como parâmetros de query string na URL. Filtros enviados
                  no corpo são ignorados — a busca roda sem filtro nenhum e consome créditos do mesmo jeito.
                </p>
              </div>

              <div className="params-table">
                <h4>Filtros disponíveis (query string)</h4>
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
                      <td>TECH</td>
                    </tr>
                    <tr>
                      <td><code>nome_fantasia</code></td>
                      <td>string</td>
                      <td>Busca parcial no nome fantasia</td>
                      <td>Extra</td>
                    </tr>
                    <tr>
                      <td><code>cnae</code></td>
                      <td>string</td>
                      <td>CNAE principal (código exato)</td>
                      <td>6201500</td>
                    </tr>
                    <tr>
                      <td><code>cnae_secundario</code></td>
                      <td>string</td>
                      <td>CNAE secundário (busca parcial)</td>
                      <td>6421</td>
                    </tr>
                    <tr>
                      <td><code>uf</code></td>
                      <td>string</td>
                      <td>Sigla do estado</td>
                      <td>SP</td>
                    </tr>
                    <tr>
                      <td><code>municipio</code></td>
                      <td>string</td>
                      <td>Código TOM/RFB do município (4 dígitos, exato — veja /municipios/:uf)</td>
                      <td>7107</td>
                    </tr>
                    <tr>
                      <td><code>situacao_cadastral</code></td>
                      <td>string</td>
                      <td>01=Nula, 02=Ativa, 03=Suspensa, 04=Inapta, 08=Baixada</td>
                      <td>02</td>
                    </tr>
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
                    <tr>
                      <td><code>porte</code></td>
                      <td>string</td>
                      <td>1=Micro, 2=Pequena, 3=Média, 4=Grande, 5=Demais</td>
                      <td>4</td>
                    </tr>
                    <tr>
                      <td><code>identificador_matriz_filial</code></td>
                      <td>string</td>
                      <td>1=Matriz, 2=Filial</td>
                      <td>1</td>
                    </tr>
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
                      <td><code>limit</code></td>
                      <td>number</td>
                      <td>Resultados por página (padrão: 100, máx: 1000)</td>
                      <td>100</td>
                    </tr>
                    <tr>
                      <td><code>offset</code></td>
                      <td>number</td>
                      <td>Deslocamento inicial (padrão: 0)</td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="endpoint-example">
                <div className="docs-callout danger">
                  <h4>Consumo de créditos</h4>
                  <p>
                    Cada empresa retornada na resposta consome 1 crédito. Se sua busca retornar 500 empresas,
                    você gastará 500 créditos. Use o parâmetro <code>limit</code> para controlar o consumo.
                    Se não houver créditos suficientes para a página solicitada, a API retorna
                    <code> 402 Payment Required</code> sem consumir nada.
                  </p>
                </div>

                <h4>Exemplo 1: empresas de tecnologia ativas em SP</h4>
                <pre>{`curl -X POST "${API_URL}/batch/search?cnae=6201500&uf=SP&situacao_cadastral=02&limit=100" \\
  -H "X-API-Key: sua_chave_api"

Resposta:
{
  "total": 1234,
  "page": 1,
  "per_page": 100,
  "total_pages": 13,
  "items": [
    {
      "cnpj_completo": "12345678000190",
      "razao_social": "TECH SOLUTIONS LTDA",
      "nome_fantasia": "TECH SOLUTIONS",
      "situacao_cadastral": "02",
      "cnae_fiscal_principal": "6201500",
      "uf": "SP",
      "municipio_desc": "SAO PAULO",
      "porte_empresa": "2",
      "capital_social": "50000.00",
      ...
    },
    ...
  ]
}

# 100 empresas retornadas = 100 créditos consumidos`}</pre>

                <h4>Exemplo 2: MEIs ativos no RJ</h4>
                <pre>{`curl -X POST "${API_URL}/batch/search?uf=RJ&mei=S&situacao_cadastral=02&limit=50" \\
  -H "X-API-Key: sua_chave_api"

# Retorna até 50 empresas
# Consome 50 créditos (ou menos se houver menos resultados)`}</pre>

                <h4>Exemplo 3: busca por razão social parcial</h4>
                <pre>{`curl -X POST "${API_URL}/batch/search?razao_social=RESTAURANTE&uf=SP&municipio=7107&limit=200" \\
  -H "X-API-Key: sua_chave_api"

# Busca empresas com "RESTAURANTE" no nome
# em São Paulo/SP (código TOM 7107), retorna até 200 resultados`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/batch/credits</code>
              </div>
              <p>
                Consulta o saldo atual de créditos de consultas em lote. Requer token JWT da sessão
                web (header <code>Authorization: Bearer</code>) — este endpoint não aceita{' '}
                <code>X-API-Key</code>. Você também pode ver o saldo direto no dashboard.
              </p>
              <div className="endpoint-example">
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/batch/credits
Authorization: Bearer seu_token_jwt

Resposta:
{
  "total_credits": 1000,
  "used_credits": 250,
  "available_credits": 750,
  "monthly_included_credits": 0,
  "purchased_credits": 1000,
  "plan_monthly_batch_queries": 0,
  "batch_queries_this_month": 250
}`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/batch/packages</code>
              </div>
              <p>Lista os pacotes de créditos disponíveis para compra. Não requer autenticação.</p>
              <div className="endpoint-example">
                <h4>Exemplo de requisição</h4>
                <pre>{`GET ${API_URL}/batch/packages

Resposta:
[
  {
    "id": 1,
    "name": "starter",
    "display_name": "Pacote Starter",
    "description": "1.000 consultas em lote - Ideal para começar",
    "credits": 1000,
    "price_brl": 49.9,
    "price_per_unit": 0.0499,
    "sort_order": 1,
    "is_active": true
  },
  ...
]`}</pre>
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  A compra é feita pelo dashboard (checkout Stripe). Após o pagamento, os créditos
                  são adicionados automaticamente à sua conta.
                </p>
              </div>
            </div>

            <div className="docs-callout">
              <h4>Boas práticas</h4>
              <ul>
                <li>Sempre use o parâmetro <code>limit</code> para controlar o consumo de créditos</li>
                <li>Teste suas buscas com limites baixos primeiro (ex: limit=10)</li>
                <li>Combine múltiplos filtros para resultados mais precisos</li>
                <li>Verifique seu saldo de créditos antes de executar buscas grandes</li>
                <li>Créditos não expiram — compre pacotes maiores para economizar</li>
              </ul>
            </div>
          </section>

          <section id="examples" className="doc-section">
            <div className="section-icon"><Code size={22} /></div>
            <h2>Exemplos de código</h2>

            <div className="docs-callout">
              <h4>Antes de começar</h4>
              <ol>
                <li>Obtenha sua chave de API na página <a href="/api-keys" className="plink">API Keys</a></li>
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

${showAdmin ? `
// Buscar empresas com filtros (APENAS ADMIN)
const buscarEmpresas = async () => {
  try {
    const response = await api.get('/search', {
      params: {
        uf: 'SP',
        situacao: '02',
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

${showAdmin ? `
# 2. Buscar empresas com filtros (APENAS ADMIN)
def buscar_empresas(filtros):
    response = requests.get(f'{API_URL}/search', params=filtros, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Erro: {response.status_code} - {response.text}')
        return None

# Exemplo: Buscar empresas ativas em SP
filtros = {
    "uf": "SP",
    "situacao": "02",
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

${showAdmin ? `
// Buscar empresas com filtros (APENAS ADMIN)
$params = http_build_query([
    'uf' => 'SP',
    'situacao' => '02',
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

            <h3>cURL (terminal)</h3>
            <div className="code-block">
              <pre>{`# Consultar CNPJ específico
curl -X GET "${API_URL}/cnpj/00000000000191" \\
  -H "X-API-Key: sua_chave_api"

${showAdmin ? `# 2. Buscar empresas ativas em SP (APENAS ADMIN)
curl -X GET "${API_URL}/search?uf=SP&situacao=02&page=1&per_page=20" \\
  -H "X-API-Key: sua_chave_api"

# 3. Buscar empresas com múltiplos filtros (APENAS ADMIN)
curl -X GET "${API_URL}/search?uf=RJ&cnae=6201500&situacao=02&data_inicio_atividade_min=2024-01-01" \\
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

# Ver estatísticas gerais (requer token JWT do login, não API Key)
curl -X GET "${API_URL}/stats" \\
  -H "Authorization: Bearer seu_token_jwt"`}</pre>
            </div>

            <div className="docs-callout info">
              <h4>Dicas de integração</h4>
              <ul>
                <li>Sempre trate os erros adequadamente (400, 401, 404, 429, 500)</li>
                <li>Use paginação para grandes resultados (parâmetros <code>page</code> e <code>per_page</code>)</li>
                <li>Armazene sua API Key de forma segura (variáveis de ambiente)</li>
                <li>Implemente cache local para reduzir requisições repetidas</li>
                <li>Respeite os limites de rate limiting do seu plano</li>
              </ul>
            </div>

            <div className="docs-callout danger">
              <h4>Segurança</h4>
              <ul>
                <li>Nunca exponha sua API Key em código frontend público</li>
                <li>Nunca faça commit das suas chaves no Git/GitHub</li>
                <li>Use variáveis de ambiente para armazenar credenciais</li>
                <li>Crie chaves diferentes para ambientes de teste e produção</li>
                <li>Revogue imediatamente chaves comprometidas</li>
              </ul>
            </div>
          </section>

          <section id="codes" className="doc-section">
            <div className="section-icon"><Database size={22} /></div>
            <h2>Códigos de referência</h2>
            <p>Valores válidos para usar nos filtros da API.</p>

            <h3>Situação cadastral</h3>
            <table className="errors-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Uso comum</th>
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
                  <td>Mais usado — empresa em funcionamento</td>
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

            <h3 style={{ marginTop: '28px' }}>Porte da empresa</h3>
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
                  <td>Micro empresa</td>
                  <td>Faturamento até R$ 360 mil/ano</td>
                </tr>
                <tr>
                  <td><code>2</code></td>
                  <td>Empresa de pequeno porte</td>
                  <td>Faturamento até R$ 4,8 milhões/ano</td>
                </tr>
                <tr>
                  <td><code>3</code></td>
                  <td>Empresa de médio porte</td>
                  <td>Faturamento intermediário</td>
                </tr>
                <tr>
                  <td><code>4</code></td>
                  <td>Grande empresa</td>
                  <td>Alto faturamento</td>
                </tr>
                <tr>
                  <td><code>5</code></td>
                  <td>Demais</td>
                  <td>Sem classificação específica</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: '28px' }}>Identificador matriz/filial</h3>
            <table className="errors-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Quando usar</th>
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

            <h3 style={{ marginTop: '28px' }}>Regime tributário</h3>
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

            <div className="docs-callout">
              <h4>Formato de datas</h4>
              <p>Todas as datas devem estar no formato YYYY-MM-DD (Ano-Mês-Dia).</p>
              <ul>
                <li>Correto: <code>2024-01-15</code></li>
                <li>Correto: <code>2020-12-31</code></li>
                <li>Errado: <code>15/01/2024</code></li>
                <li>Errado: <code>2024/01/15</code></li>
              </ul>
            </div>
          </section>

          <section id="errors" className="doc-section">
            <div className="section-icon"><Shield size={22} /></div>
            <h2>Códigos de erro HTTP</h2>
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
                  <td>API Key (ou token JWT) não fornecida ou inválida</td>
                </tr>
                <tr>
                  <td><code>402</code></td>
                  <td>Payment Required</td>
                  <td>Créditos de consultas em lote insuficientes — adquira um pacote</td>
                </tr>
                <tr>
                  <td><code>403</code></td>
                  <td>Forbidden</td>
                  <td>Recurso não incluído no seu plano — faça upgrade</td>
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
