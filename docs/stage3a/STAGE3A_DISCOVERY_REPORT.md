# STAGE 3A — DISCOVERY REPORT

## Executive Summary
Stage 3A successfully mapped the data ownership and integration dependencies across the entire NashtyLite ecosystem. While the Service Layer consolidation executed in Stage 2 provided excellent internal stability, this discovery phase revealed that cross-domain boundaries remain highly siloed. The CRM and Cost Calculation modules operate in a vacuum, completely disconnected from the core POS heartbeat. 

We have identified exactly *who* owns the data, *who* consumes it, and *where* synchronization fails. The system is fundamentally stable, but significant manual intervention is currently required to maintain operational parity.

---

## 1. Integration Inventory Summary
The POS and Backoffice Reporting modules communicate effectively. However, integration stops at the checkout boundary:
- **Missing Integration:** Orders -> CRM Points.
- **Missing Integration:** Orders -> Cost (Raw Material Inventory).
- **Missing Integration:** Recipes -> Products (Pricing).

## 2. Ownership Matrix Summary
We successfully assigned primary owners to core entities.
- `OrderService` cleanly owns transactions.
- `SettingsService` cleanly owns configuration.
- `MemberService` cleanly owns loyalty.
- **Risk Area:** Product Cost is ambiguously split between the direct-DB Cost Calculation module and the POS `ProductService`.

## 3. Source Of Truth Summary
We verified that while reporting metrics safely pull from a single source (`orders`), the system suffers from split-brain data when handling product definitions. 
- `cost_recipes.harga_jual` and `products.price` are completely distinct values representing the exact same business concept.
- `cost_recipes.hpp_total` and `products.cost` are similarly distinct.

## 4. Data Flow Summary
The core Order Creation flow is mapped and proven robust for its immediate bounds. However, we identified that critical downstream hooks (Point Generation, Ingredient Depletion) are entirely absent from the transactional event loop.

## 5. Synchronization Gap Summary
We documented 4 critical gaps requiring resolution before full system automation is achieved:
1. Recipe costs do not sync to Product POS costs.
2. Selling items does not deduct raw ingredients.
3. Checking out does not award CRM points.
4. Voiding orders does not reverse stock or points.

## 6. Data Silo Summary
- **Silo 1:** CRM Module (Isolated API).
- **Silo 2:** Cost Calculation Module (Isolated direct-DB controller).
Both domains hold valuable data that is ignored by the POS engine.

## 7. Integration Candidate Summary
We proposed 4 integration tasks to bridge the ecosystem:
1. Automated CRM Point Generation on Checkout.
2. Recipe Promotion Sync to POS Products.
3. Order Void Reversals (Stock/Points).
4. Raw Material Depletion on Checkout.

## 8. Risk Matrix Summary
Integrations have been ranked by safety and value. We recommend executing Point Generation and Recipe Promotion first, as they are low-complexity, low-risk, and yield immediate operational value. Raw Material Depletion involves heavy cross-table relational mapping and should be deferred until the easier paths are stabilized.

---

## Conclusion

Ownership is proven. The silos are identified. The integration candidates are ranked.

**READY_FOR_STAGE_3B**
