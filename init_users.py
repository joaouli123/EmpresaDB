import asyncio
import hashlib
from src.database.connection import db_manager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

async def init_users():
    logger.info("Inicializando schema de usuários...")
    
    try:
        success = db_manager.execute_schema('src/database/users_schema.sql')
        if success:
            logger.info("✅ Schema de usuários criado com sucesso!")
        else:
            logger.error("❌ Erro ao criar schema de usuários")
            return
    except Exception as e:
        logger.error(f"❌ Erro ao criar schema: {e}")
        return
    
    logger.info("\nCriando usuários...")
    
    admin_email = "jl.uli1996@gmail.com"
    admin_password = "Palio123@"
    admin_username = "admin_jl"
    
    user_email = "usuario.demo@sistema.com"
    user_password = "Demo123@"
    user_username = "usuario_demo"
    
    try:
        existing_admin = await db_manager.get_user_by_username(admin_username)
        if existing_admin:
            logger.info(f"⚠️  Usuário admin '{admin_username}' já existe")
        else:
            admin_user = await db_manager.create_user(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                role='admin'
            )
            if admin_user:
                logger.info(f"✅ Admin criado com sucesso!")
                logger.info(f"   Email: {admin_email}")
                logger.info(f"   Usuário: {admin_username}")
                logger.info(f"   Senha: {admin_password}")
            else:
                logger.error("❌ Erro ao criar usuário admin")
        
        existing_user = await db_manager.get_user_by_username(user_username)
        if existing_user:
            logger.info(f"⚠️  Usuário normal '{user_username}' já existe")
        else:
            normal_user = await db_manager.create_user(
                username=user_username,
                email=user_email,
                hashed_password=get_password_hash(user_password),
                role='user'
            )
            if normal_user:
                logger.info(f"✅ Usuário normal criado com sucesso!")
                logger.info(f"   Email: {user_email}")
                logger.info(f"   Usuário: {user_username}")
                logger.info(f"   Senha: {user_password}")
            else:
                logger.error("❌ Erro ao criar usuário normal")
        
        logger.info("\n" + "="*50)
        logger.info("CREDENCIAIS DE ACESSO")
        logger.info("="*50)
        logger.info(f"\nADMIN:")
        logger.info(f"  Email: {admin_email}")
        logger.info(f"  Usuário: {admin_username}")
        logger.info(f"  Senha: {admin_password}")
        logger.info(f"\nUSUÁRIO NORMAL:")
        logger.info(f"  Email: {user_email}")
        logger.info(f"  Usuário: {user_username}")
        logger.info(f"  Senha: {user_password}")
        logger.info("="*50)
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar usuários: {e}")

if __name__ == "__main__":
    asyncio.run(init_users())
