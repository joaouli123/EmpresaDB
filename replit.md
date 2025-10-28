# Sistema de Consulta CNPJ - Receita Federal

## Overview

This project is an ETL system and REST API designed for querying public CNPJ data from the Brazilian Federal Revenue. Its primary goal is to provide an advanced search and filtering system for Brazilian companies, storing and organizing all Federal Revenue data (companies, establishments, CNPJs, partners) in a PostgreSQL database. The system offers a comprehensive REST API for integration, supporting business intelligence, compliance, and market analysis by efficiently handling large volumes of data. It operates on a subscription model with monthly plans and additional query packages.

## User Preferences

- **Database Configuration**: The PostgreSQL database on the VPS (72.61.217.143:5432/cnpj_db) is the only database to be used. The `DATABASE_URL` in the `.env` file must always point to this VPS. All data (CNPJ, users, API keys, logs) is centralized on the VPS.
- **Replit Configuration (CRITICAL)**: The `frontend/.env` file MUST have `VITE_API_URL=` (empty string). NEVER set a URL in this variable on Replit. The Vite proxy (configured in `vite.config.js`) automatically routes all API requests to the backend on port 8000. Accessing port 8000 directly via external URL will fail on Replit.
- **Frontend Interaction**: Third-party companies should use the frontend normally (registration -> login -> generate API key). The admin can use either the frontend or a Python script to create users.
- **ETL Configuration**: `chunk_size` and `max_workers` for ETL processing should be dynamically adjustable via the admin interface.
- **Security**: Hardcoded credentials must be removed from the codebase and managed via `.env` files. `SECRET_KEY` must be mandatory, at least 32 characters long, and validated at startup. CORS origins must be configurable.
- **Performance**: Dashboard loading times and API query performance are critical. Optimizations for database queries (indexing, materialized views) and efficient counting strategies are highly valued.
- **Data Integrity**: ETL processes should be idempotent, support automatic recovery, and include integrity validation (CSV vs. DB record counts).
- **Stripe Payments (Updated 2025-10-27)**: System now uses ONLY `stripe_subscriptions` table. Old `subscriptions` table deprecated and renamed to `subscriptions_legacy`. All subscription logic centralized in Stripe webhooks. Monthly usage automatically tracked and enforced. Webhook secret mandatory in production.

## System Architecture

The system comprises a React + Vite frontend and a FastAPI + Uvicorn backend, with data persisting in a PostgreSQL 16 database on a user's VPS.

### UI/UX Decisions

The frontend provides a modern, responsive interface with a dashboard for metrics, API key management, API documentation, and user profiles. Administrators have access to a visual dashboard for real-time ETL control via WebSocket, enabling start/stop functionality, parameter configuration, and monitoring of logs and statistics.

### Technical Implementations

- **Database Schema**: Utilizes a schema separation strategy for security; customer data (users, API keys, usage) resides in the `clientes` schema, isolated from public CNPJ data in the `public` schema. The `public` schema is optimized for CNPJ data with auxiliary tables, main entity tables (companies, establishments, partners), ETL tracking, and includes features like automatic full CNPJ generation, optimized indexes, and full-text search.
- **ETL Process**: Handles downloading, extraction, and importation of data from Receita Federal. It features retry mechanisms for downloads, efficient CSV processing using `COPY`, data transformations, and intelligent foreign key handling. The process is idempotent with SHA-256 hash checking, supports automatic recovery, validates data integrity, and provides structured logging.
- **REST API**: Built with FastAPI, offering authenticated endpoints for user and API key management, CNPJ data queries with advanced filtering (social reason, trade name, UF, CNAE, cadastral status, company size, Simples Nacional, MEI, pagination), and admin-only ETL process control. Includes automatic Swagger UI/ReDoc documentation.
- **Security**: Incorporates Argon2 for password hashing, JWT for authentication with configurable expiration, role-based access control (admin/user), API key management with usage tracking, configurable CORS, and flexible login allowing both username and email. Customer data is isolated in a separate database schema.
- **Stripe Integration (2025-10-27)**: Full Stripe payment integration for subscription management. Uses ONLY `clientes.stripe_subscriptions` as the single source of truth. Features include: automatic subscription creation via webhooks, monthly usage tracking (`clientes.monthly_usage`), automatic blocking when limits exceeded, support for canceled subscriptions until period end, webhook signature validation (mandatory in production), and prevention of duplicate active subscriptions per user via UNIQUE constraint.
- **Email System (2025-10-28)**: Automated email notification system with SMTP integration (Hostinger). Features transactional emails (account creation, subscription confirmations), automated follow-ups for expired subscriptions (5 attempts over 15 days), and usage alerts (50% and 80% quota warnings). All emails are tracked in the database (`email_logs`, `subscription_followup_tracking`, `usage_notifications_sent`). **CRITICAL FOR REPLIT**: Email worker must be deployed using Replit's Scheduled Deployments (not cron/systemd). Use `python3 run_email_worker.py` scheduled to run "Every hour". Cost: ~$0.50/month. See `REPLIT_EMAIL_WORKER_SETUP.md` for complete configuration guide.
- **Performance Optimizations**: Critical performance fixes include using PostgreSQL statistics (`pg_class.reltuples`) for fast counts and aggressive in-memory caching for dashboard statistics. Database indexing has been extensively optimized with B-tree and composite indexes on key columns (`data_inicio_atividade`, `uf`, `cnae`, `situacao_cadastral`, `porte`, `mei`, `simples`) for significantly faster queries. API search optimizations use intelligent counting strategies (EXPLAIN for ILIKE, accurate COUNT for exact matches). Connection pooling (`psycopg2.pool.ThreadedConnectionPool`) is implemented for efficient database connection management. Materialized views with a zero-downtime migration strategy are used to accelerate complex queries.
- **Dynamic Configurations**: ETL parameters like `chunk_size` and `max_workers` can be adjusted in real-time via the admin interface.

### Feature Specifications

- **Frontend**: Dashboard with key metrics, API Key management, usage history, comprehensive API documentation, and user profile. Admin features include full ETL control (start/stop, dynamic config), real-time progress via WebSocket, live log viewing, table statistics, and data validation.
- **Backend API Endpoints**:
    - **Authentication**: Register, Login (username or email), Get current user.
    - **User & API Keys**: Profile management, API key generation/listing/revocation, usage tracking.
    - **CNPJ Data**: API info, health check, database stats, query by CNPJ, advanced search with multiple filters, company partners, lists of CNAEs and municipalities.
    - **ETL (Admin Only)**: WebSocket for real-time control, start/stop ETL, status updates, configuration updates, database statistics.
    - **Stripe Payments**: Checkout session creation, customer portal, webhook handler, subscription cancellation.

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