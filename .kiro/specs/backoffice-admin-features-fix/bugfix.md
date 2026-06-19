# Bugfix Requirements Document

## Introduction

This document addresses multiple critical defects in the Backoffice Administrative Features affecting system usability, integration integrity, role-based access control, multi-outlet support, reporting accuracy, settings functionality, and audit trail reliability. The issues span across seven functional areas:

1. Unused "Workflow Status" feature cluttering the interface
2. KDS (Kitchen Display System) settings not affecting actual KDS behavior
3. Role permissions not matching wireframe specifications for Owner/Manager/Kasir roles
4. Outlets management not properly integrated with database
5. Reports showing stale or incorrect data
6. Settings features incomplete (logo upload, unused Integration menu)
7. Activity logs lacking accuracy (missing icons, incorrect user attribution, wrong timezone)

These defects impact operational efficiency, compliance requirements, and system reliability in a multi-tenant restaurant management environment where proper role hierarchy (Owner > Manager > Kasir), multi-outlet support, and accurate audit trails are critical.

## Bug Analysis

### Current Behavior (Defect)

#### 1. Workflow Status Feature

1.1 WHEN a user accesses the Backoffice navigation menu THEN the system displays a "Workflow Status" menu item that is not being used

1.2 WHEN a user clicks on "Workflow Status" THEN the system shows a feature that provides no value to operations

#### 2. KDS Integration

1.3 WHEN an admin modifies Production Time settings in Backoffice THEN the system saves the settings but KDS behavior does not change accordingly

1.4 WHEN an admin modifies KDS Analytics settings in Backoffice THEN the system saves the settings but KDS does not reflect the configuration changes

1.5 WHEN KDS operates THEN it does not respect the Production Time and Analytics configurations set in Backoffice

#### 3. Role Permission Rules

1.6 WHEN a Kasir (Cashier) user attempts to access administrative features THEN the system grants access that contradicts the wireframe specifications

1.7 WHEN a Manager user attempts to access Owner-only features THEN the system either grants inappropriate access or blocks legitimate access contrary to wireframe specifications

1.8 WHEN role permissions are evaluated THEN the system does not enforce the proper hierarchy: Owner > Manager > Kasir

#### 4. Outlets Integration

1.9 WHEN an admin creates or modifies outlet information THEN the system does not properly persist changes to the database

1.10 WHEN the system operates across multiple outlets THEN outlet data does not sync correctly between the interface and database

1.11 WHEN multi-outlet operations occur THEN data integrity issues arise due to improper outlet context handling

#### 5. Reports Integration

1.12 WHEN an admin generates reports THEN the system displays data that is not integrated with the actual database and POS transactions

1.13 WHEN reports are viewed THEN the data shown is stale, inaccurate, or does not reflect real-time POS activity

1.14 WHEN report calculations occur THEN the results do not match actual transaction data from the database

#### 6. Settings Features

1.15 WHEN an admin attempts to upload a logo in Settings THEN the system fails to process or save the uploaded image

1.16 WHEN a user accesses the Settings navigation THEN the system displays an "Integration" menu item that is not being used

1.17 WHEN logo upload is attempted THEN the system either shows an error or appears to succeed but does not persist the logo

#### 7. Activity Logs

1.18 WHEN activity log entries are displayed THEN icons are missing from log entries, reducing visual clarity

1.19 WHEN an admin performs an action that should be logged THEN the system records "System" in the user field instead of the actual admin's identity

1.20 WHEN activity log timestamps are displayed THEN the system shows incorrect time that does not match WIB (Western Indonesian Time, UTC+7)

1.21 WHEN audit trails are reviewed THEN the lack of accurate user attribution and correct timestamps compromises compliance requirements

### Expected Behavior (Correct)

#### 1. Workflow Status Feature

2.1 WHEN a user accesses the Backoffice navigation menu THEN the system SHALL NOT display the "Workflow Status" menu item

2.2 WHEN the system renders navigation THEN the system SHALL exclude all Workflow Status related code and UI elements

#### 2. KDS Integration

2.3 WHEN an admin modifies Production Time settings in Backoffice THEN the system SHALL apply these settings to actual KDS operations immediately or after appropriate synchronization

2.4 WHEN an admin modifies KDS Analytics settings in Backoffice THEN the system SHALL configure KDS to use these analytics parameters in real-time operations

2.5 WHEN KDS operates THEN it SHALL respect and enforce all Production Time and Analytics configurations set in Backoffice

#### 3. Role Permission Rules

2.6 WHEN a Kasir (Cashier) user attempts to access administrative features THEN the system SHALL enforce permissions exactly as specified in the wireframe documentation

2.7 WHEN a Manager user attempts to access features THEN the system SHALL grant or deny access according to the role hierarchy defined in wireframe specifications

