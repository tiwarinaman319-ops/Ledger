document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // SUB-TAB NAVIGATION
  // =========================================================================
  const tabBtns = document.querySelectorAll(".calc-tab-btn");
  const tabPanels = {
    budget: document.getElementById("calcPanelBudget"),
    compound: document.getElementById("calcPanelCompound"),
    emergency: document.getElementById("calcPanelEmergency"),
    keypad: document.getElementById("calcPanelKeypad"),
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabKey = btn.dataset.calcTab;
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      Object.entries(tabPanels).forEach(([key, panel]) => {
        if (!panel) return;
        if (key === tabKey) {
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      });

      if (tabKey === "compound") updateCompoundSim();
      if (tabKey === "emergency") updateRunwayCalc();
    });
  });

  // =========================================================================
  // QUICK MATH KEYPAD
  // =========================================================================
  const display = document.getElementById("calcDisplay");
  const subDisplay = document.getElementById("calcSubDisplay");
  const grid = document.getElementById("calcGrid");

  let expr = "";

  function safeEval(str) {
    if (!/^[0-9+\-*/().\s%]*$/.test(str)) return null;
    try {
      const sanitized = str.replace(/([0-9.]+)%/g, "($1/100)");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized || 0})`)();
      return Number.isFinite(result) ? result : null;
    } catch {
      return null;
    }
  }

  function handleKey(key) {
    if (key === "C" || key === "Escape") {
      expr = "";
      if (subDisplay) subDisplay.textContent = "";
    } else if (key === "DEL" || key === "Backspace") {
      expr = expr.slice(0, -1);
    } else if (key === "=" || key === "Enter") {
      if (subDisplay) subDisplay.textContent = expr + " =";
      const result = safeEval(expr);
      expr = result === null ? "" : String(Math.round(result * 10000) / 10000);
    } else if (["+", "-", "*", "/", "%", "(", ")"].includes(key) || /^[0-9.]$/.test(key)) {
      expr += key;
    }
    if (display) display.textContent = expr || "0";
  }

  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const key = btn.dataset.key;
      if (key) handleKey(key);
    });
  }

  window.addEventListener("keydown", (e) => {
    const calcSec = document.getElementById("section-calculator");
    if (!calcSec || calcSec.classList.contains("hidden")) return;
    const keypadPanel = document.getElementById("calcPanelKeypad");
    if (!keypadPanel || keypadPanel.classList.contains("hidden")) return;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

    if (/^[0-9+\-*/().]$/.test(e.key) || ["Enter", "Backspace", "Escape", "="].includes(e.key)) {
      e.preventDefault();
      handleKey(e.key);
    }
  });

  // =========================================================================
  // 50/30/20 BUDGET SPLIT & COMPARISON
  // =========================================================================
  const budgetIncome = document.getElementById("budgetIncome");
  const needsEl = document.getElementById("budgetNeeds");
  const wantsEl = document.getElementById("budgetWants");
  const saveEl = document.getElementById("budgetSave");

  const actualNeedsEl = document.getElementById("actualNeeds");
  const actualWantsEl = document.getElementById("actualWants");
  const actualSaveEl = document.getElementById("actualSave");

  function updateBudget() {
    const income = Number(budgetIncome ? budgetIncome.value : 0) || 0;
    if (needsEl) needsEl.textContent = fmtMoney(income * 0.5, { isDirect: true });
    if (wantsEl) wantsEl.textContent = fmtMoney(income * 0.3, { isDirect: true });
    if (saveEl) saveEl.textContent = fmtMoney(income * 0.2, { isDirect: true });

    if (typeof getData === "function" && currentUserEmail()) {
      const d = getData();
      const expenses = d.expenses || [];
      const needsCats = new Set(["cat_food", "cat_bills", "cat_transport", "cat_health"]);

      let actualNeeds = 0;
      let actualWants = 0;
      expenses.forEach((e) => {
        const amt = Number(e.amount || 0);
        if (needsCats.has(e.category)) actualNeeds += amt;
        else actualWants += amt;
      });

      const userIncomeUSD = Number(d.income) || (typeof convertToBase === "function" ? convertToBase(income) : income);
      const actualSave = Math.max(0, userIncomeUSD - (actualNeeds + actualWants));

      if (actualNeedsEl) actualNeedsEl.textContent = fmtMoney(actualNeeds);
      if (actualWantsEl) actualWantsEl.textContent = fmtMoney(actualWants);
      if (actualSaveEl) actualSaveEl.textContent = fmtMoney(actualSave);
    }
  }

  if (budgetIncome) {
    budgetIncome.addEventListener("input", updateBudget);
  }

  function syncBudgetCalcPrefill() {
    if (typeof getData === "function" && currentUserEmail() && budgetIncome) {
      const d = getData();
      if (d.income) {
        const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD" };
        const converted = typeof convertFromBase === "function" ? convertFromBase(d.income) : d.income;
        budgetIncome.value = cur.code === "JPY" ? Math.round(converted) : Number(converted.toFixed(2));
        updateBudget();
      }
    }
  }

  // =========================================================================
  // COMPOUND WEALTH & GROWTH SIMULATOR
  // =========================================================================
  const simPrincipal = document.getElementById("simPrincipal");
  const simMonthly = document.getElementById("simMonthly");
  const simReturnRate = document.getElementById("simReturnRate");
  const simReturnRateLabel = document.getElementById("simReturnRateLabel");
  const simYears = document.getElementById("simYears");
  const simYearsLabel = document.getElementById("simYearsLabel");
  const compoundForexToggle = document.getElementById("compoundForexAdjustToggle");

  const simTotalInvested = document.getElementById("simTotalInvested");
  const simTotalReturns = document.getElementById("simTotalReturns");
  const simReturnsPct = document.getElementById("simReturnsPct");
  const simFinalWealth = document.getElementById("simFinalWealth");
  const simFinalSub = document.getElementById("simFinalSub");

  const simPrincipalPct = document.getElementById("simPrincipalPct");
  const simReturnsRatioPct = document.getElementById("simReturnsRatioPct");
  const simRatioPrincipalBar = document.getElementById("simRatioPrincipalBar");
  const simRatioReturnsBar = document.getElementById("simRatioReturnsBar");

  function updateCompoundSim() {
    if (!simPrincipal) return;

    const P = Math.max(0, Number(simPrincipal.value) || 0);
    const PMT = Math.max(0, Number(simMonthly.value) || 0);
    const r = Math.max(0.1, Number(simReturnRate.value) || 8) / 100;
    const t = Math.max(1, Number(simYears.value) || 10);
    const isForexAdjusted = compoundForexToggle ? compoundForexToggle.checked : false;

    if (simReturnRateLabel) simReturnRateLabel.textContent = `${(r * 100).toFixed(1)}%`;
    if (simYearsLabel) simYearsLabel.textContent = `${t} Year${t > 1 ? "s" : ""}`;

    const n = t * 12;
    const i = r / 12;

    const factor = Math.pow(1 + i, n);
    let nominalFV = (P * factor) + (PMT * ((factor - 1) / i));

    let finalFV = nominalFV;
    if (isForexAdjusted) {
      finalFV = nominalFV / Math.pow(1 + 0.03, t);
    }

    const totalInvested = P + (PMT * n);
    const totalReturns = Math.max(0, finalFV - totalInvested);
    const gainMultiplier = totalInvested > 0 ? Math.round((totalReturns / totalInvested) * 100) : 0;

    const pRatio = finalFV > 0 ? Math.round((totalInvested / finalFV) * 100) : 50;
    const rRatio = Math.max(0, 100 - pRatio);

    if (simTotalInvested) simTotalInvested.textContent = fmtMoney(totalInvested, { isDirect: true });
    if (simTotalReturns) simTotalReturns.textContent = fmtMoney(totalReturns, { isDirect: true });
    if (simReturnsPct) simReturnsPct.textContent = `+${gainMultiplier}% wealth multiplier`;
    if (simFinalWealth) simFinalWealth.textContent = fmtMoney(finalFV, { isDirect: true });

    if (simFinalSub) {
      simFinalSub.textContent = isForexAdjusted
        ? `Real purchasing power (-3%/yr macro forex buffer)`
        : `Nominal portfolio value after ${t} years`;
    }

    if (simPrincipalPct) simPrincipalPct.textContent = `${pRatio}%`;
    if (simReturnsRatioPct) simReturnsRatioPct.textContent = `${rRatio}%`;
    if (simRatioPrincipalBar) simRatioPrincipalBar.style.width = `${pRatio}%`;
    if (simRatioReturnsBar) simRatioReturnsBar.style.width = `${rRatio}%`;
  }

  [simPrincipal, simMonthly, simReturnRate, simYears].forEach((el) => {
    if (el) el.addEventListener("input", updateCompoundSim);
  });
  if (compoundForexToggle) {
    compoundForexToggle.addEventListener("change", updateCompoundSim);
  }

  // =========================================================================
  // EMERGENCY FUND SURVIVAL RUNWAY CALCULATOR
  // =========================================================================
  const runwayLiquidCash = document.getElementById("runwayLiquidCash");
  const runwayMonthlyBurn = document.getElementById("runwayMonthlyBurn");
  const runwayMonthsDisplay = document.getElementById("runwayMonthsDisplay");
  const runwayStatusBadge = document.getElementById("runwayStatusBadge");
  const runwayOptimalTarget = document.getElementById("runwayOptimalTarget");
  const runwayGapDisplay = document.getElementById("runwayGapDisplay");

  const tier3MoVal = document.getElementById("tier3MoVal");
  const tier6MoVal = document.getElementById("tier6MoVal");
  const tier12MoVal = document.getElementById("tier12MoVal");

  function prefillRunwayDefaults() {
    if (typeof getData === "function" && currentUserEmail()) {
      const d = getData();
      const now = new Date();
      const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthExpenses = (d.expenses || []).filter((e) => (e.date || "").startsWith(curMonthKey));
      const totalExpUSD = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      const convBurn = typeof convertFromBase === "function" ? convertFromBase(totalExpUSD) : totalExpUSD;
      const defaultBurn = convBurn > 0 ? Math.round(convBurn) : 2500;

      if (runwayMonthlyBurn && !runwayMonthlyBurn.value) {
        runwayMonthlyBurn.value = defaultBurn;
      }

      const goalsSavedUSD = (d.goals || []).reduce((s, g) => s + Number(g.saved || 0), 0);
      const convSaved = typeof convertFromBase === "function" ? convertFromBase(goalsSavedUSD) : goalsSavedUSD;
      const defaultCash = convSaved > 0 ? Math.round(convSaved) : defaultBurn * 4;

      if (runwayLiquidCash && !runwayLiquidCash.value) {
        runwayLiquidCash.value = defaultCash;
      }

      updateRunwayCalc();
    }
  }

  function updateRunwayCalc() {
    if (!runwayLiquidCash || !runwayMonthlyBurn) return;

    const cash = Math.max(0, Number(runwayLiquidCash.value) || 0);
    const burn = Math.max(1, Number(runwayMonthlyBurn.value) || 1);

    const runwayMonths = cash / burn;
    const optimal6Mo = burn * 6;
    const gap = optimal6Mo - cash;

    if (runwayMonthsDisplay) {
      runwayMonthsDisplay.textContent = `${runwayMonths.toFixed(1)} Months`;
    }

    if (runwayStatusBadge) {
      if (runwayMonths >= 6) {
        runwayStatusBadge.textContent = "🛡️ Bulletproof Reserve (6+ Mos)";
        runwayStatusBadge.className = "runway-status-badge badge-healthy";
      } else if (runwayMonths >= 3) {
        runwayStatusBadge.textContent = "🟡 Moderate Cushion (3–6 Mos)";
        runwayStatusBadge.className = "runway-status-badge badge-moderate";
      } else {
        runwayStatusBadge.textContent = "🚨 Vulnerable (< 3 Mos)";
        runwayStatusBadge.className = "runway-status-badge badge-danger";
      }
    }

    if (runwayOptimalTarget) {
      runwayOptimalTarget.textContent = fmtMoney(optimal6Mo, { isDirect: true });
    }

    if (runwayGapDisplay) {
      if (gap <= 0) {
        runwayGapDisplay.textContent = `✅ Target fully covered (+${fmtMoney(Math.abs(gap), { isDirect: true })} surplus)`;
        runwayGapDisplay.style.color = "var(--emerald)";
      } else {
        runwayGapDisplay.textContent = `Shortfall: ${fmtMoney(gap, { isDirect: true })} needed to reach 6-month buffer`;
        runwayGapDisplay.style.color = "var(--rose)";
      }
    }

    if (tier3MoVal) tier3MoVal.textContent = fmtMoney(burn * 3, { isDirect: true });
    if (tier6MoVal) tier6MoVal.textContent = fmtMoney(burn * 6, { isDirect: true });
    if (tier12MoVal) tier12MoVal.textContent = fmtMoney(burn * 12, { isDirect: true });
  }

  if (runwayLiquidCash) runwayLiquidCash.addEventListener("input", updateRunwayCalc);
  if (runwayMonthlyBurn) runwayMonthlyBurn.addEventListener("input", updateRunwayCalc);

  // Sync on currency change
  const oldOnCurr = window.onCurrencyChange;
  window.onCurrencyChange = () => {
    if (oldOnCurr) oldOnCurr();
    syncBudgetCalcPrefill();
    updateCompoundSim();
    prefillRunwayDefaults();
  };

  // Init
  syncBudgetCalcPrefill();
  updateCompoundSim();
  prefillRunwayDefaults();

  window.syncBudgetCalcPrefill = syncBudgetCalcPrefill;
  window.updateCompoundSim = updateCompoundSim;
  window.updateRunwayCalc = updateRunwayCalc;
});
