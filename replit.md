# Sistema de Consulta CNPJ - Receita Federal

## Overview

This project is an ETL (Extract, Transform, Load) system and REST API for querying public CNPJ data from the Brazilian Federal Revenue. Its primary goal is to create an advanced search and filtering system for Brazilian companies, storing and organizing all Federal Revenue data (companies, establishments, CNPJs, partners) in a PostgreSQL database on the user's VPS, complete with a comprehensive REST API for integration. The system aims to provide a robust solution for business intelligence, compliance, and market analysis, handling large volumes of data efficiently.

## User Preferences

No specific user preferences were provided in the original document. The system is designed to be highly configurable and offers both a graphical user interface for administration and a REST API for programmatic access.

## System Architecture

The system is composed of a React + Vite frontend (port 5000) and a FastAPI + Uvicorn backend (port 8000). Data is stored in a PostgreSQL 16 database hosted on the user's VPS.

### UI/UX Decisions

The frontend uses React with Vite, providing a modern and responsive interface. It includes a dashboard with metrics, API key management, API documentation, and a user profile. For administrators, there's a visual dashboard with real-time ETL control via WebSocket, allowing them to start/stop the ETL process, configure parameters, and monitor logs and statistics.

### Technical Implementations

- **Database Schema**: Optimized for CNPJ data, including auxiliary tables (CNAEs, municipalities, etc.), main tables (companies, establishments, partners, Simples Nacional), and ETL tracking tables. Key features include automatic full CNPJ generation, optimized indexes, and full-text search capabilities.
- **ETL Process**:
    - **Download**: Fetches the latest ZIP files from Receita Federal, classifies them, and downloads the most recent versions. Includes retry mechanisms for corrupted ZIP files.
    - **Extraction**: Unzips files and extracts CSVs (latin1 encoding, semicolon delimiter).
    - **Importation**: Imports data into PostgreSQL using `COPY` for speed, processing in chunks (default 50,000 records). Includes data transformations (date and capital social formats) and intelligent foreign key handling.
    - **Intelligent Tracking**: Ensures idempotency via SHA-256 hash checking, automatic recovery from interruptions, integrity validation (CSV vs. DB record counts), and structured logging.
- **REST API**: Built with FastAPI, providing authenticated endpoints for user management, API key generation/management, CNPJ data queries, and ETL process control (admin-only). Features advanced search filters and automatic Swagger UI/ReDoc documentation.
- **Security**: Implements Argon2 for password hashing, JWT for authentication with configurable expiration, role-based access control (admin/user), and API key management with usage tracking. CORS is configured for the frontend.

### Feature Specifications

- **Frontend**: Dashboard with metrics, API Key management, API usage history, full API documentation, user profile. Admin-specific features include full ETL control (start/stop), dynamic configuration of `chunk_size` and `max_workers`, real-time progress monitoring via WebSocket, live log viewing, detailed table statistics, and automatic validation (CSV vs. DB).
- **Backend API Endpoints**:
    - **Authentication**: Register, Login, Get current user.
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