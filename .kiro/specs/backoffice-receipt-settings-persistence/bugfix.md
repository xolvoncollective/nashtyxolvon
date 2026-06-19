# Bugfix Requirements Document

## Introduction

The Receipt Settings page in the Backoffice module (POS — Pengaturan Struk) fails to persist thermal receipt configuration values to the database. When users configure receipt information (restaurant name, city, phone, address, footer message, number of copies, and QR code toggles), these values are not retained in the database, causing receipts to display default or incorrect information.

This prevents outlet administrators from customizing customer-facing receipts, potentially damaging brand consistency and customer communication.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user enters receipt information fields (receiptName, receiptCity, receiptPhone, receiptAddress, receiptFooter, receiptCopies) and clicks "Simpan" THEN the system displays a success toast but the settings are not persisted to the database

1.2 WHEN a user toggles QR code features (receiptLoyalty, receiptReview, receiptWa) and saves THEN the boolean values are not correctly stored or retrieved from the database

1.3 WHEN a user saves Receipt Settings and refreshes the page THEN the form fields revert to default values instead of showing the previously saved configuration

1.4 WHEN the backend receives a PUT request to `/api/settings/:outletId` with receipt settings containing multiline text (address, footer) THEN the system may fail to correctly preserve newline characters or escape sequences during storage

### Expected Behavior (Correct)

2.1 WHEN a user enters receipt information fields and clicks "Simpan" THEN the system SHALL persist all nine receipt settings (receiptName, receiptCity, receiptPhone, receiptAddress, receiptFooter, receiptCopies, receiptLoyalty, receiptReview, receiptWa) as individual rows in the `settings` table

2.2 WHEN a user toggles QR code features THEN the system SHALL store boolean values with type='boolean' and correctly serialize them as 'true' or 'false' strings in the database

2.3 WHEN a user saves Receipt Settings containing multiline text fields THEN the system SHALL preserve newline characters (\\n) and special characters in the database value field without corruption

2.4 WHEN a user refreshes the Receipt Settings page THEN the system SHALL retrieve all saved settings from the database, parse boolean types correctly, and populate the form fields with previously saved values

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the POS terminal generates a receipt THEN the system SHALL CONTINUE TO fetch receipt settings from the database and apply them to the thermal printer output

3.2 WHEN receipt settings with receipt prefix keys (receipt_*) are saved alongside other settings THEN the system SHALL CONTINUE TO route them correctly to `saveReceiptSettings()` function based on key prefix matching

3.3 WHEN a user saves any settings category THEN the system SHALL CONTINUE TO trigger a page reload using `PAGES['pos-receipt']().then(h=>document.getElementById('page-area').innerHTML=h)` to reflect changes

3.4 WHEN the SettingsService resolves settings THEN the system SHALL CONTINUE TO correctly parse boolean types from string values ('true' -> true, 'false' -> false)
