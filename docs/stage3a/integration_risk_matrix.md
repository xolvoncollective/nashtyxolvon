# Integration Risk Matrix

## Overview
A prioritized evaluation of integration candidates, ranking them by impact, complexity, and safety.

| Proposed Integration | Business Impact | Tech Complexity | Regression Risk | Priority / Recommended Order |
|----------------------|-----------------|-----------------|-----------------|------------------------------|
| **1. Automated Points** | HIGH (UX) | LOW | LOW | **Priority 1** (Easiest win, isolated CRM scope) |
| **2. Recipe Promotion** | CRITICAL (Margin) | LOW | LOW | **Priority 2** (Solves dangerous split-brain pricing) |
| **3. Void Reversals** | HIGH (Data Integ.) | MEDIUM | MEDIUM | **Priority 3** (Plugs stock/point drift holes) |
| **4. Raw Material Depletion** | CRITICAL (COGS) | HIGH | HIGH | **Priority 4** (Requires bridging Orders to Recipes to Ingredients. Do last.) |

## Risk Mitigation Strategy
All integrations MUST be routed through the Service Layer. For example, `OrderService` must never execute raw `UPDATE cost_bahan`. It must call `CostService.deductIngredients()`. This prevents integration spaghetti and respects the boundaries established in Stage 2.