2.8 WHEN role permissions are evaluated THEN the system SHALL enforce the proper hierarchy: Owner has full access, Manager has subset access, Kasir has limited access per wireframe

#### 4. Outlets Integration

2.9 WHEN an admin creates or modifies outlet information THEN the system SHALL properly persist all changes to the database with referential integrity

2.10 WHEN the system operates across multiple outlets THEN outlet data SHALL sync correctly and consistently between the interface and database

2.11 WHEN multi-outlet operations occur THEN the system SHALL maintain proper outlet context and data isolation per tenant

#### 5. Reports Integration

2.12 WHEN an admin generates reports THEN the system SHALL query actual database and POS transaction data directly

2.13 WHEN reports are viewed THEN the system SHALL display current, accurate data that reflects real-time or near-real-time POS activity

2.14 WHEN report calculations occur THEN the system SHALL produce results that exactly match transaction data from the database

#### 6. Settings Features

2.15 WHEN an admin attempts to upload a logo in Settings THEN the system SHALL successfully process, save, and display the uploaded image

2.16 WHEN a user accesses the Settings navigation THEN the system SHALL NOT display the unused "Integration" menu item

2.17 WHEN logo upload succeeds THEN the system SHALL persist the logo to storage and display it consistently across the application

#### 7. Activity Logs

2.18 WHEN activity log entries are displayed THEN the system SHALL show appropriate icons for each log entry type to enhance visual clarity

2.19 WHEN an admin performs an action that should be logged THEN the system SHALL record the actual admin's username or identifier in the user field

2.20 WHEN activity log timestamps are displayed THEN the system SHALL show the correct time in WIB timezone (UTC+7)

2.21 WHEN audit trails are reviewed THEN the system SHALL provide accurate user attribution and correct timestamps to meet compliance requirements

### Unchanged Behavior (Regression Prevention)

#### 1. Workflow Status Feature

3.1 WHEN the Workflow Status feature is removed THEN the system SHALL CONTINUE TO display all other navigation menu items correctly

3.2 WHEN users navigate the Backoffice THEN the system SHALL CONTINUE TO provide access to all other functional features without disruption

#### 2. KDS Integration

3.3 WHEN KDS settings are not explicitly configured in Backoffice THEN the system SHALL CONTINUE TO use default KDS behavior

3.4 WHEN KDS displays orders THEN the system SHALL CONTINUE TO show correct order information regardless of Backoffice settings changes

#### 3. Role Permission Rules

3.5 WHEN Owner users access any feature THEN the system SHALL CONTINUE TO grant full administrative access

3.6 WHEN users perform actions within their permitted scope THEN the system SHALL CONTINUE TO execute those actions successfully

3.7 WHEN authentication occurs THEN the system SHALL CONTINUE TO properly identify user roles during login

#### 4. Outlets Integration

3.8 WHEN a single-outlet tenant operates THEN the system SHALL CONTINUE TO function correctly without multi-outlet complexity

3.9 WHEN outlet selection is not required for an operation THEN the system SHALL CONTINUE TO execute the operation without outlet context

3.10 WHEN existing outlet data is queried THEN the system SHALL CONTINUE TO return correct historical outlet information

#### 5. Reports Integration

3.11 WHEN report UI is accessed THEN the system SHALL CONTINUE TO display the report interface and controls correctly

3.12 WHEN report parameters are selected THEN the system SHALL CONTINUE TO accept date ranges, outlet selections, and other filters

3.13 WHEN reports are exported THEN the system SHALL CONTINUE TO generate export files in the expected formats

#### 6. Settings Features

3.13 WHEN other Settings features are used (not logo or Integration) THEN the system SHALL CONTINUE TO save and apply those settings correctly

3.14 WHEN Settings pages are navigated THEN the system SHALL CONTINUE TO display all other settings sections without issues

#### 7. Activity Logs

3.15 WHEN activity log filtering is used THEN the system SHALL CONTINUE TO filter logs by date, user, or action type correctly

3.16 WHEN activity logs are paginated THEN the system SHALL CONTINUE TO load and display log pages correctly

3.17 WHEN activity logs are accessed by different roles THEN the system SHALL CONTINUE TO show logs according to role visibility rules

#### General System Behavior

3.18 WHEN users perform POS operations THEN the system SHALL CONTINUE TO process orders, payments, and transactions correctly

3.19 WHEN the database is queried for non-affected features THEN the system SHALL CONTINUE TO return correct data

3.20 WHEN users log in and out THEN the system SHALL CONTINUE TO handle authentication and session management correctly

3.21 WHEN the system handles concurrent multi-tenant operations THEN the system SHALL CONTINUE TO maintain tenant isolation and data integrity
