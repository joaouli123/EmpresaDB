#!/bin/bash
# ============================================
# SCRIPT PARA LIBERAR REDIS PARA CONEXÕES REMOTAS
# Execute este script NA VPS (SSH)
# ============================================

echo "🔧 CONFIGURANDO REDIS PARA ACEITAR CONEXÕES REMOTAS"
echo "===================================================="
echo ""

# 1. Fazer backup da configuração
echo "📦 1/4: Fazendo backup da configuração..."
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
echo "   ✅ Backup criado: /etc/redis/redis.conf.backup"
echo ""

# 2. Configurar bind para aceitar conexões de qualquer IP
echo "📝 2/4: Configurando bind 0.0.0.0..."
sudo sed -i 's/^bind 127.0.0.1 ::1/bind 0.0.0.0/' /etc/redis/redis.conf
echo "   ✅ Redis agora aceita conexões remotas"
echo ""

# 3. Verificar se a senha está configurada
echo "🔐 3/4: Verificando senha..."
if grep -q "^requirepass Proelast1608@" /etc/redis/redis.conf; then
    echo "   ✅ Senha já configurada"
else
    echo "   ⚠️ Configurando senha..."
    sudo sed -i 's/^# requirepass.*/requirepass Proelast1608@/' /etc/redis/redis.conf
    echo "   ✅ Senha configurada: Proelast1608@"
fi
echo ""

# 4. Liberar porta no firewall
echo "🔥 4/4: Liberando porta 6379 no firewall..."
sudo ufw allow 6379/tcp 2>/dev/null || echo "   ⚠️ UFW não disponível (firewall pode estar desabilitado)"
echo "   ✅ Porta 6379 liberada"
echo ""

# 5. Reiniciar Redis
echo "🔄 Reiniciando Redis..."
sudo systemctl restart redis-server
sleep 2
echo ""

# 6. Verificar status
echo "✅ Verificando status..."
sudo systemctl status redis-server --no-pager | head -10
echo ""

# 7. Testar conexão local
echo "🧪 Testando conexão local..."
redis-cli -a Proelast1608@ ping
echo ""

echo "===================================================="
echo "🎉 REDIS CONFIGURADO!"
echo "===================================================="
echo ""
echo "📋 CONFIGURAÇÕES APLICADAS:"
echo "   • Bind: 0.0.0.0 (aceita conexões remotas)"
echo "   • Senha: Proelast1608@"
echo "   • Porta: 6379 (liberada no firewall)"
echo ""
echo "🧪 TESTE REMOTO:"
echo "   Execute no Replit:"
echo "   python3 testar_redis.py"
echo ""
echo "💡 REVERTER (se necessário):"
echo "   sudo cp /etc/redis/redis.conf.backup /etc/redis/redis.conf"
echo "   sudo systemctl restart redis-server"
