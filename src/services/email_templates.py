"""
Templates de email em HTML
Design: Limpo, tons de azul, sem emojis, sem cores vibrantes
"""

def get_email_base_template(content: str) -> str:
    """Template base para todos os emails"""
    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DB Empresas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f8fa; line-height: 1.6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">DB Empresas</h1>
                            <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">Consultas CNPJ Profissionais</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e1e8ed;">
                            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-align: center;">
                                Este é um email automático, por favor não responda.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                DB Empresas - Sistema de Consultas CNPJ
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def get_account_creation_template(username: str) -> str:
    """Template de email de criação de conta"""
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Bem-vindo ao DB Empresas
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Parabéns! Sua conta foi criada com sucesso e você já pode começar a explorar nossa plataforma de consultas CNPJ.
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Para você experimentar nossos serviços, oferecemos o <strong>Plano Free</strong> com <strong>200 consultas gratuitas</strong> por mês. É perfeito para conhecer a plataforma sem compromisso!
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            Quando precisar de mais recursos, você pode escolher um plano pago que melhor atenda às suas necessidades.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Acessar Minha Conta
            </a>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Aproveite suas consultas gratuitas! Se tiver dúvidas, estamos aqui para ajudar.
        </p>
    """
    return get_email_base_template(content)


def get_account_activation_template(username: str, activation_link: str) -> str:
    """Template de email de ativação de conta"""
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Ative sua conta
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Para começar a usar o DB Empresas, você precisa ativar sua conta clicando no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{activation_link}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Ativar Conta
            </a>
        </div>
        
        <p style="margin: 24px 0 16px 0; color: #64748b; font-size: 14px;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
        </p>
        
        <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 4px; word-break: break-all; font-size: 13px; color: #475569;">
            {activation_link}
        </p>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Este link expira em 24 horas.
        </p>
    """
    return get_email_base_template(content)


def get_password_reset_template(reset_link: str) -> str:
    """Template de email de redefinição de senha"""
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Redefinir Senha
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá,
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Recebemos uma solicitação para redefinir a senha da sua conta no DB Empresas.
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Para criar uma nova senha, clique no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Redefinir Senha
            </a>
        </div>
        
        <p style="margin: 24px 0 16px 0; color: #64748b; font-size: 14px;">
            Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
        </p>
        
        <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 4px; word-break: break-all; font-size: 13px; color: #475569;">
            {reset_link}
        </p>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Este link expira em 1 hora.
        </p>
        
        <div style="margin: 24px 0 0 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>⚠️ Não solicitou esta alteração?</strong><br>
                Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
            </p>
        </div>
    """
    return get_email_base_template(content)


def get_subscription_created_template(
    username: str, 
    plan_name: str, 
    plan_price: float,
    next_billing_date: str,
    monthly_queries: int = None
) -> str:
    """Template de email de assinatura contratada"""
    
    # Linha de consultas se fornecida
    queries_row = ""
    if monthly_queries:
        queries_formatted = f"{monthly_queries:,}".replace(",", ".")
        queries_row = f"""
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Consultas mensais:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{queries_formatted}</td>
                </tr>"""
    
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Assinatura Confirmada
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            Sua assinatura foi confirmada com sucesso! Agora você tem acesso completo aos recursos do seu plano.
        </p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plano:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Valor:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">R$ {plan_price:.2f}/mês</td>
                </tr>{queries_row}
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Próxima cobrança:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{next_billing_date}</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Acessar Painel
            </a>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Obrigado por escolher o DB Empresas!
        </p>
    """
    return get_email_base_template(content)


