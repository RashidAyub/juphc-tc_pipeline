/**
 * Jasmine Unit Tests for Tax Calculator
 * Contains exactly 7 meaningful test specifications
 */

const { calculateTax, getStandardDeduction, STANDARD_DEDUCTIONS } = require('../taxCalculator');

describe('Tax Calculator Unit Tests', () => {

  // Test 1: Zero or below-zero income
  it('1. should return zero tax liability and zero taxable income when gross income is zero or negative', () => {
    const resultZero = calculateTax(0, 'single');
    expect(resultZero.totalTax).toBe(0);
    expect(resultZero.taxableIncome).toBe(0);
    expect(resultZero.effectiveTaxRate).toBe(0);

    const resultNegative = calculateTax(-5000, 'single');
    expect(resultNegative.totalTax).toBe(0);
    expect(resultNegative.taxableIncome).toBe(0);
  });

  // Test 2: Standard deduction application
  it('2. should automatically apply standard deduction when no custom deduction is specified', () => {
    const grossIncome = 50000;
    const result = calculateTax(grossIncome, 'single');

    expect(result.deduction).toBe(STANDARD_DEDUCTIONS.single); // $14,600
    expect(result.taxableIncome).toBe(50000 - 14600); // $35,400
  });

  // Test 3: First bracket (10%) calculation
  it('3. should calculate correct tax liability for income within the first tax bracket (10%)', () => {
    // Gross income of $24,600 with $14,600 standard deduction yields $10,000 taxable income
    const grossIncome = 24600;
    const result = calculateTax(grossIncome, 'single');

    expect(result.taxableIncome).toBe(10000);
    expect(result.totalTax).toBe(1000); // 10% of $10,000
    expect(result.marginalRate).toBe(10);
  });

  // Test 4: Progressive tax computation across multiple brackets (10%, 12%, 22%)
  it('4. should calculate progressive tax across multiple tax brackets correctly', () => {
    // Gross income of $74,600 with $14,600 deduction yields $60,000 taxable income
    // Tier 1: 10% of $11,600 = $1,160
    // Tier 2: 12% of ($47,150 - $11,600 = $35,550) = $4,266
    // Tier 3: 22% of ($60,000 - $47,150 = $12,850) = $2,827
    // Total Tax = $1,160 + $4,266 + $2,827 = $8,253
    const grossIncome = 74600;
    const result = calculateTax(grossIncome, 'single');

    expect(result.taxableIncome).toBe(60000);
    expect(result.totalTax).toBe(8253);
    expect(result.marginalRate).toBe(22);
    expect(result.breakdown.length).toBe(3);
  });

  // Test 5: Married Filing Jointly status with expanded bracket thresholds
  it('5. should apply married filing jointly deduction and expanded bracket thresholds', () => {
    // Gross income $100,000 with married standard deduction of $29,200 yields $70,800 taxable
    // Married Tier 1: 10% of $23,200 = $2,320
    // Married Tier 2: 12% of ($70,800 - $23,200 = $47,600) = $5,712
    // Total Tax = $2,320 + $5,712 = $8,032
    const grossIncome = 100000;
    const result = calculateTax(grossIncome, 'married');

    expect(result.deduction).toBe(29200);
    expect(result.taxableIncome).toBe(70800);
    expect(result.totalTax).toBe(8032);
  });

  // Test 6: Effective tax rate and net take-home pay
  it('6. should accurately compute the effective tax rate percentage and net take-home pay', () => {
    // Gross income $50,000, Single
    // Taxable: $35,400 -> Tax: 10% of 11,600 ($1,160) + 12% of 23,800 ($2,856) = $4,016
    // Effective Rate: (4,016 / 50,000) * 100 = 8.03%
    // Net Income: $50,000 - $4,016 = $45,984
    const grossIncome = 50000;
    const result = calculateTax(grossIncome, 'single');

    expect(result.totalTax).toBe(4016);
    expect(result.effectiveTaxRate).toBe(8.03);
    expect(result.netIncome).toBe(45984);
  });

  // Test 7: Input validation and error handling
  it('7. should throw descriptive errors for invalid non-numeric inputs or negative deductions', () => {
    expect(() => calculateTax('fifty-thousand')).toThrowError(/valid number/);
    expect(() => calculateTax(NaN)).toThrowError(/valid number/);
    expect(() => calculateTax(50000, 'single', -100)).toThrowError(/non-negative/);
  });

});
