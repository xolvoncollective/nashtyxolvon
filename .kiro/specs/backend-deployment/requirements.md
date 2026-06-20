# Requirements Document: Backend & Database Deployment to 100%

## Introduction

This document specifies the requirements for deploying and organizing the Nashty OS backend API, Supabase database schema, edge functions, and completing all integrations to achieve a 100/100 system score. The current system has accumulated technical debt with disorganized database structure, incomplete API endpoints, missing database tables, and undeployed optimizations.

## Glossary

- **Backend_API**: Express.js + TypeScript API server handling auth, favorites, analytics, and settings
- **Supabase**: PostgreSQL database with Realtime and Storage services
- **Edge_Function**: Serverless functions deployed to Supabase edge runtime
- **RLS_Policy**: Row Level Security policies for multi-tenant data isolation
- **Database_Index**: Database performance optimization indexes
- **Railway**: Cloud platform hosting the Express backend
- **Token_Blacklist**: Database table storing invalidated JWT tokens
- **Outlet_Settings**: Database table storing receipt and display customization per outlet
- **Analytics_Cache**: Temporary storage for expensive aggregation queries
- **Migration_Script**: SQL script that modifies database schema safely

## Requirements

### Requirement 1: Database Schema Cleanup and Organization

**User Story:** As a database administrator, I want a clean and organized database schema, so that the system is maintainable and performant.

#### Acceptance Criteria

1. WHEN analyzing the current database, THE system SHALL identify all missing tables required by the backend API
2. WHEN creating missing tables, THE system SHALL follow the existing naming conventions and multi-tenant architecture
3. THE system SHALL create the `favorites` table with fields: id, user_id, product_id, position, created_at
4. THE system SHALL create the `outlet_settings` table with fields: id, outlet_id, key, value, type, created_at, updated_at
5. THE system SHALL create the `token_blacklist` table with fields: token_hash, user_id, expires_at, created_at
6. THE system SHALL create the `analytics_cache` table with fields: id, cache_key, outlet_id, data, expires_at, created_at
7. THE system SHALL add missing indexes for performance-critical queries
8. THE system SHALL document all schema changes in a migration script

### Requirement 2: Deploy Database Performance Indexes

**User Story:** As a system administrator, I want optimized database indexes deployed, so that queries run 70-87% faster.

#### Acceptance Criteria

1. WHEN deploying `database-indexes-optimization.sql`, THE system SHALL create 35+ strategic indexes
2. THE system SHALL create composite indexes for: outlet_id + created_at, outlet_id + status, kitchen_status + created_at
3. THE system SHALL create GIN indexes for full-text search on product names and descriptions
4. THE system SHALL create indexes on foreign keys for join optimization
5. WHEN indexes are deployed, THE system SHALL run VACUUM ANALYZE to update statistics
6. THE system SHALL verify index creation with verification queries
7. IF index already exists, THE system SHALL skip creation without error

### Requirement 3: Deploy Row Level Security Policies

**User Story:** As a security administrator, I want RLS policies enforcing multi-tenant isolation, so that tenants cannot access each other's data.

#### Acceptance Criteria

1. WHEN deploying `database-rls-policies.sql`, THE system SHALL enable RLS on all 16 core tables
2. THE system SHALL create helper functions: auth.tenant_id(), auth.outlet_id(), auth.user_id(), auth.user_role()
3. THE system SHALL create admin policies allowing full tenant access for owner/manager roles
4. THE system SHALL create cashier policies allowing only own outlet and own order access
5. THE system SHALL create kitchen policies allowing read-only access to preparing/ready orders
6. THE system SHALL test RLS policies with sample queries for each role
7. WHEN RLS is enabled, THE system SHALL update backend to set session variables after JWT verification

### Requirement 4: Complete Backend API Deployment

**User Story:** As a backend developer, I want all API endpoints deployed to Railway, so that frontend applications can consume them.

#### Acceptance Criteria

