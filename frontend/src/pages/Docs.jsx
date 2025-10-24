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
            <div className="features-grid">
              <div className="feature">
                <Zap size={24} />
                <h4>Rápido e Eficiente</h4>
                <p>Respostas em menos de 50ms</p>
              </div>
              <div className="feature">
                <Shield size={24} />
                <h4>Seguro</h4>
                <p>Autenticação JWT robusta</p>
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
            <p>Todas as requisições à API requerem autenticação via Bearer Token:</p>
            <div className="code-block">
              <code>
                Authorization: Bearer SEU_TOKEN_AQUI
              </code>
            </div>
            <p>Para obter um token, faça login através do endpoint <code>/auth/login</code>:</p>
            <div className="code-block">
              <pre>{`POST /auth/login
Content-Type: application/json

{
  "username": "seu_usuario",
  "password": "sua_senha"
}`}</pre>
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
Authorization: Bearer SEU_TOKEN`}</pre>
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
              <p>Busca avançada com múltiplos filtros.</p>
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
                      <td><code>uf</code></td>
                      <td>string</td>
                      <td>Sigla do estado (ex: SP, RJ)</td>
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
                      <td><code>page</code></td>
                      <td>number</td>
                      <td>Número da página (padrão: 1)</td>
                    </tr>
                    <tr>
                      <td><code>per_page</code></td>
                      <td>number</td>
                      <td>Itens por página (máx: 100)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="endpoint-example">
                <h4>Exemplo:</h4>
                <pre>{`GET ${API_URL}/search?uf=SP&situacao_cadastral=02&page=1&per_page=20
Authorization: Bearer SEU_TOKEN`}</pre>
              </div>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnpj/:cnpj/socios</code>
              </div>
              <p>Lista os sócios de uma empresa.</p>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/stats</code>
              </div>
              <p>Retorna estatísticas gerais do banco de dados.</p>
            </div>

            <div className="endpoint">
              <div className="endpoint-header">
                <span className="method get">GET</span>
                <code>/cnaes</code>
              </div>
              <p>Lista todos os códigos CNAE disponíveis.</p>
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
    'Authorization': 'Bearer SEU_TOKEN'
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

# Use a URL do seu Replit
API_URL = '${API_URL}'
TOKEN = 'SEU_TOKEN'

headers = {
    'Authorization': f'Bearer {TOKEN}'
}

# Consultar CNPJ
def consultar_cnpj(cnpj):
    response = requests.get(
        f'{API_URL}/cnpj/{cnpj}',
        headers=headers
    )
    return response.json()

resultado = consultar_cnpj('00000000000191')
print(resultado)`}</pre>
            </div>

            <h3>cURL</h3>
            <div className="code-block">
              <pre>{`# Consultar CNPJ
curl -X GET "${API_URL}/cnpj/00000000000191" \\
  -H "Authorization: Bearer SEU_TOKEN"

# Busca com filtros
curl -X GET "${API_URL}/search?uf=SP&situacao_cadastral=02" \\
  -H "Authorization: Bearer SEU_TOKEN"`}</pre>
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
                  <td>Token inválido ou expirado</td>
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
