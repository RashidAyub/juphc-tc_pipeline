/**
 * Progressive Tax Calculator
 * Supports Single, Married Filing Jointly, and Head of Household
 * Standard Deductions (2024-2025 Federal tax reference)
 */

const STANDARD_DEDUCTIONS = {
  single: 14600,
  married: 29200,
  head_of_household: 21900
};

const TAX_BRACKETS = {
  single: [
    { rate: 0.10, min: 0, max: 11600 },
    { rate: 0.12, min: 11600, max: 47150 },
    { rate: 0.22, min: 47150, max: 100525 },
    { rate: 0.24, min: 100525, max: 191950 },
    { rate: 0.32, min: 191950, max: 243725 },
    { rate: 0.35, min: 243725, max: 609350 },
    { rate: 0.37, min: 609350, max: Infinity }
  ],
  married: [
    { rate: 0.10, min: 0, max: 23200 },
    { rate: 0.12, min: 23200, max: 94300 },
    { rate: 0.22, min: 94300, max: 201050 },
    { rate: 0.24, min: 201050, max: 383900 },
    { rate: 0.32, min: 383900, max: 487450 },
    { rate: 0.35, min: 487450, max: 731200 },
    { rate: 0.37, min: 731200, max: Infinity }
  ],
  head_of_household: [
    { rate: 0.10, min: 0, max: 16550 },
    { rate: 0.12, min: 16550, max: 63100 },
    { rate: 0.22, min: 63100, max: 100500 },
    { rate: 0.24, min: 100500, max: 191950 },
    { rate: 0.32, min: 191950, max: 243700 },
    { rate: 0.35, min: 243700, max: 609350 },
    { rate: 0.37, min: 609350, max: Infinity }
  ]
};

/**
 * Returns the standard deduction for a given filing status
 * @param {string} filingStatus - 'single' | 'married' | 'head_of_household'
 * @returns {number} Standard deduction amount
 */
function getStandardDeduction(filingStatus = 'single') {
  const normalized = (filingStatus || 'single').toLowerCase();
  return STANDARD_DEDUCTIONS[normalized] !== undefined ? STANDARD_DEDUCTIONS[normalized] : STANDARD_DEDUCTIONS.single;
}

/**
 * Calculates progressive income tax breakdown
 * @param {number} grossIncome - Total annual gross income
 * @param {string} filingStatus - Filing status ('single', 'married', 'head_of_household')
 * @param {number|null} customDeduction - Optional custom deduction; defaults to standard deduction
 * @returns {object} Detailed calculation result
 */
function calculateTax(grossIncome, filingStatus = 'single', customDeduction = null) {
  if (typeof grossIncome !== 'number' || isNaN(grossIncome)) {
    throw new Error('Invalid gross income: gross income must be a valid number');
  }

  const normalizedStatus = (filingStatus || 'single').toLowerCase();
  const brackets = TAX_BRACKETS[normalizedStatus] || TAX_BRACKETS.single;

  const deduction = customDeduction !== null && customDeduction !== undefined
    ? Number(customDeduction)
    : getStandardDeduction(normalizedStatus);

  if (isNaN(deduction) || deduction < 0) {
    throw new Error('Invalid deduction: deduction must be a non-negative number');
  }

  // Handle zero or negative gross income
  if (grossIncome <= 0) {
    return {
      grossIncome: grossIncome,
      deduction: deduction,
      taxableIncome: 0,
      totalTax: 0,
      effectiveTaxRate: 0,
      netIncome: grossIncome < 0 ? grossIncome : 0,
      marginalRate: 0,
      breakdown: []
    };
  }

  const taxableIncome = Math.max(0, grossIncome - deduction);

  let remainingTaxable = taxableIncome;
  let totalTax = 0;
  let marginalRate = 0;
  const breakdown = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const bracketSpan = bracket.max - bracket.min;

    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome - bracket.min, bracketSpan);
      const taxForBracket = Math.round((taxableInBracket * bracket.rate) * 100) / 100;
      totalTax += taxForBracket;
      marginalRate = bracket.rate * 100;

      breakdown.push({
        bracketNumber: i + 1,
        ratePercent: bracket.rate * 100,
        min: bracket.min,
        max: bracket.max,
        taxableAmount: Math.round(taxableInBracket * 100) / 100,
        taxAmount: taxForBracket
      });
    }
  }

  totalTax = Math.round(totalTax * 100) / 100;
  const effectiveTaxRate = grossIncome > 0 ? Math.round((totalTax / grossIncome) * 10000) / 100 : 0;
  const netIncome = Math.round((grossIncome - totalTax) * 100) / 100;

  return {
    grossIncome: Math.round(grossIncome * 100) / 100,
    deduction: Math.round(deduction * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    totalTax: totalTax,
    effectiveTaxRate: effectiveTaxRate,
    netIncome: netIncome,
    marginalRate: marginalRate,
    breakdown: breakdown
  };
}

// Support Node.js testing environment and browser script loading
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateTax,
    getStandardDeduction,
    STANDARD_DEDUCTIONS,
    TAX_BRACKETS
  };
} else if (typeof window !== 'undefined') {
  window.TaxCalculator = {
    calculateTax,
    getStandardDeduction,
    STANDARD_DEDUCTIONS,
    TAX_BRACKETS
  };
}
