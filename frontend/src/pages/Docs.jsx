
import { Code, Book, Zap, Shield, Database } from 'lucide-react';

const Docs = () => {
  const API_URL = window.location.origin;
  
  return (
    <div className="docs-page">
      <div className="page-header">
        <h1>Documentação da API</h1>
        <p>Guia completo para integração com o Sistema CNPJ</p>
      </div>

      <div className="docs-container">
        <div className="docs-nav">
          <h3>Índice</h3>
          <ul>
            <li><a href="#intro">Introdução</a></li>
            <li><a href="#auth">Autenticação</a></li>
            <li><a href="#endpoints">Endpoints</a></li>
            <li><a href="#examples">Exemplos</a></li>
            <li><a href="#errors">Códigos de Erro</a></li>
          </ul>
        </div>

        <div className="docs-content">
          <section id="intro" className="doc-section">
            <div className="section-icon">
              <Book size={32} />
            </div>
            <h2>Introdução</h2>
            <p>
              A API CNPJ fornece acesso programático aos dados públicos da Receita Federal brasileira,
              permitindo consultar informações sobre empresas, estabelecimentos, sócios e muito mais.
            </p>
            
            <div className="info-card" style={{ marginTop: '20px', background: '#1f2937', color: 'white' }}>
              <h3 style={{ color: 'white', marginBottom: '12px' }}>🔗 URL Base da API</h3>
              <pre style={{ background: '#111827', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
{window.location.protocol}//{window.location.host}
              </pre>
              <p style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                <strong>Para uso externo:</strong> Use esta URL em todas as requisições para a API<br/>
                <strong>Porta Backend:</strong> {window.location.protocol}//{window.location.hostname}:8000
              </p>
              <p style={{ marginTop: '12px', color: '#fbbf24', fontSize: '14px' }}>
                ⚠️ <strong>IMPORTANTE:</strong> Todas as requisições precisam do header <code>X-API-Key</code> com sua chave de API
              </p>
            </div>

            <div className="features-grid">
              <div className="feature">
                <Zap size={24} />
                <h4>Rápido e Eficiente</h4>
                <p>Respostas em menos de 50ms</p>
              </div>
              <div className="feature">
                <Shield size={24} />
                <h4>Seguro</h4>
                <p>Autenticação via API Key</p>
              </div>
              <div className="feature">
                <Database size={24} />
                <h4>Completo</h4>
                <p>Mais de 60 milhões de registros</p>
              </div>
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
                <li>Faça login no sistema</li>
                <li>Acesse a página "Chaves de API"</li>
                <li>Clique em "Nova Chave"</li>
                <li>Copie sua chave e guarde em local seguro</li>
              </ol>
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

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/search</code>
              </div>
              <p>Busca avançada com múltiplos filtros. Retorna resultados paginados.</p>
              <div className="params-table">
                <h4>Parâmetros disponíveis:</h4>
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
                      <td><code>razao_social</code></td>
                      <td>string</td>
                      <td>Busca parcial por razão social</td>
                    </tr>
                    <tr>
                      <td><code>nome_fantasia</code></td>
                      <td>string</td>
                      <td>Busca parcial por nome fantasia</td>
                    </tr>
                    <tr>
                      <td><code>uf</code></td>
                      <td>string</td>
                      <td>Sigla do estado (ex: SP, RJ)</td>
                    </tr>
                    <tr>
                      <td><code>municipio</code></td>
                      <td>string</td>
                      <td>Código do município</td>
                    </tr>
                    <tr>
                      <td><code>situacao_cadastral</code></td>
                      <td>string</td>
                      <td>01=Nula, 02=Ativa, 03=Suspensa, etc.</td>
                    </tr>
                    <tr>
                      <td><code>cnae</code></td>
                      <td>string</td>
                      <td>Código CNAE da atividade</td>
                    </tr>
                    <tr>
                      <td><code>porte</code></td>
                      <td>string</td>
                      <td>1=Micro, 2=Pequena, 3=Média, 4=Grande</td>
                    </tr>
                    <tr>
                      <td><code>simples</code></td>
                      <td>string</td>
                      <td>S ou N (Simples Nacional)</td>
                    </tr>
                    <tr>
                      <td><code>mei</code></td>
                      <td>string</td>
                      <td>S ou N (MEI)</td>
                    </tr>
                    <tr>
                      <td><code>page</code></td>
                      <td>number</td>
                      <td>Número da página (padrão: 1)</td>
                    </tr>
                    <tr>
                      <td><code>per_page</code></td>
                      <td>number</td>
                      <td>Itens por página (padrão: 20, máx: 100)</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
                  📋 <strong>Mais 15+ filtros disponíveis!</strong> Veja a lista completa em FILTROS_COMPLETOS.md
                </p>
              </div>
              <div className="endpoint-example">
                <h4>Exemplo de Requisição:</h4>
                <pre>{`GET ${API_URL}/search?razao_social=petrobras&uf=RJ&page=1
X-API-Key: sua_chave_api`}</pre>
              </div>
            </div>

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
                <code>/stats</code>
              </div>
              <p>Retorna estatísticas gerais do banco de dados (não requer autenticação).</p>
            </div>
          </section>

          <section id="examples" className="doc-section">
            <div className="section-icon">
              <Code size={32} />
            </div>
            <h2>Exemplos de Código</h2>

            <h3>JavaScript / Node.js</h3>
            <div className="code-block">
              <pre>{`const axios = require('axios');

const api = axios.create({
  baseURL: '${API_URL}',
  headers: {
    'X-API-Key': 'sua_chave_api_aqui'
  }
});

// Consultar CNPJ
const consultarCNPJ = async (cnpj) => {
  try {
    const response = await api.get(\`/cnpj/\${cnpj}\`);
    console.log(response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
};

consultarCNPJ('00000000000191');`}</pre>
            </div>

            <h3>Python</h3>
            <div className="code-block">
              <pre>{`import requests

API_URL = '${API_URL}'
API_KEY = 'sua_chave_api_aqui'

headers = {
    'X-API-Key': API_KEY
}

# Consultar CNPJ
def consultar_cnpj(cnpj):
    response = requests.get(
        f'{API_URL}/cnpj/{cnpj}',
        headers=headers
    )
    return response.json()

resultado = consultar_cnpj('00000000000191')
print(resultado)

# Busca com filtros
def buscar_empresas(uf, situacao='02'):
    response = requests.get(
        f'{API_URL}/search',
        headers=headers,
        params={
            'uf': uf,
            'situacao_cadastral': situacao,
            'page': 1,
            'per_page': 50
        }
    )
    return response.json()

empresas = buscar_empresas('SP')
print(f"Total encontrado: {empresas['total']}")
for empresa in empresas['items']:
    print(f"{empresa['razao_social']} - {empresa['cnpj_completo']}")`}</pre>
            </div>

            <h3>cURL</h3>
            <div className="code-block">
              <pre>{`# Consultar CNPJ
curl -X GET "${API_URL}/cnpj/00000000000191" \\
  -H "X-API-Key: sua_chave_api"

# Busca com filtros
curl -X GET "${API_URL}/search?uf=SP&situacao_cadastral=02&page=1" \\
  -H "X-API-Key: sua_chave_api"

# Listar sócios
curl -X GET "${API_URL}/cnpj/00000000000191/socios" \\
  -H "X-API-Key: sua_chave_api"`}</pre>
            </div>
          </section>

          <section id="errors" className="doc-section">
            <div className="section-icon">
              <Shield size={32} />
            </div>
            <h2>Códigos de Erro</h2>
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
