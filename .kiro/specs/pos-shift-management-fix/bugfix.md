# Bugfix Requirements Document

## Introduction

The POS system currently lacks a proper shift management workflow, creating critical gaps in cash reconciliation and audit trails. The system displays "saldo petty cash" without implementing the underlying shift opening/closing functionality. This prevents cashiers from properly tracking cash balances, makes reconciliation impossible, and eliminates accountability for cash handling during shifts. Multiple cashiers working different shifts cannot properly manage their individual cash responsibilities, leading to potential discrepancies and audit failures.

This bugfix introduces a complete shift management workflow where users must open shifts with starting petty cash balances, track all transactions during the shift, and close shifts with ending balances and automatic reconciliation reporting.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a cashier starts the POS application THEN the system allows taking orders immediately without requiring shift opening

1.2 WHEN the system displays "saldo petty cash" THEN it shows a value without any underlying shift management workflow or tracking mechanism

1.3 WHEN a cashier processes transactions THEN the system does not associate those transactions with any shift session

1.4 WHEN a cashier needs to reconcile cash at end of day THEN the system provides no shift closing workflow or reconciliation interface

1.5 WHEN a cashier closes their shift THEN the system does not generate a shift report showing transactions, cash collected, or discrepancies

1.6 WHEN a shift is closed THEN the shift report does not automatically refresh to show the final reconciliation

1.7 WHEN multiple cashiers work different shifts THEN the system does not track which transactions belong to which cashier's shift

1.8 WHEN viewing petty cash balance THEN there is no record of starting balance, ending balance, or cash flow during the shift

### Expected Behavior (Correct)

2.1 WHEN a cashier starts the POS application without an open shift THEN the system SHALL require the user to open a shift before allowing any order processing

2.2 WHEN opening a shift THEN the system SHALL prompt the cashier to input the starting petty cash balance and record this with timestamp and user ID

2.3 WHEN a cashier processes transactions during an open shift THEN the system SHALL associate all orders with the current shift session for that cashier

2.4 WHEN a cashier needs to close their shift THEN the system SHALL provide a shift closing workflow that prompts for ending petty cash balance

2.5 WHEN closing a shift with ending balance input THEN the system SHALL calculate expected vs actual cash, identify discrepancies, and generate a comprehensive shift report

2.6 WHEN a shift report is generated after closing THEN the system SHALL automatically refresh the report display to show final reconciliation data

2.7 WHEN multiple cashiers work different shifts THEN the system SHALL maintain separate shift sessions per user, tracking each cashier's transactions independently

2.8 WHEN viewing shift reports THEN the system SHALL display: starting petty cash, ending petty cash, total transactions, total cash collected, expected cash, actual cash, and any discrepancies

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a cashier processes an order during an open shift THEN the system SHALL CONTINUE TO process orders with the same transaction flow, payment methods, and receipt generation

3.2 WHEN transaction data is recorded THEN the system SHALL CONTINUE TO store all existing transaction fields (amount, items, payment method, timestamp) in the database

3.3 WHEN shift reports are viewed THEN the system SHALL CONTINUE TO use the existing SQLite database structure for querying transaction history

3.4 WHEN multiple users access the system THEN the system SHALL CONTINUE TO maintain user authentication and authorization as currently implemented

3.5 WHEN the backend processes API requests THEN the system SHALL CONTINUE TO use the existing TypeScript/Express architecture

3.6 WHEN the frontend displays UI elements THEN the system SHALL CONTINUE TO use the existing vanilla JavaScript rendering patterns

3.7 WHEN cash payment transactions are recorded THEN the system SHALL CONTINUE TO track payment amounts and methods as currently implemented

3.8 WHEN viewing historical transactions outside of shift context THEN the system SHALL CONTINUE TO display all transaction data as currently available
