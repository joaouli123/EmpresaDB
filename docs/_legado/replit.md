# Sistema de Consulta CNPJ - Receita Federal

## Overview

This project is an ETL system and REST API designed for querying public CNPJ data from the Brazilian Federal Revenue. Its primary goal is to provide an advanced search and filtering system for Brazilian companies, storing and organizing all Federal Revenue data (companies, establishments, CNPJs, partners) in a PostgreSQL database. The system offers a comprehensive REST API for integration, supporting business intelligence, compliance, and market analysis by efficiently handling large volumes of data. It operates on a subscription model with monthly plans and additional query packages. The business vision is to offer a robust, scalable, and secure platform for accessing critical Brazilian company data, targeting businesses, analysts, and developers.

## User Preferences

- **Database Configuration**: The PostgreSQL database on the VPS (72.61.217.143:5432/cnpj_db) is the only database to be used. The `DATABASE_URL` must be configured in Replit Secrets for production security. All data (CNPJ, users, API keys, logs) is centralized on the VPS.
- **Replit Configuration (CRITICAL)**: 
  - Backend runs locally on port 8000 but connects to VPS database
  - Frontend runs on port 5000 with Vite proxy routing to localhost:8000
  - NO frontend/.env file needed - proxy handles all routing automatically
  - Deploy config uses Autoscale with build + run commands for production
- **API Admin Access**: The `verify_api_key` function now returns complete user info (id, username, email, role, is_active). Admin-only endpoints like `/search` verify `role='admin'`. Use `scripts/set_admin_user.sql` to grant admin permissions. See `API_ADMIN_GUIDE.md` for integration details.
- **Frontend Interaction**: Third-party companies should use the frontend normally (registration -> login -> generate API key). The admin can use either the frontend or a Python script to create users.
- **ETL Configuration**: `chunk_size` and `max_workers` for ETL processing should be dynamically adjustable via the admin interface.
- **Security**: All credentials managed via Replit Secrets (DATABASE_URL, SECRET_KEY, STRIPE keys, etc). `SECRET_KEY` must be minimum 32 characters. CORS origins must be configured for production.
- **Performance**: Dashboard loading times and API query performance are critical. Optimizations for database queries (indexing, materialized views) and efficient counting strategies are highly valued.
- **Data Integrity**: ETL processes should be idempotent, support automatic recovery, and include integrity validation (CSV vs. DB record counts).
- **Stripe Payments**: System now uses ONLY `stripe_subscriptions` table. Old `subscriptions` table deprecated and renamed to `subscriptions_legacy`. All subscription logic centralized in Stripe webhooks. Monthly usage automatically tracked and enforced. Webhook secret mandatory in production.
- **Email Worker**: Email worker must be deployed using Replit's Scheduled Deployments. Use `python3 run_email_worker.py` scheduled to run "Every hour".
- **Deployment**: Configured for Replit Autoscale deployment. Build step installs frontend dependencies, run step builds frontend and starts uvicorn on port 5000.

## System Architecture

The system comprises a React + Vite frontend and a FastAPI + Uvicorn backend, with data persisting in a PostgreSQL 16 database on a user's VPS.

### UI/UX Decisions

The frontend provides a modern, responsive interface with a dashboard for metrics, API key management, API documentation, and user profiles. Administrators have access to a visual dashboard for real-time ETL control via WebSocket, enabling start/stop functionality, parameter configuration, and monitoring of logs and statistics. The pricing section on the landing page clearly distinguishes between monthly/annual plans and enterprise options, with clear CTAs.

### Technical Implementations

- **Database Schema**: Utilizes a schema separation strategy with `clientes` for user data and `public` for CNPJ data, optimized with indexes, full-text search, and ETL tracking.
- **ETL Process**: Handles data ingestion from Receita Federal, featuring retry mechanisms, efficient CSV processing, data transformations, idempotent operations with SHA-256 hash checking, automatic recovery, and structured logging.
- **REST API**: Built with FastAPI, providing authenticated endpoints for user/API key management, CNPJ data queries with advanced filtering and pagination, and admin-only ETL control. API errors return structured JSON. Data isolation per user is enforced across all endpoints.
- **Security**: Implements Argon2 for password hashing, JWT for authentication, role-based access control, API key management with usage tracking, and configurable CORS.
- **Stripe Integration**: Full payment integration using `clientes.stripe_subscriptions` as the single source of truth for subscriptions. Features include webhook-driven subscription creation, monthly usage tracking, automatic blocking on limit exceedance, and webhook signature validation. The system also supports one-time purchase batch query packages.
- **Email System**: Automated SMTP-integrated email notifications for account activation, subscription confirmations, follow-ups for expired subscriptions, and usage alerts. Emails are branded and tracked in the database.
- **Account Activation**: Secure email-based activation flow for new user accounts, requiring activation before login.
- **Free Tier System**: All new users receive a Free plan with 200 queries/month, with dashboard access, usage statistics, and upgrade incentives.
- **Performance Optimizations**: Extensive database indexing (B-tree, composite), fast count strategies using `pg_class.reltuples`, aggressive in-memory caching for dashboard statistics, connection pooling, and materialized views for complex queries. Dashboard global statistics are static for faster loading.
- **Batch Query System**: Provides functionality to search thousands of CNPJs at once with credit-based pricing, advanced filtering, credit consumption tracking, and rate limits per plan. Integrated with Stripe for package purchases.
- **Dynamic Configurations**: ETL parameters (`chunk_size`, `max_workers`) are adjustable via the admin interface.

### Feature Specifications

- **Frontend**: Dashboard for metrics, API Key management, usage history, API documentation, user profile. Admin features for ETL control (start/stop, config, logs, stats).
- **Backend API Endpoints**: Authentication (register, activate, login, current user), User & API Keys (profile, key management, usage), CNPJ Data (query, search, partners, lists), ETL (admin-only control), Stripe Payments (checkout, portal, webhooks, cancellation), Batch Query (search, credits).

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