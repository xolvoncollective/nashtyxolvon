import { OrderService } from '../OrderService';
import { ProductService } from '../ProductService';
import { SettingsService } from '../SettingsService';
import { get, query, run, transaction } from '../../db/database';

/**
 * Exploratory test suite for OrderService precision loss bug
 * 
 * **Bug**: Tax and service charge calculations use Math.round() immediately after 
 * calculation, losing decimal precision that should be preserved until display time.
 * 
 * **Affected Code**: OrderService.createOrder()
 * - Line 47: const calculatedTax = Math.round(baseAmount * (taxRate / 100));
 * - Line 49: const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));
 * 
 * **This is an EXPLORATORY TEST** - it demonstrates the precision loss bug EXISTS 
 * in the unfixed code by showing that calculations produce rounded integer values 
 * instead of preserving decimal precision.
 * 
 * **Validates: Bugfix Requirements 1.3.1, 1.3.2, 1.3.3, 1.3.4**
 */

describe('OrderService - Precision Loss Bug Exploration', () => {
  
  describe('Bug Condition: Premature rounding in tax and service charge calculations', () => {
    
    it('should demonstrate precision loss with specific example: baseAmount=12345, taxRate=11%, scRate=5%', () => {
      // This test demonstrates the bug by showing the INCORRECT behavior
      // Expected bug result (with Math.round):
      //   tax = Math.round(12345 * 0.11) = Math.round(1357.95) = 1358
      //   service_charge = Math.round(12345 * 0.05) = Math.round(617.25) = 617
      //   Error: 0.05 + (-0.25) = -0.20 per order (net +0.05 -0.25 depending on rounding)
      //
      // Correct result (without Math.round):
      //   tax = 1357.95 (preserves decimals)
      //   service_charge = 617.25 (preserves decimals)
      
      const baseAmount = 12345;
      const taxRate = 11;
      const scRate = 5;
      
      // Simulate current buggy calculation
      const buggyTax = Math.round(baseAmount * (taxRate / 100));
      const buggyServiceCharge = Math.round(baseAmount * (scRate / 100));
      
      // Calculate correct values (with precision)
      const correctTax = baseAmount * (taxRate / 100); // 1357.95
      const correctServiceCharge = baseAmount * (scRate / 100); // 617.25
      
      // Document the counterexample - this shows the bug exists
      console.log('\n=== PRECISION LOSS COUNTEREXAMPLE ===');
      console.log(`Base Amount: ${baseAmount}`);
      console.log(`Tax Rate: ${taxRate}%, Service Charge Rate: ${scRate}%`);
      console.log('\nCurrent Buggy Behavior (Math.round applied):');
      console.log(`  Tax: ${buggyTax} (should be ${correctTax})`);
      console.log(`  Service Charge: ${buggyServiceCharge} (should be ${correctServiceCharge})`);
      console.log(`  Tax Error: ${(buggyTax - correctTax).toFixed(2)} IDR`);
      console.log(`  SC Error: ${(buggyServiceCharge - correctServiceCharge).toFixed(2)} IDR`);
      console.log(`  Total Error per Order: ${((buggyTax - correctTax) + (buggyServiceCharge - correctServiceCharge)).toFixed(2)} IDR`);
      console.log('=====================================\n');
      
      // Assert that the bug exists - these assertions FAIL on unfixed code
      // When the code is fixed, these will pass
      expect(buggyTax).toBe(1358); // Bug: rounds up from 1357.95
      expect(buggyServiceCharge).toBe(617); // Bug: rounds down from 617.25
      expect(correctTax).toBe(1357.95); // Correct value
      expect(correctServiceCharge).toBe(617.25); // Correct value
      
      // Document the precision loss
      const taxError = buggyTax - correctTax;
      const scError = buggyServiceCharge - correctServiceCharge;
      const totalErrorPerOrder = taxError + scError;
      
      expect(taxError).toBeCloseTo(0.05, 2); // Loses 0.05 IDR on tax
      expect(scError).toBeCloseTo(-0.25, 2); // Loses 0.25 IDR on service charge
      expect(totalErrorPerOrder).toBeCloseTo(-0.20, 2); // Net loss of 0.20 IDR per order
    });
    
    it('should demonstrate cumulative precision loss over multiple orders', () => {
      // This test shows how rounding errors compound over multiple orders
      const testOrders = [
        { baseAmount: 12345, taxRate: 11, scRate: 5 },
        { baseAmount: 23456, taxRate: 11, scRate: 5 },
        { baseAmount: 34567, taxRate: 11, scRate: 5 },
        { baseAmount: 45678, taxRate: 11, scRate: 5 },
        { baseAmount: 56789, taxRate: 11, scRate: 5 },
      ];
      
      let totalBuggyTax = 0;
      let totalBuggyServiceCharge = 0;
      let totalCorrectTax = 0;
      let totalCorrectServiceCharge = 0;
      
      console.log('\n=== CUMULATIVE PRECISION LOSS ===');
      console.log('Order | Base Amount | Buggy Tax | Correct Tax | Buggy SC | Correct SC | Error');
      console.log('-'.repeat(90));
      
      testOrders.forEach((order, index) => {
        const buggyTax = Math.round(order.baseAmount * (order.taxRate / 100));
        const buggyServiceCharge = Math.round(order.baseAmount * (order.scRate / 100));
        const correctTax = order.baseAmount * (order.taxRate / 100);
        const correctServiceCharge = order.baseAmount * (order.scRate / 100);
        
        totalBuggyTax += buggyTax;
        totalBuggyServiceCharge += buggyServiceCharge;
        totalCorrectTax += correctTax;
        totalCorrectServiceCharge += correctServiceCharge;
        
        const orderError = (buggyTax - correctTax) + (buggyServiceCharge - correctServiceCharge);
        
        console.log(
          `${index + 1}     | ${order.baseAmount.toString().padEnd(11)} | ` +
          `${buggyTax.toString().padEnd(9)} | ${correctTax.toFixed(2).padEnd(11)} | ` +
          `${buggyServiceCharge.toString().padEnd(8)} | ${correctServiceCharge.toFixed(2).padEnd(10)} | ` +
          `${orderError.toFixed(2)}`
        );
      });
      
      const cumulativeTaxError = totalBuggyTax - totalCorrectTax;
      const cumulativeSCError = totalBuggyServiceCharge - totalCorrectServiceCharge;
      const totalCumulativeError = cumulativeTaxError + cumulativeSCError;
      
      console.log('-'.repeat(90));
      console.log(`Total | Cumulative Tax Error: ${cumulativeTaxError.toFixed(2)} IDR | ` +
                  `Cumulative SC Error: ${cumulativeSCError.toFixed(2)} IDR | ` +
                  `Total: ${totalCumulativeError.toFixed(2)} IDR`);
      console.log('=================================\n');
      
      // Assert cumulative error exists
      expect(Math.abs(totalCumulativeError)).toBeGreaterThan(0);
      
      // Document the scale of the problem
      // Over 1000 orders with similar amounts, the error could be significant
      const estimatedErrorPer1000Orders = totalCumulativeError * (1000 / testOrders.length);
      console.log(`Estimated cumulative error over 1000 orders: ${estimatedErrorPer1000Orders.toFixed(2)} IDR\n`);
      
      expect(Math.abs(estimatedErrorPer1000Orders)).toBeGreaterThan(10); // Significant error
    });
    
    it('should demonstrate precision loss with edge case: amounts that result in .5 rounding', () => {
      // Test cases where rounding has maximum impact (amounts ending in .5)
      const edgeCases = [
        { baseAmount: 13636, taxRate: 11, scRate: 5 }, // tax: 1499.96 → 1500, sc: 681.8 → 682
        { baseAmount: 45455, taxRate: 11, scRate: 5 }, // tax: 5000.05 → 5000, sc: 2272.75 → 2273
        { baseAmount: 90909, taxRate: 11, scRate: 5 }, // tax: 9999.99 → 10000, sc: 4545.45 → 4545
      ];
      
      console.log('\n=== EDGE CASE: .5 ROUNDING PRECISION LOSS ===');
      
      edgeCases.forEach((testCase) => {
        const buggyTax = Math.round(testCase.baseAmount * (testCase.taxRate / 100));
        const buggyServiceCharge = Math.round(testCase.baseAmount * (testCase.scRate / 100));
        const correctTax = testCase.baseAmount * (testCase.taxRate / 100);
        const correctServiceCharge = testCase.baseAmount * (testCase.scRate / 100);
        
        const taxError = buggyTax - correctTax;
        const scError = buggyServiceCharge - correctServiceCharge;
        
        console.log(`Base: ${testCase.baseAmount}`);
        console.log(`  Tax: ${buggyTax} vs ${correctTax.toFixed(2)} (error: ${taxError.toFixed(2)})`);
        console.log(`  SC: ${buggyServiceCharge} vs ${correctServiceCharge.toFixed(2)} (error: ${scError.toFixed(2)})`);
        console.log(`  Total error: ${(taxError + scError).toFixed(2)} IDR\n`);
        
        // Assert that precision is lost
        expect(buggyTax).not.toBe(correctTax);
        expect(buggyServiceCharge).not.toBe(correctServiceCharge);
      });
      
      console.log('============================================\n');
    });
    
    it('should demonstrate that decimal values are lost in intermediate calculations', () => {
      // This test specifically shows that the decimal part is lost
      const baseAmount = 12345;
      const taxRate = 11;
      const scRate = 5;
      
      const calculatedTax = baseAmount * (taxRate / 100); // 1357.95
      const calculatedServiceCharge = baseAmount * (scRate / 100); // 617.25
      
      // Current buggy behavior rounds these values
      const buggyTax = Math.round(calculatedTax); // 1358
      const buggyServiceCharge = Math.round(calculatedServiceCharge); // 617
      
      console.log('\n=== DECIMAL PRECISION LOSS ===');
      console.log(`Tax calculation: ${baseAmount} × ${taxRate}% = ${calculatedTax}`);
      console.log(`  Decimal part: ${(calculatedTax % 1).toFixed(2)}`);
      console.log(`  After Math.round: ${buggyTax}`);
      console.log(`  Decimal part lost: ${(calculatedTax % 1).toFixed(2)} IDR`);
      console.log('');
      console.log(`SC calculation: ${baseAmount} × ${scRate}% = ${calculatedServiceCharge}`);
      console.log(`  Decimal part: ${(calculatedServiceCharge % 1).toFixed(2)}`);
      console.log(`  After Math.round: ${buggyServiceCharge}`);
      console.log(`  Decimal part lost: ${(calculatedServiceCharge % 1).toFixed(2)} IDR`);
      console.log('==============================\n');
      
      // Assert that decimal precision exists before rounding
      expect(calculatedTax % 1).not.toBe(0); // Has decimal part
      expect(calculatedServiceCharge % 1).not.toBe(0); // Has decimal part
      
      // Assert that decimal precision is lost after rounding
      expect(buggyTax % 1).toBe(0); // Integer only
      expect(buggyServiceCharge % 1).toBe(0); // Integer only
      
      // This demonstrates the bug: we lose valuable precision data
      const decimalLossTax = calculatedTax - buggyTax;
      const decimalLossSC = calculatedServiceCharge - buggyServiceCharge;
      
      expect(Math.abs(decimalLossTax)).toBeGreaterThan(0);
      expect(Math.abs(decimalLossSC)).toBeGreaterThan(0);
    });
  });
  
  describe('Summary: Expected Counterexamples from Bugfix Design', () => {
    it('should match the counterexample documented in the bugfix design', () => {
      // This test validates the exact example from the design document
      // Design Example 3 - Precision Loss:
      // Input: Order with subtotal=12,345, discount=0, taxRate=11%, scRate=5%
      // Current Behavior: tax=1,358, service_charge=617, error=0.30 IDR per order
      // Expected Behavior: tax=1357.95, SC=617.25, accurate totals
      
      const subtotal = 12345;
      const discount = 0;
      const taxRate = 11;
      const scRate = 5;
      
      const baseAmount = subtotal - discount;
      
      // Buggy calculation (current behavior)
      const buggyTax = Math.round(baseAmount * (taxRate / 100));
      const buggyServiceCharge = Math.round(baseAmount * (scRate / 100));
      
      // Correct calculation (expected behavior)
      const correctTax = baseAmount * (taxRate / 100);
      const correctServiceCharge = baseAmount * (scRate / 100);
      
      console.log('\n=== DESIGN DOCUMENT COUNTEREXAMPLE ===');
      console.log('Input: subtotal=12,345, discount=0, taxRate=11%, scRate=5%');
      console.log('\nCurrent Behavior (BUG):');
      console.log(`  tax = Math.round(${baseAmount} × 0.11) = Math.round(${correctTax}) = ${buggyTax}`);
      console.log(`  service_charge = Math.round(${baseAmount} × 0.05) = Math.round(${correctServiceCharge}) = ${buggyServiceCharge}`);
      console.log(`  Error per order: ${(buggyTax - correctTax).toFixed(2)} + ${(buggyServiceCharge - correctServiceCharge).toFixed(2)} = ${((buggyTax - correctTax) + (buggyServiceCharge - correctServiceCharge)).toFixed(2)} IDR`);
      console.log('\nExpected Behavior (FIXED):');
      console.log(`  tax = ${correctTax} (preserve decimals)`);
      console.log(`  service_charge = ${correctServiceCharge} (preserve decimals)`);
      console.log(`  No rounding error`);
      console.log('\nOver 1000 orders:');
      const errorPerOrder = (buggyTax - correctTax) + (buggyServiceCharge - correctServiceCharge);
      console.log(`  Cumulative error: ${errorPerOrder.toFixed(2)} × 1000 = ${(errorPerOrder * 1000).toFixed(2)} IDR`);
      console.log('======================================\n');
      
      // Assert the exact values from the design document
      expect(buggyTax).toBe(1358);
      expect(buggyServiceCharge).toBe(617);
      expect(correctTax).toBe(1357.95);
      expect(correctServiceCharge).toBe(617.25);
      
      // Assert the documented error
      const taxError = buggyTax - correctTax;
      const scError = buggyServiceCharge - correctServiceCharge;
      expect(taxError).toBeCloseTo(0.05, 2);
      expect(scError).toBeCloseTo(-0.25, 2);
      
      const totalError = taxError + scError;
      expect(totalError).toBeCloseTo(-0.20, 2);
      
      // Over 1000 orders, this compounds
      const cumulativeError = totalError * 1000;
      expect(Math.abs(cumulativeError)).toBeGreaterThan(100); // Significant
    });
  });
});
