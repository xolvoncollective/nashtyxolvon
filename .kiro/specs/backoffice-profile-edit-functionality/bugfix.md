# Bugfix Requirements Document

## Introduction

The profile edit functionality in the Backoffice module has implementation issues that prevent users from successfully updating their profile information. When users click the profile avatar button and attempt to edit their name, email, or PIN, the changes either fail to persist or encounter errors during the update process.

This prevents users from maintaining accurate profile information and updating their security credentials (PIN), impacting system usability and security management.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the profile avatar button in the topbar and selects "Edit Profile" THEN the profile modal may fail to display or display with missing/incorrect user data

1.2 WHEN a user enters new values for name, email, or PIN in the profile edit form and clicks "Simpan Perubahan" THEN the PUT request to `/api/users/:id` may fail due to authorization issues, missing session data, or incorrect payload structure

1.3 WHEN the profile update succeeds on the backend but the frontend session state is not updated THEN the user sees stale information in the topbar avatar or profile dropdown until a full page reload

1.4 WHEN a user updates only their PIN without changing name or email THEN the system may incorrectly reject the update or fail to hash the PIN properly before storage

### Expected Behavior (Correct)

2.1 WHEN a user clicks the profile avatar button and selects "Edit Profile" THEN the system SHALL display a profile edit modal pre-populated with the current user's name, email, and an empty PIN field

2.2 WHEN a user updates their name, email, and/or PIN and clicks "Simpan Perubahan" THEN the system SHALL send a PUT request to `/api/users/:id` with the updated fields and successfully persist the changes to the database

2.3 WHEN the profile update succeeds THEN the system SHALL update the frontend session state (API.session.user), refresh the topbar avatar initials to reflect the new name, and display a success toast message

2.4 WHEN a user updates only their PIN (leaving name and email unchanged) THEN the system SHALL accept the partial update, hash the new PIN with bcrypt, and update only the `pin` field in the database

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an owner or manager edits another user's profile from the team management pages (Owners, Managers, Kasir) THEN the system SHALL CONTINUE TO support full profile editing including role and outlet assignment

3.2 WHEN a cashier or non-privileged user attempts to edit another user's profile THEN the system SHALL CONTINUE TO enforce the authorization check and return 403 Forbidden

3.3 WHEN a user updates their profile THEN the system SHALL CONTINUE TO NOT log this action in activity_logs (profile updates are considered private user actions)

3.4 WHEN the profile dropdown is clicked THEN the system SHALL CONTINUE TO display "Edit Profile" and "Logout" options with correct onclick handlers
