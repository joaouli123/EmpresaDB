#!/usr/bin/env python3
"""
Script de teste para todos os emails atualizados do sistema
Testa:
- Email de ativação (NOVO)
- Email de boas-vindas
- Email de assinatura criada (com quantidade de consultas)
- Email de assinatura renovada (com quantidade de consultas)
- Email de assinatura vencida (sem "Lembrete X/5")
- Email de assinatura cancelada (com quantidade de consultas)
- Emails de alerta de uso (50% e 80%)
"""

import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.services.email_service import email_service

def test_all_emails():
    """Testa todos os emails do sistema"""
    
    # Email de teste
    test_email = "jl.uli1996@gmail.com"
    test_username = "João Lucas"
    
    print("=" * 60)
    print("TESTE DE TODOS OS EMAILS - DB EMPRESAS (ATUALIZADO)")
    print("=" * 60)
    print()
    print(f"📧 Enviando emails para: {test_email}")
    print()
    print("=" * 60)
    print()
    
    results = []
    total = 11  # Agora temos 11 emails para testar
    
    # 1. Email de Ativação de Conta (NOVO)
    print(f"📧 1/{total} - Enviando: Email de Ativação de Conta (NOVO)...")
    try:
        # Gerar token de exemplo para o link
        activation_link = "https://www.dbempresas.com.br/auth/activate/exemplo_token_ativacao_12345"
        success = email_service.send_account_activation_email(
            to_email=test_email,
            username=test_username,
            activation_link=activation_link
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Ativação de Conta (NOVO)"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Ativação de Conta (NOVO)"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Ativação de Conta: {e}"))
    print()
    
    # 2. Email de Boas-vindas (enviado após ativação)
    print(f"📧 2/{total} - Enviando: Email de Boas-vindas (após ativação)...")
    try:
        success = email_service.send_account_creation_email(
            to_email=test_email,
            username=test_username
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Boas-vindas"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Boas-vindas"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Boas-vindas: {e}"))
    print()
    
    # 3. Email de Assinatura Criada (COM quantidade de consultas)
    print(f"📧 3/{total} - Enviando: Email de Assinatura Criada (com consultas)...")
    try:
        next_date = (datetime.now() + timedelta(days=30)).strftime("%d/%m/%Y")
        success = email_service.send_subscription_created_email(
            to_email=test_email,
            username=test_username,
            plan_name="Plano Profissional",
            plan_price=199.90,
            next_billing_date=next_date,
            monthly_queries=10000  # ADICIONADO
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Assinatura Criada (com consultas)"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Assinatura Criada"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Assinatura Criada: {e}"))
    print()
    
    # 4. Email de Assinatura Renovada (COM quantidade de consultas)
    print(f"📧 4/{total} - Enviando: Email de Assinatura Renovada (com consultas)...")
    try:
        next_date = (datetime.now() + timedelta(days=30)).strftime("%d/%m/%Y")
        success = email_service.send_subscription_renewed_email(
            to_email=test_email,
            username=test_username,
            plan_name="Plano Profissional",
            amount_paid=199.90,
            next_billing_date=next_date,
            monthly_queries=10000  # ADICIONADO
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Assinatura Renovada (com consultas)"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Assinatura Renovada"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Assinatura Renovada: {e}"))
    print()
    
    # 5-8. Emails de Assinatura Vencida (SEM "Lembrete X/5")
    for attempt in range(1, 5):
        print(f"📧 {4+attempt}/{total} - Enviando: Email de Assinatura Vencida (Tentativa {attempt}/5 - SEM 'Lembrete')...")
        try:
            expired_date = (datetime.now() - timedelta(days=5)).strftime("%d/%m/%Y")
            success = email_service.send_subscription_expired_email(
                to_email=test_email,
                username=test_username,
                plan_name="Plano Profissional",
                expired_date=expired_date,
                attempt=attempt
            )
            if success:
                print("   ✅ Enviado com sucesso!")
                results.append(("✅ Enviado", f"Assinatura Vencida - Tentativa {attempt}/5 (sem 'Lembrete')"))
            else:
                print("   ❌ Falha no envio")
                results.append(("❌ Falhado", f"Assinatura Vencida - Tentativa {attempt}/5"))
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            results.append(("❌ Erro", f"Assinatura Vencida {attempt}: {e}"))
        print()
    
    # 9. Email de Assinatura Cancelada (COM quantidade de consultas)
    print(f"📧 9/{total} - Enviando: Email de Assinatura Cancelada (com consultas)...")
    try:
        end_date = (datetime.now() + timedelta(days=15)).strftime("%d/%m/%Y")
        success = email_service.send_subscription_cancelled_email(
            to_email=test_email,
            username=test_username,
            plan_name="Plano Profissional",
            end_date=end_date,
            monthly_queries=10000  # ADICIONADO
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Assinatura Cancelada (com consultas)"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Assinatura Cancelada"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Assinatura Cancelada: {e}"))
    print()
    
    # 10. Email de Alerta de Uso 50%
    print(f"📧 10/{total} - Enviando: Email de Alerta de Uso 50%...")
    try:
        success = email_service.send_usage_warning_email(
            to_email=test_email,
            username=test_username,
            plan_name="Plano Profissional",
            queries_used=5000,
            queries_limit=10000,
            percentage_used=50
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Alerta de Uso 50%"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Alerta de Uso 50%"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Alerta de Uso 50%: {e}"))
    print()
    
    # 11. Email de Alerta de Uso 80%
    print(f"📧 11/{total} - Enviando: Email de Alerta de Uso 80%...")
    try:
        success = email_service.send_usage_warning_email(
            to_email=test_email,
            username=test_username,
            plan_name="Plano Profissional",
            queries_used=8000,
            queries_limit=10000,
            percentage_used=80
        )
        if success:
            print("   ✅ Enviado com sucesso!")
            results.append(("✅ Enviado", "Alerta de Uso 80%"))
        else:
            print("   ❌ Falha no envio")
            results.append(("❌ Falhado", "Alerta de Uso 80%"))
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        results.append(("❌ Erro", f"Alerta de Uso 80%: {e}"))
    print()
    
    # Resumo
    print("=" * 60)
    print("RESUMO DOS ENVIOS")
    print("=" * 60)
    print()
    
    for status, description in results:
        print(f"{status} - {description}")
    
    print()
    print("=" * 60)
    success_count = sum(1 for s, _ in results if s == "✅ Enviado")
    failed_count = len(results) - success_count
    
    print(f"Total de emails: {total}")
    print(f"✅ Enviados com sucesso: {success_count}")
    print(f"❌ Falhados: {failed_count}")
    print(f"Taxa de sucesso: {(success_count/total)*100:.1f}%")
    print("=" * 60)
    print()
    
    if success_count == total:
        print("🎉 TODOS OS EMAILS FORAM ENVIADOS COM SUCESSO!")
    else:
        print("⚠️  Alguns emails falharam. Verifique os erros acima.")
    
    print(f"📬 Verifique a caixa de entrada de: {test_email}")
    print("⚠️  Caso não encontre, verifique a pasta de SPAM/Lixo Eletrônico")
    print()
    print("✅ Teste concluído com sucesso!")

if __name__ == "__main__":
    test_all_emails()
