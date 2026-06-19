# Bugfix Requirements Document

## Introduction

The General Settings page in the Backoffice module (POS — Pengaturan Umum) fails to persist user-entered configuration values to the database. When users save settings such as brand name, invoice format, tax rate, service charge, and rounding rules, these values are not retained in the database, causing them to revert to default values on subsequent page loads or application restarts.

This prevents outlet administrators from customizing their POS configuration, impacting business operations, invoice generation, and customer-facing documents.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user enters values in the General Settings form (brandName, invoiceFormat, taxRate, serviceCharge, rounding) and clicks "Simpan Perubahan" THEN the system displays a success toast message but the settings are not persisted to the database

1.2 WHEN a user saves General Settings and refreshes the page or navigates away and returns THEN the form fields revert to default values instead of showing the previously saved values

1.3 WHEN the backend receives a PUT request to `/api/settings/:outletId` with General Settings data THEN the settings may fail to be inserted or updated in the `settings` table due to missing error handling, incorrect data transformation, or database constraint violations

### Expected Behavior (Correct)

2.1 WHEN a user enters values in the General Settings form and clicks "Simpan Perubahan" THEN the system SHALL persist all five settings (brandName, invoiceFormat, taxRate, serviceCharge, rounding) as individual rows in the `settings` table with correct key-value pairs

2.2 WHEN a user saves General Settings and refreshes the page or navigates away and returns THEN the system SHALL retrieve the saved settings from the database and populate the form fields with the previously saved values

2.3 WHEN the backend receives a PUT request to `/api/settings/:outletId` with General Settings data THEN the system SHALL successfully upsert each setting using the correct tenant_id, outlet_id, key, value, and type fields, and SHALL return appropriate error messages if the operation fails

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user saves settings for other categories (receipt settings, payment methods, tax settings, printer settings) THEN the system SHALL CONTINUE TO persist those settings correctly using the existing `saveSetting()` function

3.2 WHEN the GET `/api/settings/:outletId` endpoint is called THEN the system SHALL CONTINUE TO return the merged settings map from `SettingsService.resolveSettings()` with correct type parsing (boolean, number, json, string)

3.3 WHEN multiple outlets exist under the same tenant THEN the system SHALL CONTINUE TO maintain outlet-specific settings isolation using the UNIQUE(tenant_id, outlet_id, key) constraint

3.4 WHEN settings are saved THEN the system SHALL CONTINUE TO log the activity in the `activity_logs` table with action='update', entity_type='settings', and a description of changed keys
