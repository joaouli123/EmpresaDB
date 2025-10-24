# Sistema de Consulta CNPJ - Receita Federal

## Overview

This project is an ETL (Extract, Transform, Load) system and REST API for querying public CNPJ data from the Brazilian Federal Revenue. Its primary goal is to create an advanced search and filtering system for Brazilian companies, storing and organizing all Federal Revenue data (companies, establishments, CNPJs, partners) in a PostgreSQL database on the user's VPS, complete with a comprehensive REST API for integration. The system aims to provide a robust solution for business intelligence, compliance, and market analysis, handling large volumes of data efficiently.

## User Preferences

**IMPORTANTE - Configuração de Banco de Dados:**
- O usuário **NÃO USA** o banco de dados do Replit
- O sistema conecta-se a um PostgreSQL na **VPS própria do usuário** (via .env)
- O ETL é executado no **Windows local** para popular o banco da VPS (mais rápido)
- Nunca assumir que o banco é o da Replit - sempre usar o banco configurado no DATABASE_URL

## 💼 Modelo de Negócio (Planejamento)

**Sistema de Assinatura + Pacotes Adicionais:**

### Planos Mensais:
1. **Plano Básico** - R$ 59,90/mês
   - 300 consultas/mês de empresas
   
2. **Plano Profissional** - R$ 89,90/mês
   - 500 consultas/mês de empresas
   
3. **Plano Empresarial** - R$ 149,00/mês
   - 1.000 consultas/mês de empresas

### Pacotes Adicionais (Sob Demanda):
- **+200 consultas** - R$ 49,90
- **+400 consultas** - R$ 69,90

### Características do Sistema:
- Limite de consultas mensal por usuário
- Contador em tempo real de uso
- Renovação automática todo mês
- Dashboard mostrando uso atual vs. limite
- Possibilidade de upgrade de plano a qualquer momento
- Compra de pacotes adicionais quando atingir o limite

## Recent Changes (October 24, 2025)

### ETL Import Fixes (Latest)
- **Fixed Estabelecimentos Import Error**: Corrected the error `cannot insert a non-DEFAULT value into column "cnpj_completo"` by ensuring the code reads all 31 CSV columns but only inserts the 30 allowed columns (excluding the auto-generated `cnpj_completo`)
- **Added Missing Constraint**: Added `UNIQUE (cnpj_basico, identificador_socio, cnpj_cpf_socio)` constraint to `socios` table to prevent duplicates and enable proper `ON CONFLICT` handling
- **Improved File Tracking**: Fixed duplicate key errors in ETL tracking by ensuring files with 'completed' status are always skipped, even if there are discrepancies between CSV and DB counts

### Previous Updates
- **Database Reconnected**: Fixed PostgreSQL connection to use Replit's built-in database
- **Schema Separation**: Customer data (users, API keys, usage) now stored in `clientes` schema, completely isolated from public CNPJ data in `public` schema for security
- **Login Enhancement**: Login now accepts both username AND email for authentication
- **Proxy Configuration Fixed**: All backend routes now properly proxied through Vite (/user, /cnpj, /search, /stats, /etl)
- **Test Users Created**:
  - Admin: username=`admin_jl`, email=`jl.uli1996@gmail.com`, password=`Palio123@`
  - User: username=`usuario_demo`, email=`usuario.demo@sistema.com`, password=`Demo123@`
- **Frontend Update**: Login form now shows "Usuário ou E-mail" to indicate flexible authentication

## System Architecture

The system is composed of a React + Vite frontend (port 5000) and a FastAPI + Uvicorn backend (port 8000). Data is stored in a PostgreSQL 16 database hosted on the user's VPS.

### UI/UX Decisions

The frontend uses React with Vite, providing a modern and responsive interface. It includes a dashboard with metrics, API key management, API documentation, and a user profile. For administrators, there's a visual dashboard with real-time ETL control via WebSocket, allowing them to start/stop the ETL process, configure parameters, and monitor logs and statistics.

### Technical Implementations

- **Database Schema**: 
    - **Schema Separation (Security)**: Customer/user data is stored in the `clientes` schema (users, api_keys, user_usage), completely isolated from public company data in the `public` schema. This ensures customer credentials and information are never mixed with public CNPJ data from Receita Federal.
    - **CNPJ Data Schema**: Optimized for CNPJ data in the `public` schema, including auxiliary tables (CNAEs, municipalities, etc.), main tables (companies, establishments, partners, Simples Nacional), and ETL tracking tables. Key features include automatic full CNPJ generation, optimized indexes, and full-text search capabilities.
- **ETL Process**:
    - **Download**: Fetches the latest ZIP files from Receita Federal, classifies them, and downloads the most recent versions. Includes retry mechanisms for corrupted ZIP files.
    - **Extraction**: Unzips files and extracts CSVs (latin1 encoding, semicolon delimiter).
    - **Importation**: Imports data into PostgreSQL using `COPY` for speed, processing in chunks (default 50,000 records). Includes data transformations (date and capital social formats) and intelligent foreign key handling.
    - **Intelligent Tracking**: Ensures idempotency via SHA-256 hash checking, automatic recovery from interruptions, integrity validation (CSV vs. DB record counts), and structured logging.
- **REST API**: Built with FastAPI, providing authenticated endpoints for user management, API key generation/management, CNPJ data queries, and ETL process control (admin-only). Features advanced search filters and automatic Swagger UI/ReDoc documentation.
- **Security**: 
    - Implements Argon2 for password hashing
    - JWT for authentication with configurable expiration
    - Role-based access control (admin/user)
    - API key management with usage tracking
    - CORS configured for the frontend
    - **Login flexibility**: Users can authenticate using either username OR email address
    - **Data isolation**: Customer data stored in separate `clientes` schema from public CNPJ data

### Feature Specifications

- **Frontend**: Dashboard with metrics, API Key management, API usage history, full API documentation, user profile. Admin-specific features include full ETL control (start/stop), dynamic configuration of `chunk_size` and `max_workers`, real-time progress monitoring via WebSocket, live log viewing, detailed table statistics, and automatic validation (CSV vs. DB).
- **Backend API Endpoints**:
    - **Authentication**: Register, Login (accepts username OR email), Get current user.
    - **User & API Keys**: User profile, generate/list/revoke API keys, API key usage.
    - **CNPJ Data**: API info, health check, database stats, query by CNPJ, advanced search with filters (social reason, trade name, UF, municipality, CNAE, cadastral status, company size, Simples Nacional, MEI, pagination), company partners, CNAEs list, municipalities by UF.
    - **ETL (Admin Only)**: WebSocket for real-time connection, start/stop ETL process, ETL status, update ETL config, database stats.
- **Dynamic Configurations**: `chunk_size` (batch processing size) and `max_workers` (parallel processing threads) can be adjusted in real-time via the admin interface.

## External Dependencies

- **Database**: PostgreSQL 16
- **Backend Framework**: FastAPI
- **Web Server**: Uvicorn
- **Database Driver**: `psycopg2-binary`
- **ORM**: SQLAlchemy
- **CSV Processing**: pandas
- **Web Scraping/Download**: requests, BeautifulSoup4
- **Progress Bars**: tqdm
- **Data Validation**: pydantic
- **Password Hashing**: passlib[argon2]
- **JWT**: PyJWT
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Charting Library**: Recharts