# Bugfix Requirements Document

## Introduction

The Payment Methods settings page in the Backoffice module (POS — Metode Pembayaran) fails to persist payment method activation states to the database. When users toggle payment methods (Tunai, Transfer, QRIS, BCA, Debit, GoFood, GrabFood, ShopeeFood) on or off, these preferences are not retained in the database, causing payment method availability to revert to default states on subsequent page loads.

This prevents outlet administrators from customizing which payment methods are available at the POS, potentially causing confusion for cashiers and limiting payment flexibility for customers.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user toggles a payment method checkbox in the Payment Methods settings page and the system saves the `paymentMethods` setting as a JSON string THEN the setting is not persisted to the database or is persisted with incorrect serialization

1.2 WHEN a user enables or disables a payment method and refreshes the page THEN the payment method toggle states revert to default values (all enabled) instead of reflecting the previously saved state

1.3 WHEN the backend receives a PUT request to `/api/settings/:outletId` with `paymentMethods` as a JSON string value THEN the system may fail to correctly store the setting due to double-serialization, type mismatch, or incorrect key naming

### Expected Behavior (Correct)

2.1 WHEN a user toggles a payment method checkbox and the system sends a PUT request with `{ settings: { paymentMethods: JSON.stringify({...}) } }` THEN the system SHALL correctly upsert a setting row with key='paymentMethods', type='json', and value containing the serialized JSON object

2.2 WHEN a user refreshes the Payment Methods settings page THEN the system SHALL retrieve the `paymentMethods` setting from the database, parse it from JSON string to object, and correctly populate each payment method's toggle state

2.3 WHEN the backend receives `paymentMethods` as a JSON string in the settings object THEN the system SHALL recognize it as type='json' and store it correctly in the `settings` table without double-encoding

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the POS terminal requests available payment methods via the settings API THEN the system SHALL CONTINUE TO return the `paymentMethods` object in parsed form for the POS to display active payment options

3.2 WHEN payment method settings are saved THEN the system SHALL CONTINUE TO log the activity in `activity_logs` with entity_type='settings' and a description of the changed keys

3.3 WHEN other settings (General Settings, Receipt Settings) are saved simultaneously with Payment Methods THEN the system SHALL CONTINUE TO persist all settings independently without conflicts

3.4 WHEN the `payment_methods` table is used for storing payment method master data (name, type, icon, status, display_order) THEN the system SHALL CONTINUE TO support CRUD operations on that table independently from the `paymentMethods` setting preference
