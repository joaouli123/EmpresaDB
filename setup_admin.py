#!/usr/bin/env python3
"""Cria/redefine o usuario admin com senha forte gerada em runtime.
Uso: DATABASE_URL=... python setup_admin.py"""
import os
import secrets
import string
import psycopg2
from passlib.context import CryptContext

EMAIL = os.getenv("ADMIN_EMAIL", "jl.uli1996@gmail.com")
pwd = CryptContext(schemes=["argon2"], deprecated="auto")
alphabet = string.ascii_letters + string.digits
password = "Db" + "".join(secrets.choice(alphabet) for _ in range(11)) + "@7"
h = pwd.hash(password)

url = os.environ["DATABASE_URL"]
c = psycopg2.connect(url, connect_timeout=20)
cur = c.cursor()
cur.execute(
    """INSERT INTO clientes.users (username, email, phone, cpf, password, role, is_active)
       VALUES (%s, %s, %s, %s, %s, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin', is_active = TRUE
       RETURNING id, username, email, role, is_active""",
    ("admin_jl", EMAIL, "41999999999", "00000000000", h),
)
r = cur.fetchone()
c.commit()
cur.close()
c.close()
print("ADMIN:", r)
print("SENHA_TEMPORARIA:", password)
print("Troque a senha apos o primeiro login.")
