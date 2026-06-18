# Ownership Matrix

## Overview
A matrix mapping every core entity to its owning Service, defining read/write consumers and highlighting ownership risks.

| Entity | Owner Service | Read Consumers | Write Consumers | Risk |
|--------|---------------|----------------|-----------------|------|
| **Products** | `ProductService` | POS, Reports, Dashboard | `ProductService` only | **LOW** |
| **Product Cost** | *Ambiguous* | Reports (`FinancialCalculationService`) | `ProductService`, Cost Module | **HIGH** |
| **Orders** | `OrderService` | Financial Reports, Dashboard, KDS | `OrderService` only | **LOW** |
| **Kitchen Queue**| `OrderService` | KDS | `OrderService` only | **LOW** |
| **Members** | `MemberService` | POS | CRM Module, (Missing from `OrderService`) | **MODERATE** |
| **Points** | `MemberService` | CRM Dashboard | `MemberService` only | **LOW** |
| **Recipes** | *None (costs.ts)* | *None* | `costs.ts` only | **HIGH** |
| **Ingredients**| *None (costs.ts)* | *None* | `costs.ts` only | **HIGH** |
| **Shifts** | *None (shifts.ts)* | POS, Reports | `shifts.ts` only | **MODERATE** |
| **Settings** | `SettingsService` | `OrderService` | `SettingsService` only | **LOW** |

## Key Findings
1. **Ambiguous Ownership**: Product Cost is heavily contested. Reporting relies on `products.cost`, while R&D calculates exact costs in `cost_recipes.hpp_total`.
2. **Missing Services**: The entire Cost Calculation module (`costs.ts`) lacks a bounded Service Layer entirely, leaving it isolated as a direct-DB controller.
