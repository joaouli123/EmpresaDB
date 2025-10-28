#!/usr/bin/env python3
"""
Script para testar todos os tipos de email do sistema
Envia exemplos de cada template para um email de teste
"""
import sys
from pathlib import Path
import time

sys.path.insert(0, str(Path(__file__).parent))

from src.services.email_service import email_service

def send_all_emails(test_email: str):
    """Envia todos os tipos de email para teste"""
    
    print("=" * 60)
    print("TESTE DE ENVIO DE EMAILS - DB EMPRESAS")
    print("=" * 60)
    print(f"\nEnviando emails para: {test_email}")
    print(f"SMTP Host: {email_service.host}")
    print(f"SMTP Port: {email_service.port}")
    print(f"SMTP User: {email_service.user}")
    print(f"From Email: {email_service.from_email}")
    print("\n" + "=" * 60 + "\n")
    
    results = []
    
    # 1. Email de criação de conta
    print("📧 1/8 - Enviando: Email de Criação de Conta...")
    success = email_service.send_account_creation_email(
        to_email=test_email,
        username="João Silva (TESTE)"
    )
    results.append(("Criação de Conta", success))
    if success:
        print("   ✅ Enviado com sucesso!")
    else:
        print("   ❌ Falha no envio")
    time.sleep(2)
    
    # 2. Email de assinatura criada
    print("\n📧 2/8 - Enviando: Email de Assinatura Criada...")
    success = email_service.send_subscription_created_email(
        to_email=test_email,
        username="João Silva (TESTE)",
        plan_name="Plano Profissional",
        plan_price=199.90,
        next_billing_date="28/11/2025"
    )
    results.append(("Assinatura Criada", success))
    if success:
        print("   ✅ Enviado com sucesso!")
    else:
        print("   ❌ Falha no envio")
    time.sleep(2)
    
    # 3. Email de assinatura renovada
    print("\n📧 3/8 - Enviando: Email de Assinatura Renovada...")
    success = email_service.send_subscription_renewed_email(
        to_email=test_email,
        username="João Silva (TESTE)",
        plan_name="Plano Profissional",
        amount_paid=199.90,
        next_billing_date="28/12/2025"
    )
    results.append(("Assinatura Renovada", success))
    if success:
        print("   ✅ Enviado com sucesso!")
    else:
        print("   ❌ Falha no envio")
    time.sleep(2)
    
    # 4-8. Emails de assinatura vencida (tentativas 1-5)
    for attempt in range(1, 6):
        print(f"\n📧 {3+attempt}/8 - Enviando: Email de Assinatura Vencida (Tentativa {attempt}/5)...")
        success = email_service.send_subscription_expired_email(
            to_email=test_email,
            username="João Silva (TESTE)",
            plan_name="Plano Profissional",
            expired_date="20/10/2025",
            attempt=attempt
        )
        results.append((f"Assinatura Vencida - Tentativa {attempt}/5", success))
        if success:
            print("   ✅ Enviado com sucesso!")
        else:
            print("   ❌ Falha no envio")
        time.sleep(2)
    
    # 9. Email de alerta de uso 50%
    print("\n📧 9/10 - Enviando: Email de Alerta de Uso 50%...")
    success = email_service.send_usage_warning_email(
        to_email=test_email,
        username="João Silva (TESTE)",
        plan_name="Plano Profissional",
        queries_used=5000,
        queries_limit=10000,
        percentage_used=50
    )
    results.append(("Alerta de Uso 50%", success))
    if success:
        print("   ✅ Enviado com sucesso!")
    else:
        print("   ❌ Falha no envio")
    time.sleep(2)
    
    # 10. Email de alerta de uso 80%
    print("\n📧 10/10 - Enviando: Email de Alerta de Uso 80%...")
    success = email_service.send_usage_warning_email(
        to_email=test_email,
        username="João Silva (TESTE)",
        plan_name="Plano Profissional",
        queries_used=8000,
        queries_limit=10000,
        percentage_used=80
    )
    results.append(("Alerta de Uso 80%", success))
    if success:
        print("   ✅ Enviado com sucesso!")
    else:
        print("   ❌ Falha no envio")
    
    # Resumo
    print("\n" + "=" * 60)
    print("RESUMO DOS ENVIOS")
    print("=" * 60 + "\n")
    
    total = len(results)
    success_count = sum(1 for _, success in results if success)
    failed_count = total - success_count
    
    for email_type, success in results:
        status = "✅ Enviado" if success else "❌ Falhou"
        print(f"{status} - {email_type}")
    
    print("\n" + "=" * 60)
    print(f"Total de emails: {total}")
    print(f"✅ Enviados com sucesso: {success_count}")
    print(f"❌ Falhados: {failed_count}")
    print(f"Taxa de sucesso: {(success_count/total)*100:.1f}%")
    print("=" * 60)
    
    if success_count == total:
        print("\n🎉 TODOS OS EMAILS FORAM ENVIADOS COM SUCESSO!")
        print(f"📬 Verifique a caixa de entrada de: {test_email}")
        print("⚠️  Caso não encontre, verifique a pasta de SPAM/Lixo Eletrônico")
    elif success_count > 0:
        print(f"\n⚠️  ATENÇÃO: {failed_count} email(s) falharam!")
        print("Verifique os logs acima para mais detalhes.")
    else:
        print("\n❌ ERRO: Nenhum email foi enviado!")
        print("Verifique as configurações SMTP nos secrets.")
    
    return success_count, failed_count


if __name__ == "__main__":
    # Email de teste
    TEST_EMAIL = "jl.uli1996@gmail.com"
    
    print("\n🚀 Iniciando teste de envio de emails...")
    print(f"🎯 Destino: {TEST_EMAIL}\n")
    
    try:
        success_count, failed_count = send_all_emails(TEST_EMAIL)
        
        if failed_count == 0:
            print("\n✅ Teste concluído com sucesso!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Teste concluído com {failed_count} falha(s)")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERRO FATAL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
