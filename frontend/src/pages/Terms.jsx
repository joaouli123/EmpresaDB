
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { FileText, AlertCircle } from 'lucide-react';

const Terms = () => {
  return (
    <SharedLayout>
      <Helmet>
        <title>Termos de Uso - DB Empresas | CNPJ 47.394.596/0001-15</title>
        <meta name="description" content="Termos de Uso da plataforma DB Empresas. Conheça os direitos, deveres e condições de uso da nossa API de CNPJ." />
        <meta name="keywords" content="termos uso DB Empresas, condições uso API CNPJ, termos serviço dados empresas" />
        <link rel="canonical" href="https://dbempresas.com.br/termos" />
      </Helmet>

      <div className="page-hero">
        <h1>Termos de Uso</h1>
        <p>Condições gerais de uso da plataforma DB Empresas</p>
      </div>

      <div className="content-section">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '40px' }}>
            <strong>Última atualização:</strong> Janeiro de 2024<br />
            <strong>DB Empresas</strong> - CNPJ: 47.394.596/0001-15
          </p>

          <section style={{ marginBottom: '48px' }}>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma DB Empresas, você concorda com estes Termos de Uso. Se você 
              não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>2. Descrição dos Serviços</h2>
            <p>
              A DB Empresas oferece acesso a dados públicos de empresas brasileiras registradas na Receita 
              Federal através de:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li>API REST para consultas programáticas</li>
              <li>Interface web para consultas manuais</li>
              <li>Dashboard com estatísticas de uso</li>
              <li>Consultas em lote com filtros avançados</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>3. Cadastro e Conta de Usuário</h2>
            <h3>3.1 Requisitos</h3>
            <p>Para usar nossos serviços, você deve:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a segurança de suas credenciais</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
            </ul>

            <h3>3.2 Responsabilidades</h3>
            <p>Você é responsável por:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Manter suas informações de contato atualizadas</li>
              <li>Proteger suas chaves de API</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>4. Planos e Pagamentos</h2>
            <h3>4.1 Planos Disponíveis</h3>
            <p>
              Oferecemos diferentes planos (Free, Start, Growth, Pro e Enterprise) com limites de consultas 
              e funcionalidades específicas.
            </p>

            <h3>4.2 Faturamento</h3>
            <ul style={{ lineHeight: '2' }}>
              <li>Planos mensais são cobrados no início de cada ciclo</li>
              <li>Planos anuais oferecem desconto de 17%</li>
              <li>Pacotes de consultas em lote são pagamentos únicos</li>
              <li>Todos os preços estão em Reais (BRL)</li>
            </ul>

            <h3>4.3 Cancelamento</h3>
            <p>
              Você pode cancelar sua assinatura a qualquer momento. O acesso aos serviços pagos permanece 
              ativo até o final do período já pago. Não oferecemos reembolso proporcional.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>5. Uso Aceitável</h2>
            <h3>5.1 Você PODE:</h3>
            <ul style={{ lineHeight: '2' }}>
              <li>Usar os dados para fins comerciais legítimos</li>
              <li>Integrar a API em suas aplicações</li>
              <li>Fazer backup dos dados consultados</li>
              <li>Compartilhar dados dentro da sua organização</li>
            </ul>

            <h3>5.2 Você NÃO PODE:</h3>
            <ul style={{ lineHeight: '2' }}>
              <li>Revender ou redistribuir os dados sem autorização</li>
              <li>Usar os serviços para atividades ilegais</li>
              <li>Tentar burlar limites de consultas</li>
              <li>Fazer engenharia reversa da API</li>
              <li>Sobrecarregar a infraestrutura (DDoS, scraping abusivo)</li>
              <li>Compartilhar suas chaves de API publicamente</li>
              <li>Usar dados para spam ou assédio</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>6. Limites de Uso</h2>
            <p>Cada plano possui limites específicos de:</p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Consultas mensais:</strong> Reset no primeiro dia de cada mês</li>
              <li><strong>Rate limit:</strong> Número máximo de requisições por minuto</li>
              <li><strong>Consultas em lote:</strong> Limite mensal + créditos adicionais</li>
            </ul>
            <p>
              O excesso de consultas pode resultar em bloqueio temporário. Para volumes maiores, 
              considere fazer upgrade do plano.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>7. Propriedade Intelectual</h2>
            <p>
              Os dados fornecidos são de domínio público (Receita Federal). No entanto:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li>A estrutura, API e interface são propriedade da DB Empresas</li>
              <li>Você mantém os direitos sobre suas criações usando nossos dados</li>
              <li>Não copie ou reproduza nossa documentação sem autorização</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>8. Disponibilidade e SLA</h2>
            <p>
              Buscamos manter 99,9% de uptime, mas não garantimos disponibilidade ininterrupta. Podemos:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li>Realizar manutenções programadas (com aviso prévio)</li>
              <li>Suspender serviços temporariamente por questões técnicas</li>
              <li>Modificar funcionalidades com aviso de 30 dias</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>9. Limitação de Responsabilidade</h2>
            <p>
              A DB Empresas não se responsabiliza por:
            </p>
            <ul style={{ lineHeight: '2' }}>
              <li>Imprecisões nos dados fornecidos pela Receita Federal</li>
              <li>Perdas financeiras decorrentes do uso dos dados</li>
              <li>Interrupções temporárias do serviço</li>
              <li>Uso indevido dos dados por terceiros</li>
            </ul>
            <p>
              Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>10. Modificações dos Termos</h2>
            <p>
              Podemos modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas 
              por email com 30 dias de antecedência. O uso continuado após as mudanças constitui aceitação.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>11. Rescisão</h2>
            <p>Podemos suspender ou encerrar sua conta se:</p>
            <ul style={{ lineHeight: '2' }}>
              <li>Houver violação destes termos</li>
              <li>Houver uso fraudulento ou abusivo</li>
              <li>Houver inadimplência de pagamento</li>
              <li>Por determinação judicial</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>12. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Fica eleito o foro de Curitiba/PR para 
              dirimir quaisquer controvérsias.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2>13. Contato</h2>
            <p>Para questões sobre estes termos:</p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Email:</strong> contato@dbempresas.com.br</li>
              <li><strong>WhatsApp:</strong> (41) 98785-7413</li>
              <li><strong>CNPJ:</strong> 47.394.596/0001-15</li>
            </ul>
          </section>

          <div style={{ 
            background: '#fef3c7', 
            padding: '24px', 
            borderRadius: '12px', 
            border: '2px solid #fbbf24',
            marginTop: '48px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <AlertCircle size={32} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>
                  Importante
                </h3>
                <p style={{ margin: 0, color: '#4b5563' }}>
                  Ao usar nossos serviços, você declara ter lido, compreendido e concordado com todos os 
                  termos aqui descritos. Mantenha-se atualizado sobre eventuais mudanças.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Terms;