def get_subscription_renewed_template(
    username: str, 
    plan_name: str, 
    amount_paid: float,
    next_billing_date: str,
    monthly_queries: int = None
) -> str:
    """Template de email de assinatura renovada"""
    
    # Linha de consultas se fornecida
    queries_row = ""
    if monthly_queries:
        queries_formatted = f"{monthly_queries:,}".replace(",", ".")
        queries_row = f"""
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Consultas mensais:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{queries_formatted}</td>
                </tr>"""
    
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Assinatura Renovada
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            Sua assinatura foi renovada com sucesso. Obrigado por continuar conosco!
        </p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plano:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Valor pago:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">R$ {amount_paid:.2f}</td>
                </tr>{queries_row}
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Próxima renovação:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{next_billing_date}</td>
                </tr>
            </table>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Você pode gerenciar sua assinatura a qualquer momento no painel de controle.
        </p>
    """
    return get_email_base_template(content)


def get_subscription_expired_template(
    username: str, 
    plan_name: str, 
    expired_date: str,
    attempt: int
) -> str:
    """Template de email de assinatura vencida (follow-up)"""
    
    messages = {
        1: "Sua assinatura venceu recentemente. Para continuar usando nossos serviços sem interrupção, renove agora.",
        2: "Este é o segundo lembrete sobre o vencimento da sua assinatura. Renove para manter o acesso aos seus recursos.",
        3: "Notamos que você ainda não renovou sua assinatura. Não perca o acesso aos dados importantes do seu negócio.",
        4: "Este é o penúltimo lembrete. Sua assinatura está vencida há algum tempo. Renove para recuperar o acesso completo.",
        5: "Último aviso: Sua assinatura permanece vencida. Esta é a última notificação que enviaremos. Renove para continuar."
    }
    
    urgency_text = messages.get(attempt, messages[1])
    
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Assinatura Vencida
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            {urgency_text}
        </p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plano anterior:</td>
                    <td style="padding: 8px 0; color: #991b1b; font-size: 14px; font-weight: 600; text-align: right;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Data de vencimento:</td>
                    <td style="padding: 8px 0; color: #991b1b; font-size: 14px; font-weight: 600; text-align: right;">{expired_date}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status:</td>
                    <td style="padding: 8px 0; color: #991b1b; font-size: 14px; font-weight: 600; text-align: right;">Acesso Bloqueado</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Renovar Assinatura
            </a>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Após a renovação, você terá acesso imediato a todos os recursos.
        </p>
    """
    return get_email_base_template(content)


def get_subscription_cancelled_template(
    username: str, 
    plan_name: str, 
    end_date: str,
    monthly_queries: int = None
) -> str:
    """Template de email de assinatura cancelada"""
    
    # Linha de consultas se fornecida
    queries_row = ""
    if monthly_queries:
        queries_formatted = f"{monthly_queries:,}".replace(",", ".")
        queries_row = f"""
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Consultas mensais:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{queries_formatted}</td>
                </tr>"""
    
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            Assinatura Cancelada
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Confirmamos o cancelamento da sua assinatura conforme solicitado.
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            Você continuará tendo acesso aos recursos do seu plano até o final do período já pago.
        </p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plano:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{plan_name}</td>
                </tr>{queries_row}
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Acesso até:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{end_date}</td>
                </tr>
            </table>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Sentiremos sua falta. Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.
        </p>
    """
    return get_email_base_template(content)


def get_usage_warning_template(
    username: str, 
    plan_name: str,
    queries_used: int,
    queries_limit: int,
    percentage_used: int
) -> str:
    """Template de email de alerta de uso (50% ou 80%)"""
    
    if percentage_used >= 80:
        alert_color = "#dc2626"
        alert_bg = "#fef2f2"
        alert_title = "Atenção: Limite de Consultas Próximo"
        alert_message = "Você já utilizou 80% da sua cota mensal de consultas. Considere fazer upgrade do seu plano para evitar interrupções."
    else:
        alert_color = "#f59e0b"
        alert_bg = "#fffbeb"
        alert_title = "Aviso: Metade da Cota Utilizada"
        alert_message = "Você já utilizou 50% da sua cota mensal de consultas. Monitore seu uso para não exceder o limite."
    
    content = f"""
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px; font-weight: 600;">
            {alert_title}
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #334155; font-size: 16px;">
            Olá <strong>{username}</strong>,
        </p>
        
        <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px;">
            {alert_message}
        </p>
        
        <div style="background-color: {alert_bg}; border-left: 4px solid {alert_color}; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plano atual:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-size: 14px; font-weight: 600; text-align: right;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Consultas utilizadas:</td>
                    <td style="padding: 8px 0; color: {alert_color}; font-size: 14px; font-weight: 600; text-align: right;">{queries_used:,} / {queries_limit:,}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Porcentagem utilizada:</td>
                    <td style="padding: 8px 0; color: {alert_color}; font-size: 14px; font-weight: 600; text-align: right;">{percentage_used}%</td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Ver Planos Disponíveis
            </a>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px;">
            Se precisar de mais consultas, você pode fazer upgrade do seu plano a qualquer momento.
        </p>
    """
    return get_email_base_template(content)