1. WHEN deploying to Railway, THE system SHALL install all dependencies from package.json
2. THE system SHALL set environment variables from the provided credentials
3. THE system SHALL verify Supabase connection using health check endpoint
4. THE system SHALL deploy auth routes: POST /api/auth/refresh
5. THE system SHALL deploy favorites routes: GET, POST, DELETE, PUT /api/favorites
6. THE system SHALL deploy analytics routes: GET /api/analytics/top-products
7. THE system SHALL deploy settings routes: GET, PUT /api/outlets/:id/settings, POST /api/outlets/:id/upload-logo, POST /api/outlets/:id/upload-promo-images
8. WHEN deployment completes, THE system SHALL test each endpoint with sample requests
9. THE system SHALL configure CORS to allow requests from https://nashtyxolvon2.pages.dev

### Requirement 5: Supabase Storage Configuration

**User Story:** As a system administrator, I want Supabase Storage buckets configured, so that logos and promotional images can be uploaded.

#### Acceptance Criteria

1. WHEN configuring Storage, THE system SHALL create bucket named `receipts` for receipt logos
2. THE system SHALL create bucket named `promotions` for promotional images
3. THE system SHALL set bucket `receipts` to accept PNG, JPG, SVG files with 2MB max size
4. THE system SHALL set bucket `promotions` to accept PNG, JPG files with 5MB max size
5. THE system SHALL configure public read access for both buckets
6. THE system SHALL configure RLS policies for upload requiring authenticated users
7. THE system SHALL test file upload with sharp image resizing (200px width for logos)

### Requirement 6: Edge Functions Deployment

**User Story:** As a backend developer, I want edge functions deployed to Supabase, so that serverless operations run close to users.

#### Acceptance Criteria

