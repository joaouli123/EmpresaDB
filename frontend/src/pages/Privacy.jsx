
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const Privacy = () => {
  return (
    <SharedLayout>
      <Helmet>
        <title>Política de Privacidade - DB Empresas | CNPJ 47.394.596/0001-15</title>
        <meta name="description" content="Política de Privacidade da DB Empresas. Saiba como protegemos seus dados pessoais e garantimos conformidade com a LGPD." />
        <meta name="keywords" content="política privacidade DB Empresas, LGPD, proteção dados, privacidade CNPJ API" />
        <link rel="canonical" href="https://dbempresas.com.br/privacidade" />
        <meta property="og:title" content="Política de Privacidade - DB Empresas" />
        <meta property="og:description" content="Como protegemos seus dados e garantimos conformidade com a LGPD." />
        <meta property="og:url" content="https://dbempresas.com.br/privacidade" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="page-hero">
        <h1>Política de Privacidade</h1>
        <p>Como coletamos, usamos e protegemos suas informações</p>
      </div>

      <div className="content-section">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '40px' }}>
            <strong>Última atualização:</strong> Janeiro de 2024<br />
            <strong>DB Empresas</strong> - CNPJ: 47.394.596/0001-15
          </p>

          <section style={{ marginBottom: '48px' }}>
            <h2>1. Introdução</h2>
            <p>
              A DB Empresas está comprometida com a proteção da privacidade e segurança dos dados pessoais 
              de nossos usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos 
              e protegemos suas informações em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 
              nº 13.709/2018).
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>2. Dados Coletados</h2>
            <h3>2.1 Dados de Cadastro</h3>
            <p>Ao criar uma conta, coletamos:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Telefone (opcional)</li>
              <li>CNPJ da empresa (se aplicável)</li>
              <li>Senha (armazenada com criptografia)</li>
            </ul>

            <h3>2.2 Dados de Uso</h3>
            <p>Durante o uso da plataforma, coletamos:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Histórico de consultas (CNPJs consultados)</li>
              <li>Endereço IP</li>
              <li>Dados de navegação (cookies)</li>
              <li>Informações sobre dispositivo e navegador</li>
            </ul>

            <h3>2.3 Dados de Pagamento</h3>
            <p>
              Não armazenamos dados de cartão de crédito. Todos os pagamentos são processados de forma 
              segura através do Stripe, em conformidade com o padrão PCI-DSS.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>3. Como Usamos Seus Dados</h2>
            <p>Utilizamos seus dados para:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Fornecer acesso aos serviços da plataforma</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Enviar notificações importantes sobre sua conta</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir segurança</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados pessoais. Compartilhamos informações apenas quando necessário:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Stripe:</strong> Para processamento de pagamentos</li>
              <li><strong>Serviços de email:</strong> Para comunicações transacionais</li>
              <li><strong>Autoridades:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>5. Segurança dos Dados</h2>
            <p>Implementamos medidas de segurança robustas:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Senhas armazenadas com hash bcrypt</li>
              <li>Autenticação JWT para acesso à API</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e seguros</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>6. Seus Direitos (LGPD)</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
              <li><strong>Correção:</strong> Atualizar dados incompletos ou incorretos</li>
              <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Se opor ao tratamento de seus dados</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir obrigações 
              legais. Após o cancelamento da conta, os dados são mantidos por até 5 anos para fins fiscais 
              e legais, conforme exigido pela legislação brasileira.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>8. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para funcionamento da plataforma e cookies analíticos para 
              melhorar a experiência do usuário. Você pode gerenciar suas preferências de cookies nas 
              configurações do navegador.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
              por email ou através da plataforma.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>10. Contato - Encarregado de Dados (DPO)</h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre privacidade:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Email:</strong> contato@dbempresas.com.br</li>
              <li><strong>WhatsApp:</strong> (41) 98785-7413</li>
              <li><strong>CNPJ:</strong> 47.394.596/0001-15</li>
            </ul>
          </section>

          <div style={{ 
            background: '#f0f9ff', 
            padding: '24px', 
            borderRadius: '12px', 
            border: '2px solid #bae6fd',
            marginTop: '48px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Shield size={32} color="#3b82f6" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>
                  Compromisso com a LGPD
                </h3>
                <p style={{ margin: 0, color: '#4b5563' }}>
                  Estamos totalmente comprometidos com a proteção dos seus dados pessoais e em conformidade 
                  com todas as disposições da Lei Geral de Proteção de Dados (LGPD).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Privacy;
