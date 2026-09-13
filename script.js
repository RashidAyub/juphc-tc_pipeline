/**
 * SmartTax Web Application Controller
 * Handles user interactions, form inputs, dynamic bracket rendering, and live calculations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const grossIncomeInput = document.getElementById('gross-income');
  const filingStatusSelect = document.getElementById('filing-status');
  const modeStandardRadio = document.getElementById('mode-standard');
  const modeCustomRadio = document.getElementById('mode-custom');
  const customDeductionInput = document.getElementById('custom-deduction');
  const customDeductionGroup = document.getElementById('custom-deduction-group');
  const standardDeductionPreview = document.getElementById('standard-deduction-preview');
  const toggleLblStandard = document.getElementById('toggle-lbl-standard');
  const toggleLblCustom = document.getElementById('toggle-lbl-custom');
  const errorBanner = document.getElementById('error-banner');

  // Buttons & Controls
  const btnCalculate = document.getElementById('btn-calculate');
  const btnReset = document.getElementById('btn-reset');
  const btnCopySummary = document.getElementById('btn-copy-summary');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Metric Display Elements
  const metricTotalTax = document.getElementById('metric-total-tax');
  const metricEffectiveRate = document.getElementById('metric-effective-rate');
  const metricNetIncome = document.getElementById('metric-net-income');
  const metricMarginalRate = document.getElementById('metric-marginal-rate');

  const payMonthly = document.getElementById('pay-monthly');
  const payBiweekly = document.getElementById('pay-biweekly');
  const payWeekly = document.getElementById('pay-weekly');

  const summaryGross = document.getElementById('summary-gross');
  const summaryDeduction = document.getElementById('summary-deduction');
  const summaryTaxable = document.getElementById('summary-taxable');
  const bracketsTbody = document.getElementById('brackets-tbody');

  // Currency Formatter
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  const currencyWithCents = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /**
   * Updates standard deduction preview based on current filing status
   */
  function updateStandardDeductionDisplay() {
    const status = filingStatusSelect.value;
    const stdAmount = TaxCalculator.getStandardDeduction(status);
    standardDeductionPreview.textContent = currencyFormatter.format(stdAmount);
  }

  /**
   * Performs the calculation and renders all output components
   */
  function performCalculation() {
    hideError();

    const rawIncome = grossIncomeInput.value.trim();
    if (rawIncome === '') {
      showError('Please enter an annual gross income.');
      return;
    }

    const grossIncome = parseFloat(rawIncome);
    if (isNaN(grossIncome) || grossIncome < 0) {
      showError('Gross income must be a valid non-negative number.');
      return;
    }

    const filingStatus = filingStatusSelect.value;
    const isCustomDeduction = modeCustomRadio.checked;

    let customDeduction = null;
    if (isCustomDeduction) {
      const rawCustom = customDeductionInput.value.trim();
      customDeduction = rawCustom === '' ? 0 : parseFloat(rawCustom);
      if (isNaN(customDeduction) || customDeduction < 0) {
        showError('Itemized deduction must be a non-negative number.');
        return;
      }
    }

    try {
      const result = TaxCalculator.calculateTax(grossIncome, filingStatus, customDeduction);
      renderResults(result, filingStatus);
    } catch (err) {
      showError(err.message || 'An error occurred during calculation.');
    }
  }

  /**
   * Renders metric cards, paycheck frequency, and progressive bracket table
   */
  function renderResults(result, filingStatus) {
    // Metric Highlights
    metricTotalTax.textContent = currencyFormatter.format(result.totalTax);
    metricEffectiveRate.textContent = `${result.effectiveTaxRate.toFixed(2)}%`;
    metricNetIncome.textContent = currencyFormatter.format(result.netIncome);
    metricMarginalRate.textContent = `${result.marginalRate}%`;

    // Paycheck Frequencies
    payMonthly.textContent = currencyFormatter.format(result.netIncome / 12);
    payBiweekly.textContent = currencyFormatter.format(result.netIncome / 26);
    payWeekly.textContent = currencyFormatter.format(result.netIncome / 52);

    // Summary Details
    summaryGross.textContent = currencyFormatter.format(result.grossIncome);
    summaryDeduction.textContent = `-${currencyFormatter.format(result.deduction)}`;
    summaryTaxable.textContent = currencyFormatter.format(result.taxableIncome);

    // Progressive Bracket Table
    const allBrackets = TaxCalculator.TAX_BRACKETS[filingStatus] || TaxCalculator.TAX_BRACKETS.single;
    bracketsTbody.innerHTML = '';

    allBrackets.forEach((bracket, index) => {
      const tr = document.createElement('tr');
      const tierTax = result.breakdown.find(b => b.bracketNumber === (index + 1));
      const isApplied = !!tierTax;

      if (isApplied) {
        tr.classList.add('active-tier');
      }

      const minLabel = currencyFormatter.format(bracket.min);
      const maxLabel = bracket.max === Infinity ? 'and above' : currencyFormatter.format(bracket.max);
      const rateLabel = `${(bracket.rate * 100).toFixed(0)}%`;
      const taxableLabel = isApplied ? currencyFormatter.format(tierTax.taxableAmount) : '$0';
      const taxAmountLabel = isApplied ? currencyWithCents.format(tierTax.taxAmount) : '$0.00';

      tr.innerHTML = `
        <td><span class="tier-badge">${rateLabel}</span> Tier ${index + 1}</td>
        <td>${minLabel} – ${maxLabel}</td>
        <td>${taxableLabel}</td>
        <td class="text-right">${taxAmountLabel}</td>
      `;

      bracketsTbody.appendChild(tr);
    });
  }

  function showError(msg) {
    errorBanner.textContent = msg;
    errorBanner.style.display = 'block';
  }

  function hideError() {
    errorBanner.textContent = '';
    errorBanner.style.display = 'none';
  }

  // Deduction toggle handler
  function handleDeductionToggle() {
    if (modeCustomRadio.checked) {
      customDeductionGroup.style.display = 'block';
      toggleLblCustom.classList.add('active');
      toggleLblStandard.classList.remove('active');
    } else {
      customDeductionGroup.style.display = 'none';
      toggleLblStandard.classList.add('active');
      toggleLblCustom.classList.remove('active');
    }
    performCalculation();
  }

  // Event Listeners
  grossIncomeInput.addEventListener('input', performCalculation);
  customDeductionInput.addEventListener('input', performCalculation);

  filingStatusSelect.addEventListener('change', () => {
    updateStandardDeductionDisplay();
    performCalculation();
  });

  modeStandardRadio.addEventListener('change', handleDeductionToggle);
  modeCustomRadio.addEventListener('change', handleDeductionToggle);
  btnCalculate.addEventListener('click', performCalculation);

  // Preset Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      grossIncomeInput.value = chip.dataset.income;
      filingStatusSelect.value = chip.dataset.status;
      modeStandardRadio.checked = true;
      handleDeductionToggle();
      updateStandardDeductionDisplay();
      performCalculation();
    });
  });

  // Reset Handler
  btnReset.addEventListener('click', () => {
    grossIncomeInput.value = '85000';
    filingStatusSelect.value = 'single';
    modeStandardRadio.checked = true;
    customDeductionInput.value = '0';

    presetChips.forEach(c => c.classList.remove('active'));
    presetChips[1].classList.add('active'); // $85k

    handleDeductionToggle();
    updateStandardDeductionDisplay();
    performCalculation();
  });

  // Copy Summary to Clipboard
  btnCopySummary.addEventListener('click', async () => {
    const summaryText = `--- SmartTax Federal Tax Estimate ---
Gross Income:       ${summaryGross.textContent}
Filing Status:      ${filingStatusSelect.options[filingStatusSelect.selectedIndex].text}
Deduction:          ${summaryDeduction.textContent}
Taxable Income:     ${summaryTaxable.textContent}
Total Federal Tax:  ${metricTotalTax.textContent}
Effective Tax Rate: ${metricEffectiveRate.textContent}
Take-Home Pay:      ${metricNetIncome.textContent}
Monthly Paycheck:   ${payMonthly.textContent}
Bi-Weekly Paycheck: ${payBiweekly.textContent}
-------------------------------------`;

    try {
      await navigator.clipboard.writeText(summaryText);
      const originalText = btnCopySummary.innerHTML;
      btnCopySummary.innerHTML = `<span>Copied!</span>`;
      setTimeout(() => {
        btnCopySummary.innerHTML = originalText;
      }, 1800);
    } catch {
      alert(summaryText);
    }
  });

  // Initial Boot
  updateStandardDeductionDisplay();
  performCalculation();
});
