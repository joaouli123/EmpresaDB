# 💻 Exemplos de Código - API CNPJ

Exemplos práticos e prontos para usar em diferentes linguagens de programação.

---

## 📋 Índice

- [Python](#python)
- [JavaScript / Node.js](#javascript--nodejs)
- [PHP](#php)
- [Java](#java)
- [C# / .NET](#c--net)
- [Ruby](#ruby)
- [Go](#go)

---

## Python

### Instalação de Dependências

```bash
pip install requests pandas openpyxl
```

### Classe Completa para Integração

```python
import requests
import pandas as pd
from typing import Optional, Dict, List
import time

class CNPJApi:
    """Cliente Python para API de Consulta CNPJ"""
    
    def __init__(self, api_key: str, base_url: str = "https://sua-api.com.br/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": api_key})
    
    def consultar_cnpj(self, cnpj: str) -> Optional[Dict]:
        """Consulta dados de um CNPJ específico"""
        cnpj_clean = ''.join(filter(str.isdigit, cnpj))
        
        try:
            response = self.session.get(f"{self.base_url}/cnpj/{cnpj_clean}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"CNPJ {cnpj} não encontrado")
            else:
                print(f"Erro HTTP {e.response.status_code}: {e}")
            return None
        except Exception as e:
            print(f"Erro ao consultar CNPJ: {e}")
            return None
    
    def buscar_empresas(self, **filtros) -> Optional[Dict]:
        """Busca empresas com filtros"""
        try:
            response = self.session.get(f"{self.base_url}/search", params=filtros)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erro na busca: {e}")
            return None
    
    def buscar_todas_paginas(self, **filtros) -> List[Dict]:
        """Busca todas as páginas de resultados"""
        todas_empresas = []
        page = 1
        
        while True:
            filtros['page'] = page
            filtros['per_page'] = filtros.get('per_page', 100)
            
            resultado = self.buscar_empresas(**filtros)
            
            if not resultado or not resultado.get('items'):
                break
            
            todas_empresas.extend(resultado['items'])
            print(f"Página {page}/{resultado['total_pages']} - Total: {len(todas_empresas)}")
            
            if page >= resultado['total_pages']:
                break
            
            page += 1
            time.sleep(0.2)  # Respeitar rate limit
        
        return todas_empresas
    
    def buscar_socios(self, cnpj: str) -> List[Dict]:
        """Busca sócios de uma empresa"""
        cnpj_clean = ''.join(filter(str.isdigit, cnpj))
        
        try:
            response = self.session.get(f"{self.base_url}/cnpj/{cnpj_clean}/socios")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erro ao buscar sócios: {e}")
            return []
    
    def listar_cnaes(self, search: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Lista CNAEs disponíveis"""
        params = {'limit': limit}
        if search:
            params['search'] = search
        
        try:
            response = self.session.get(f"{self.base_url}/cnaes", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erro ao listar CNAEs: {e}")
            return []
    
    def listar_municipios(self, uf: str) -> List[Dict]:
        """Lista municípios de um estado"""
        try:
            response = self.session.get(f"{self.base_url}/municipios/{uf.upper()}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erro ao listar municípios: {e}")
            return []
    
    def exportar_para_excel(self, empresas: List[Dict], arquivo: str):
        """Exporta lista de empresas para Excel"""
        df = pd.DataFrame(empresas)
        df.to_excel(arquivo, index=False, engine='openpyxl')
        print(f"Exportadas {len(empresas)} empresas para {arquivo}")
    
    def exportar_para_csv(self, empresas: List[Dict], arquivo: str):
        """Exporta lista de empresas para CSV"""
        df = pd.DataFrame(empresas)
        df.to_csv(arquivo, index=False, encoding='utf-8-sig')
        print(f"Exportadas {len(empresas)} empresas para {arquivo}")


# ==================== EXEMPLOS DE USO ====================

if __name__ == "__main__":
    # Inicializar cliente
    api = CNPJApi(api_key="SUA_CHAVE_API_AQUI")
    
    # EXEMPLO 1: Consultar CNPJ específico
    print("\n=== EXEMPLO 1: Consultar CNPJ ===")
    empresa = api.consultar_cnpj("00.000.000/0001-91")
    if empresa:
        print(f"Razão Social: {empresa['razao_social']}")
        print(f"Nome Fantasia: {empresa['nome_fantasia']}")
        print(f"Situação: {empresa['situacao_cadastral']}")
        print(f"Capital Social: R$ {empresa['capital_social']:,.2f}")
    
    # EXEMPLO 2: Buscar empresas ativas em SP
    print("\n=== EXEMPLO 2: Empresas Ativas em SP ===")
    resultado = api.buscar_empresas(
        uf="SP",
        situacao_cadastral="02",
        page=1,
        per_page=10
    )
    if resultado:
        print(f"Total encontrado: {resultado['total']}")
        for emp in resultado['items'][:5]:
            print(f"- {emp['cnpj_completo']}: {emp['razao_social']}")
    
    # EXEMPLO 3: Buscar MEIs no RJ
    print("\n=== EXEMPLO 3: MEIs no Rio de Janeiro ===")
    meis = api.buscar_empresas(
        mei="S",
        uf="RJ",
        situacao_cadastral="02",
        page=1,
        per_page=10
    )
    if meis:
        print(f"Total de MEIs: {meis['total']}")
    
    # EXEMPLO 4: Buscar sócios de uma empresa
    print("\n=== EXEMPLO 4: Sócios ===")
    socios = api.buscar_socios("00000000000191")
    for socio in socios:
        print(f"- {socio['nome_socio']} ({socio['qualificacao_socio']})")
    
    # EXEMPLO 5: Exportar empresas para Excel
    print("\n=== EXEMPLO 5: Exportar para Excel ===")
    empresas_sp = api.buscar_todas_paginas(
        uf="SP",
        porte="4",
        situacao_cadastral="02",
        per_page=100
    )
    if empresas_sp:
        api.exportar_para_excel(empresas_sp, "grandes_empresas_sp.xlsx")
    
    # EXEMPLO 6: Buscar empresas de tecnologia
    print("\n=== EXEMPLO 6: Empresas de Tecnologia ===")
    tech = api.buscar_empresas(
        cnae="6201500",
        uf="SP",
        capital_social_min=1000000,
        situacao_cadastral="02",
        page=1,
        per_page=20
    )
    if tech:
        print(f"Empresas de Tech com capital > 1M: {tech['total']}")
    
    # EXEMPLO 7: Listar CNAEs de comércio
    print("\n=== EXEMPLO 7: CNAEs de Comércio ===")
    cnaes = api.listar_cnaes(search="comercio", limit=5)
    for cnae in cnaes:
        print(f"{cnae['codigo']}: {cnae['descricao']}")
    
    # EXEMPLO 8: Municípios de SP
    print("\n=== EXEMPLO 8: Municípios de SP ===")
    municipios = api.listar_municipios("SP")
    print(f"Total de municípios em SP: {len(municipios)}")
    for mun in municipios[:5]:
        print(f"- {mun['descricao']} ({mun['codigo']})")


# ==================== CASOS DE USO AVANÇADOS ====================

def caso_uso_analise_concorrencia():
    """Análise de concorrência em uma região"""
    api = CNPJApi(api_key="SUA_CHAVE_API_AQUI")
    
    # Buscar concorrentes (ex: supermercados em São Paulo)
    concorrentes = api.buscar_todas_paginas(
        cnae="4711302",  # Supermercados
        municipio="3550308",  # São Paulo
        situacao_cadastral="02"
    )
    
    # Análise
    df = pd.DataFrame(concorrentes)
    
    print(f"\n=== ANÁLISE DE CONCORRÊNCIA ===")
    print(f"Total de concorrentes: {len(df)}")
    print(f"\nPor Porte:")
    print(df['porte_empresa'].value_counts())
    print(f"\nPor Bairro (Top 10):")
    print(df['bairro'].value_counts().head(10))
    print(f"\nCapital Social Médio: R$ {df['capital_social'].mean():,.2f}")
    
    return df


def caso_uso_due_diligence(cnpj: str):
    """Due diligence completa de uma empresa"""
    api = CNPJApi(api_key="SUA_CHAVE_API_AQUI")
    
    print(f"\n=== DUE DILIGENCE: {cnpj} ===\n")
    
    # 1. Dados da empresa
    empresa = api.consultar_cnpj(cnpj)
    if not empresa:
        print("Empresa não encontrada!")
        return
    
    print("📋 DADOS DA EMPRESA")
    print(f"Razão Social: {empresa['razao_social']}")
    print(f"Nome Fantasia: {empresa['nome_fantasia']}")
    print(f"Situação: {empresa['situacao_cadastral']}")
    print(f"Data Abertura: {empresa['data_inicio_atividade']}")
    print(f"Capital Social: R$ {empresa['capital_social']:,.2f}")
    print(f"Porte: {empresa['porte_empresa']}")
    
    # 2. Endereço
    print(f"\n📍 ENDEREÇO")
    print(f"{empresa['tipo_logradouro']} {empresa['logradouro']}, {empresa['numero']}")
    print(f"{empresa['bairro']} - {empresa['municipio_desc']}/{empresa['uf']}")
    print(f"CEP: {empresa['cep']}")
    
    # 3. Sócios
    socios = api.buscar_socios(cnpj)
    print(f"\n👥 SÓCIOS ({len(socios)} encontrados)")
    for socio in socios:
        print(f"- {socio['nome_socio']}")
        print(f"  Qualificação: {socio['qualificacao_socio']}")
        print(f"  Entrada: {socio['data_entrada_sociedade']}")
    
    # 4. Análise de risco
    print(f"\n⚠️ ANÁLISE DE RISCO")
    if empresa['situacao_cadastral'] != '02':
        print("❌ Empresa NÃO está ATIVA")
    else:
        print("✅ Empresa ATIVA")
    
    if empresa['opcao_simples'] == 'S':
        print("✅ Optante pelo Simples Nacional")
    
    if empresa['capital_social'] < 10000:
        print("⚠️ Capital social baixo (< R$ 10.000)")
    
    return empresa


def caso_uso_monitoramento_abertura_empresas():
    """Monitora empresas abertas recentemente"""
    from datetime import datetime, timedelta
    
    api = CNPJApi(api_key="SUA_CHAVE_API_AQUI")
    
    # Últimos 30 dias
    data_inicial = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    novas_empresas = api.buscar_todas_paginas(
        data_inicio_atividade_de=data_inicial,
        uf="SP",
        situacao_cadastral="02",
        per_page=100
    )
    
    df = pd.DataFrame(novas_empresas)
    
    print(f"\n=== EMPRESAS ABERTAS NOS ÚLTIMOS 30 DIAS ===")
    print(f"Total: {len(df)}")
    print(f"\nPor Município (Top 10):")
    print(df['municipio_desc'].value_counts().head(10))
    print(f"\nPor CNAE (Top 10):")
    print(df['cnae_fiscal_principal'].value_counts().head(10))
    
    # Exportar
    api.exportar_para_excel(novas_empresas, "novas_empresas_sp.xlsx")
    
    return df
```

---

## JavaScript / Node.js

### Instalação de Dependências

```bash
npm install axios
```

### Classe Completa para Integração

```javascript
const axios = require('axios');
const fs = require('fs');

class CNPJApi {
  constructor(apiKey, baseUrl = 'https://sua-api.com.br/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'X-API-Key': apiKey }
    });
  }

  async consultarCNPJ(cnpj) {
    try {
      const cnpjClean = cnpj.replace(/[^\d]/g, '');
      const response = await this.client.get(`/cnpj/${cnpjClean}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`CNPJ ${cnpj} não encontrado`);
      } else {
        console.error('Erro:', error.message);
      }
      return null;
    }
  }

  async buscarEmpresas(filtros) {
    try {
      const response = await this.client.get('/search', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro na busca:', error.message);
      return null;
    }
  }

  async buscarTodasPaginas(filtros) {
    const empresas = [];
    let page = 1;

    while (true) {
      const resultado = await this.buscarEmpresas({
        ...filtros,
        page,
        per_page: filtros.per_page || 100
      });

      if (!resultado || resultado.items.length === 0) break;

      empresas.push(...resultado.items);
      console.log(`Página ${page}/${resultado.total_pages} - Total: ${empresas.length}`);

      if (page >= resultado.total_pages) break;
      page++;

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return empresas;
  }

  async buscarSocios(cnpj) {
    try {
      const cnpjClean = cnpj.replace(/[^\d]/g, '');
      const response = await this.client.get(`/cnpj/${cnpjClean}/socios`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar sócios:', error.message);
      return [];
    }
  }

  async listarCNAEs(search = null, limit = 100) {
    try {
      const params = { limit };
      if (search) params.search = search;
      
      const response = await this.client.get('/cnaes', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar CNAEs:', error.message);
      return [];
    }
  }

  async listarMunicipios(uf) {
    try {
      const response = await this.client.get(`/municipios/${uf.toUpperCase()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar municípios:', error.message);
      return [];
    }
  }

  salvarJSON(dados, arquivo) {
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
    console.log(`Salvos ${Array.isArray(dados) ? dados.length : 1} registros em ${arquivo}`);
  }

  salvarCSV(empresas, arquivo) {
    if (empresas.length === 0) return;

    const headers = Object.keys(empresas[0]).join(',');
    const rows = empresas.map(emp => 
      Object.values(emp).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    fs.writeFileSync(arquivo, csv);
    console.log(`Exportadas ${empresas.length} empresas para ${arquivo}`);
  }
}

// ==================== EXEMPLOS DE USO ====================

async function exemplos() {
  const api = new CNPJApi('SUA_CHAVE_API_AQUI');

  // EXEMPLO 1: Consultar CNPJ
  console.log('\n=== EXEMPLO 1: Consultar CNPJ ===');
  const empresa = await api.consultarCNPJ('00.000.000/0001-91');
  if (empresa) {
    console.log(`Razão Social: ${empresa.razao_social}`);
    console.log(`Capital Social: R$ ${empresa.capital_social.toLocaleString('pt-BR')}`);
  }

  // EXEMPLO 2: Buscar empresas
  console.log('\n=== EXEMPLO 2: Empresas Ativas em SP ===');
  const resultado = await api.buscarEmpresas({
    uf: 'SP',
    situacao_cadastral: '02',
    page: 1,
    per_page: 10
  });
  if (resultado) {
    console.log(`Total: ${resultado.total}`);
    resultado.items.forEach(emp => {
      console.log(`- ${emp.cnpj_completo}: ${emp.razao_social}`);
    });
  }

  // EXEMPLO 3: Buscar sócios
  console.log('\n=== EXEMPLO 3: Sócios ===');
  const socios = await api.buscarSocios('00000000000191');
  socios.forEach(socio => {
    console.log(`- ${socio.nome_socio} (${socio.qualificacao_socio})`);
  });

  // EXEMPLO 4: Exportar para JSON
  console.log('\n=== EXEMPLO 4: Exportar para JSON ===');
  const meis = await api.buscarTodasPaginas({
    mei: 'S',
    uf: 'RJ',
    situacao_cadastral: '02'
  });
  api.salvarJSON(meis, 'meis_rj.json');
}

// Executar exemplos
// exemplos();

module.exports = CNPJApi;
```

---

## PHP

```php
<?php

class CNPJApi {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'https://sua-api.com.br/api/v1') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function request($endpoint, $params = []) {
        $url = $this->baseUrl . $endpoint;
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return json_decode($response, true);
        }
        
        if ($httpCode === 404) {
            echo "Recurso não encontrado (404)\n";
        } else {
            echo "Erro HTTP {$httpCode}\n";
        }
        
        return null;
    }
    
    public function consultarCNPJ($cnpj) {
        $cnpjClean = preg_replace('/[^0-9]/', '', $cnpj);
        return $this->request("/cnpj/{$cnpjClean}");
    }
    
    public function buscarEmpresas($filtros) {
        return $this->request('/search', $filtros);
    }
    
    public function buscarTodasPaginas($filtros) {
        $empresas = [];
        $page = 1;
        
        while (true) {
            $filtros['page'] = $page;
            $filtros['per_page'] = $filtros['per_page'] ?? 100;
            
            $resultado = $this->buscarEmpresas($filtros);
            
            if (!$resultado || empty($resultado['items'])) break;
            
            $empresas = array_merge($empresas, $resultado['items']);
            echo "Página {$page}/{$resultado['total_pages']} - Total: " . count($empresas) . "\n";
            
            if ($page >= $resultado['total_pages']) break;
            $page++;
            
            usleep(200000); // 200ms
        }
        
        return $empresas;
    }
    
    public function buscarSocios($cnpj) {
        $cnpjClean = preg_replace('/[^0-9]/', '', $cnpj);
        return $this->request("/cnpj/{$cnpjClean}/socios") ?? [];
    }
    
    public function listarCNAEs($search = null, $limit = 100) {
        $params = ['limit' => $limit];
        if ($search) {
            $params['search'] = $search;
        }
        return $this->request('/cnaes', $params) ?? [];
    }
    
    public function exportarCSV($empresas, $arquivo) {
        if (empty($empresas)) return;
        
        $fp = fopen($arquivo, 'w');
        
        // Header
        fputcsv($fp, array_keys($empresas[0]));
        
        // Rows
        foreach ($empresas as $empresa) {
            fputcsv($fp, $empresa);
        }
        
        fclose($fp);
        echo "Exportadas " . count($empresas) . " empresas para {$arquivo}\n";
    }
}

// ==================== EXEMPLOS DE USO ====================

$api = new CNPJApi('SUA_CHAVE_API_AQUI');

// EXEMPLO 1: Consultar CNPJ
echo "\n=== EXEMPLO 1: Consultar CNPJ ===\n";
$empresa = $api->consultarCNPJ('00.000.000/0001-91');
if ($empresa) {
    echo "Razão Social: {$empresa['razao_social']}\n";
    echo "Capital Social: R$ " . number_format($empresa['capital_social'], 2, ',', '.') . "\n";
}

// EXEMPLO 2: Buscar empresas
echo "\n=== EXEMPLO 2: Empresas Ativas em SP ===\n";
$resultado = $api->buscarEmpresas([
    'uf' => 'SP',
    'situacao_cadastral' => '02',
    'page' => 1,
    'per_page' => 10
]);

if ($resultado) {
    echo "Total: {$resultado['total']}\n";
    foreach ($resultado['items'] as $emp) {
        echo "- {$emp['cnpj_completo']}: {$emp['razao_social']}\n";
    }
}

// EXEMPLO 3: Exportar para CSV
echo "\n=== EXEMPLO 3: Exportar MEIs para CSV ===\n";
$meis = $api->buscarTodasPaginas([
    'mei' => 'S',
    'uf' => 'RJ',
    'situacao_cadastral' => '02'
]);
$api->exportarCSV($meis, 'meis_rj.csv');

?>
```

---

## Java

```java
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;

public class CNPJApi {
    private String apiKey;
    private String baseUrl;
    private Gson gson;
    
    public CNPJApi(String apiKey) {
        this(apiKey, "https://sua-api.com.br/api/v1");
    }
    
    public CNPJApi(String apiKey, String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.gson = new Gson();
    }
    
    private String request(String endpoint, Map<String, String> params) throws IOException {
        StringBuilder urlBuilder = new StringBuilder(baseUrl + endpoint);
        
        if (params != null && !params.isEmpty()) {
            urlBuilder.append("?");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                urlBuilder.append(entry.getKey()).append("=").append(entry.getValue()).append("&");
            }
        }
        
        URL url = new URL(urlBuilder.toString());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("X-API-Key", apiKey);
        
        int responseCode = conn.getResponseCode();
        
        if (responseCode == HttpURLConnection.HTTP_OK) {
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String inputLine;
            StringBuilder response = new StringBuilder();
            
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            
            return response.toString();
        }
        
        return null;
    }
    
    public Map<String, Object> consultarCNPJ(String cnpj) {
        try {
            String cnpjClean = cnpj.replaceAll("[^0-9]", "");
            String json = request("/cnpj/" + cnpjClean, null);
            
            if (json != null) {
                return gson.fromJson(json, new TypeToken<Map<String, Object>>(){}.getType());
            }
        } catch (IOException e) {
            System.out.println("Erro ao consultar CNPJ: " + e.getMessage());
        }
        return null;
    }
    
    public Map<String, Object> buscarEmpresas(Map<String, String> filtros) {
        try {
            String json = request("/search", filtros);
            
            if (json != null) {
                return gson.fromJson(json, new TypeToken<Map<String, Object>>(){}.getType());
            }
        } catch (IOException e) {
            System.out.println("Erro na busca: " + e.getMessage());
        }
        return null;
    }
    
    // Exemplo de uso
    public static void main(String[] args) {
        CNPJApi api = new CNPJApi("SUA_CHAVE_API_AQUI");
        
        // Consultar CNPJ
        Map<String, Object> empresa = api.consultarCNPJ("00000000000191");
        if (empresa != null) {
            System.out.println("Razão Social: " + empresa.get("razao_social"));
            System.out.println("Capital Social: R$ " + empresa.get("capital_social"));
        }
        
        // Buscar empresas
        Map<String, String> filtros = new HashMap<>();
        filtros.put("uf", "SP");
        filtros.put("situacao_cadastral", "02");
        filtros.put("page", "1");
        filtros.put("per_page", "10");
        
        Map<String, Object> resultado = api.buscarEmpresas(filtros);
        if (resultado != null) {
            System.out.println("Total: " + resultado.get("total"));
        }
    }
}
```

---

## C# / .NET

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CNPJApi
{
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly HttpClient _client;
    
    public CNPJApi(string apiKey, string baseUrl = "https://sua-api.com.br/api/v1")
    {
        _apiKey = apiKey;
        _baseUrl = baseUrl;
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    }
    
    public async Task<dynamic> ConsultarCNPJ(string cnpj)
    {
        try
        {
            var cnpjClean = new string(cnpj.Where(char.IsDigit).ToArray());
            var response = await _client.GetStringAsync($"{_baseUrl}/cnpj/{cnpjClean}");
            return JsonConvert.DeserializeObject(response);
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Erro ao consultar CNPJ: {ex.Message}");
            return null;
        }
    }
    
    public async Task<dynamic> BuscarEmpresas(Dictionary<string, string> filtros)
    {
        try
        {
            var query = string.Join("&", filtros.Select(kvp => $"{kvp.Key}={kvp.Value}"));
            var response = await _client.GetStringAsync($"{_baseUrl}/search?{query}");
            return JsonConvert.DeserializeObject(response);
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"Erro na busca: {ex.Message}");
            return null;
        }
    }
    
    // Exemplo de uso
    public static async Task Main(string[] args)
    {
        var api = new CNPJApi("SUA_CHAVE_API_AQUI");
        
        // Consultar CNPJ
        var empresa = await api.ConsultarCNPJ("00000000000191");
        if (empresa != null)
        {
            Console.WriteLine($"Razão Social: {empresa.razao_social}");
            Console.WriteLine($"Capital Social: R$ {empresa.capital_social}");
        }
        
        // Buscar empresas
        var filtros = new Dictionary<string, string>
        {
            { "uf", "SP" },
            { "situacao_cadastral", "02" },
            { "page", "1" },
            { "per_page", "10" }
        };
        
        var resultado = await api.BuscarEmpresas(filtros);
        if (resultado != null)
        {
            Console.WriteLine($"Total: {resultado.total}");
        }
    }
}
```

---

## Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

class CNPJApi
  def initialize(api_key, base_url = 'https://sua-api.com.br/api/v1')
    @api_key = api_key
    @base_url = base_url
  end
  
  def consultar_cnpj(cnpj)
    cnpj_clean = cnpj.gsub(/[^0-9]/, '')
    request("/cnpj/#{cnpj_clean}")
  end
  
  def buscar_empresas(filtros = {})
    query = URI.encode_www_form(filtros)
    request("/search?#{query}")
  end
  
  def buscar_socios(cnpj)
    cnpj_clean = cnpj.gsub(/[^0-9]/, '')
    request("/cnpj/#{cnpj_clean}/socios")
  end
  
  private
  
  def request(endpoint)
    uri = URI("#{@base_url}#{endpoint}")
    
    Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      request = Net::HTTP::Get.new(uri)
      request['X-API-Key'] = @api_key
      
      response = http.request(request)
      
      if response.code == '200'
        JSON.parse(response.body)
      else
        puts "Erro HTTP #{response.code}"
        nil
      end
    end
  rescue StandardError => e
    puts "Erro: #{e.message}"
    nil
  end
end

# Exemplo de uso
api = CNPJApi.new('SUA_CHAVE_API_AQUI')

# Consultar CNPJ
empresa = api.consultar_cnpj('00000000000191')
if empresa
  puts "Razão Social: #{empresa['razao_social']}"
  puts "Capital Social: R$ #{empresa['capital_social']}"
end

# Buscar empresas
resultado = api.buscar_empresas(
  uf: 'SP',
  situacao_cadastral: '02',
  page: 1,
  per_page: 10
)

if resultado
  puts "Total: #{resultado['total']}"
  resultado['items'].each do |emp|
    puts "- #{emp['cnpj_completo']}: #{emp['razao_social']}"
  end
end
```

---

## Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
)

type CNPJApi struct {
    APIKey  string
    BaseURL string
    Client  *http.Client
}

func NewCNPJApi(apiKey string) *CNPJApi {
    return &CNPJApi{
        APIKey:  apiKey,
        BaseURL: "https://sua-api.com.br/api/v1",
        Client:  &http.Client{},
    }
}

func (api *CNPJApi) request(endpoint string, params map[string]string) (map[string]interface{}, error) {
    reqURL := api.BaseURL + endpoint
    
    if len(params) > 0 {
        values := url.Values{}
        for k, v := range params {
            values.Add(k, v)
        }
        reqURL += "?" + values.Encode()
    }
    
    req, err := http.NewRequest("GET", reqURL, nil)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("X-API-Key", api.APIKey)
    
    resp, err := api.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
    }
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result map[string]interface{}
    err = json.Unmarshal(body, &result)
    if err != nil {
        return nil, err
    }
    
    return result, nil
}

func (api *CNPJApi) ConsultarCNPJ(cnpj string) (map[string]interface{}, error) {
    return api.request("/cnpj/"+cnpj, nil)
}

func (api *CNPJApi) BuscarEmpresas(filtros map[string]string) (map[string]interface{}, error) {
    return api.request("/search", filtros)
}

func main() {
    api := NewCNPJApi("SUA_CHAVE_API_AQUI")
    
    // Consultar CNPJ
    empresa, err := api.ConsultarCNPJ("00000000000191")
    if err != nil {
        fmt.Println("Erro:", err)
        return
    }
    
    fmt.Printf("Razão Social: %v\n", empresa["razao_social"])
    fmt.Printf("Capital Social: R$ %.2f\n", empresa["capital_social"])
    
    // Buscar empresas
    filtros := map[string]string{
        "uf":                 "SP",
        "situacao_cadastral": "02",
        "page":               "1",
        "per_page":           "10",
    }
    
    resultado, err := api.BuscarEmpresas(filtros)
    if err != nil {
        fmt.Println("Erro:", err)
        return
    }
    
    fmt.Printf("Total: %.0f\n", resultado["total"])
}
```

---

## 📞 Suporte

Precisa de ajuda com a integração? Entre em contato:
- 📧 suporte@sua-api.com.br
- 💬 Chat no painel de clientes

---

**Todos os códigos estão prontos para uso!** 🚀

Basta substituir `SUA_CHAVE_API_AQUI` pela sua chave real.