1. WHEN deploying edge functions, THE system SHALL migrate existing functions/api/*.js to Supabase edge format
2. THE system SHALL create edge function for auth-login with JWT generation
3. THE system SHALL create edge function for dashboard-api with aggregated statistics
4. THE system SHALL create edge function for orders-api with order CRUD operations
5. THE system SHALL create edge function for reports-api with sales reports
6. WHEN edge functions are deployed, THE system SHALL set SUPABASE_SERVICE_ROLE_KEY environment variable
7. THE system SHALL test each edge function with sample invocations
8. THE system SHALL update frontend API client to use edge function URLs where appropriate

### Requirement 7: Database Migration Scripts

**User Story:** As a database administrator, I want safe migration scripts, so that schema changes don't break production data.

#### Acceptance Criteria

1. WHEN creating migration scripts, THE system SHALL wrap all DDL statements in transactions
2. THE system SHALL check for table existence before CREATE TABLE
3. THE system SHALL check for column existence before ALTER TABLE ADD COLUMN
4. THE system SHALL check for index existence before CREATE INDEX
5. THE system SHALL provide rollback scripts for each migration
6. THE system SHALL test migrations on a copy of production data
7. THE system SHALL document migration order and dependencies

### Requirement 8: Backend Integration Testing

**User Story:** As a QA engineer, I want comprehensive integration tests, so that all endpoints work correctly with the database.

#### Acceptance Criteria

1. WHEN running integration tests, THE system SHALL test auth token refresh flow
2. THE system SHALL test favorites CRUD operations (create, read, update, delete, reorder)
3. THE system SHALL test analytics endpoint with mocked order data (verify aggregation logic)
4. THE system SHALL test settings endpoints with logo upload and retrieval
5. THE system SHALL test RLS policies by simulating different user roles
6. THE system SHALL test error handling for invalid inputs (400 responses)
7. THE system SHALL test authentication failures (401 responses)
8. THE system SHALL test authorization failures (403 responses)
9. WHEN all tests pass, THE system SHALL generate integration test report

### Requirement 9: Frontend API Client Integration

**User Story:** As a frontend developer, I want updated API clients, so that frontends can call the new backend endpoints.

#### Acceptance Criteria

1. WHEN updating api-client-v2.js, THE system SHALL replace placeholder URLs with Railway production URLs
2. THE system SHALL add methods for: refreshToken, getFavorites, addFavorite, removeFavorite, reorderFavorites
3. THE system SHALL add methods for: getTopProducts, getOutletSettings, updateOutletSettings, uploadLogo, uploadPromoImages
4. THE system SHALL implement automatic token refresh on 401 responses
5. THE system SHALL add request/response logging for debugging
6. THE system SHALL update POS frontend to use new API client methods
7. THE system SHALL update Backoffice frontend to use new API client methods

### Requirement 10: Performance Benchmarking

**User Story:** As a system administrator, I want performance benchmarks, so that I can verify the 70-87% speed improvements.

#### Acceptance Criteria

1. WHEN running benchmarks, THE system SHALL measure dashboard query time before and after indexes
2. THE system SHALL measure KDS query time before and after indexes (target: 120ms → 30ms)
3. THE system SHALL measure order history query time before and after indexes (target: 150ms → 20ms)
4. THE system SHALL measure product search time before and after indexes (target: 80ms → 15ms)
5. THE system SHALL measure activity logs query time before and after indexes (target: 200ms → 40ms)
6. THE system SHALL run benchmarks with realistic data volume (1000 orders, 500 products, 50 users)
7. WHEN benchmarks complete, THE system SHALL generate performance report comparing before/after

### Requirement 11: Documentation and Deployment Guide

**User Story:** As a DevOps engineer, I want clear deployment documentation, so that I can maintain and redeploy the system.

#### Acceptance Criteria

1. WHEN creating deployment guide, THE system SHALL document Railway deployment steps
2. THE system SHALL document Supabase configuration steps (Storage buckets, RLS policies, indexes)
3. THE system SHALL document edge function deployment commands
4. THE system SHALL document environment variable requirements for each service
5. THE system SHALL document database migration execution order
6. THE system SHALL document rollback procedures for failed deployments
7. THE system SHALL document monitoring and logging setup
8. THE system SHALL create deployment checklist for production releases

### Requirement 12: Production Monitoring Setup

**User Story:** As a system administrator, I want monitoring and alerts configured, so that I know immediately when something breaks.

#### Acceptance Criteria

1. WHEN configuring monitoring, THE system SHALL set up Railway deployment logs
2. THE system SHALL set up Supabase database performance monitoring
3. THE system SHALL configure error alerts for 5xx responses
4. THE system SHALL configure performance alerts for slow queries (>1s)
5. THE system SHALL configure uptime monitoring for health check endpoint
6. THE system SHALL configure disk space alerts for database storage (>80% usage)
7. THE system SHALL document alert notification channels (email, Slack, etc.)

### Requirement 13: Security Hardening

**User Story:** As a security administrator, I want security hardening applied, so that the system is protected from common attacks.

#### Acceptance Criteria

1. WHEN hardening security, THE system SHALL enable Helmet.js security headers
2. THE system SHALL implement rate limiting on auth endpoints (10 requests per minute)
3. THE system SHALL implement rate limiting on file upload endpoints (5 uploads per minute)
4. THE system SHALL validate all file uploads (MIME type, file size, file extension)
5. THE system SHALL sanitize all user inputs before database queries
6. THE system SHALL use parameterized queries to prevent SQL injection
7. THE system SHALL configure HTTPS-only for all API endpoints
8. THE system SHALL implement CSRF protection for state-changing operations

### Requirement 14: Deployment Rollout Plan

**User Story:** As a project manager, I want a phased deployment plan, so that we minimize risk during production deployment.

#### Acceptance Criteria

1. WHEN planning deployment, THE system SHALL define Phase 1: Database migrations (indexes, RLS, new tables)
2. THE system SHALL define Phase 2: Backend API deployment to Railway
3. THE system SHALL define Phase 3: Edge functions deployment to Supabase
4. THE system SHALL define Phase 4: Frontend integration and testing
5. THE system SHALL define Phase 5: Performance benchmarking and optimization
6. WHEN each phase completes, THE system SHALL require sign-off before proceeding
7. THE system SHALL define rollback criteria for each phase
8. THE system SHALL schedule deployment during low-traffic window

### Requirement 15: Final System Audit

**User Story:** As a project stakeholder, I want a final system audit, so that I can verify we achieved 100/100 score.

#### Acceptance Criteria

1. WHEN conducting final audit, THE system SHALL verify all database tables exist and are properly indexed
2. THE system SHALL verify all API endpoints return expected responses
3. THE system SHALL verify RLS policies enforce proper tenant isolation
4. THE system SHALL verify performance improvements meet targets (70-87% faster)
5. THE system SHALL verify security hardening is applied
6. THE system SHALL verify monitoring and alerts are active
7. THE system SHALL verify documentation is complete and accurate
8. WHEN audit completes, THE system SHALL generate final audit report with overall score
9. IF score is less than 100/100, THE system SHALL identify remaining issues and create action items
