const CATEGORIES = [
  "cat_family", "cat_parents", "cat_family_support", "cat_household", "cat_rent", "cat_groceries_bills",
  "cat_food", "cat_bills", "cat_transport", "cat_entertainment",
  "cat_clothing", "cat_shoes", "cat_stationery", "cat_health",
  "cat_shopping", "cat_education", "cat_travel", "cat_investments", "cat_other",
];

const FAMILY_CATEGORIES = [
  "cat_family",
  "cat_parents",
  "cat_family_support",
  "cat_household",
  "cat_rent",
  "cat_groceries_bills",
];

const INCOME_CATEGORIES = [
  "inc_salary",
  "inc_freelance",
  "inc_business",
  "inc_investments",
  "inc_other",
];

// Dashboard Timeframe State
let dashSelectedTimeframe = "month";
let dashCustomStart = "";
let dashCustomEnd = "";

// Expenses Section Filter & Sort State
let expenseFilterQuery = "";
let expenseFilterCat = "all";
let expenseFilterTime = "month";
let expenseCustomStart = "";
let expenseCustomEnd = "";
let expenseSortOrder = "newest";

function currentUserEmail() {
  return localStorage.getItem("ledger_session");
}

function dataKey() {
  return `ledger_data_${currentUserEmail()}`;
}

function getDefaultSubscriptions() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  const d3 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21);
  const d4 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);

  return [
    {
      id: "sub_1",
      name: "Netflix Premium 4K",
      amount: 15.99,
      cycle: "monthly",
      category: "cat_entertainment",
      renewalDate: `${d1.getFullYear()}-${pad(d1.getMonth() + 1)}-${pad(d1.getDate())}`,
      active: true,
    },
    {
      id: "sub_2",
      name: "Spotify Duo Family",
      amount: 12.99,
      cycle: "monthly",
      category: "cat_entertainment",
      renewalDate: `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}`,
      active: true,
    },
    {
      id: "sub_3",
      name: "Equinox / Gym Pass",
      amount: 45.0,
      cycle: "monthly",
      category: "cat_health",
      renewalDate: `${d3.getFullYear()}-${pad(d3.getMonth() + 1)}-${pad(d3.getDate())}`,
      active: true,
    },
    {
      id: "sub_4",
      name: "Cloud Server & Hosting",
      amount: 24.0,
      cycle: "monthly",
      category: "cat_bills",
      renewalDate: `${d4.getFullYear()}-${pad(d4.getMonth() + 1)}-${pad(d4.getDate())}`,
      active: true,
    },
  ];
}

const sampleReceiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480" fill="%230f172a"><rect width="360" height="480" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="180" y="48" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">WHOLE FOODS MARKET</text><text x="180" y="72" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">Store %2310492 · Organic Groceries</text><line x1="28" y1="92" x2="332" y2="92" stroke="%23475569" stroke-dasharray="4"/><text x="32" y="130" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Organic Avocados (x4)</text><text x="328" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$8.99</text><text x="32" y="165" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Wild Alaskan Salmon 1lb</text><text x="328" y="165" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$18.50</text><text x="32" y="200" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Artisan Sourdough Loaf</text><text x="328" y="200" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$6.25</text><text x="32" y="235" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Organic Cold Pressed Juice</text><text x="328" y="235" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$8.50</text><line x1="28" y1="270" x2="332" y2="270" stroke="%23475569"/><text x="32" y="305" font-family="sans-serif" font-size="14" fill="%2394a3b8">Subtotal</text><text x="328" y="305" font-family="sans-serif" font-size="14" fill="%23cbd5e1" text-anchor="end">$42.24</text><text x="32" y="335" font-family="sans-serif" font-size="14" fill="%2394a3b8">Tax (8.25%)</text><text x="328" y="335" font-family="sans-serif" font-size="14" fill="%23cbd5e1" text-anchor="end">$3.48</text><line x1="28" y1="360" x2="332" y2="360" stroke="%2310b981" stroke-width="2"/><text x="32" y="395" font-family="sans-serif" font-size="18" font-weight="bold" fill="%2310b981">TOTAL PAID</text><text x="328" y="395" font-family="sans-serif" font-size="20" font-weight="bold" fill="%2310b981" text-anchor="end">$45.72</text><text x="180" y="445" font-family="sans-serif" font-size="11" fill="%2364748b" text-anchor="middle">Apple Pay · Visa ending 8812 · Verified</text></svg>`;

function getData() {
  try {
    const raw = localStorage.getItem(dataKey());
    if (!raw) return { income: 0, openingBalance: 0, incomes: [], expenses: [], goals: [], subscriptions: getDefaultSubscriptions() };
    const parsed = JSON.parse(raw);
    let subs = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : null;
    if (!subs) {
      subs = getDefaultSubscriptions();
    }
    const expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
    if (expenses.length > 0 && !expenses.some((e) => e.receipt)) {
      expenses[0].receipt = sampleReceiptSvg;
    }
    const incomes = Array.isArray(parsed.incomes) ? parsed.incomes : [];
    return {
      income: parsed.income || 0,
      openingBalance: Number(parsed.openingBalance) || 0,
      incomes,
      expenses,
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      subscriptions: subs,
    };
  } catch {
    return { income: 0, openingBalance: 0, incomes: [], expenses: [], goals: [], subscriptions: getDefaultSubscriptions() };
  }
}

function saveData(data) {
  localStorage.setItem(dataKey(), JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function monthKey(dateStr) {
  return (dateStr || "").slice(0, 7); // YYYY-MM
}

function thisMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function categoryEmoji(cat) {
  const map = {
    cat_family: "🏡",
    cat_parents: "👨‍👩‍👧",
    cat_family_support: "🤝",
    cat_household: "🏠",
    cat_rent: "🏢",
    cat_groceries_bills: "🛒",
    cat_food: "🍔",
    cat_bills: "💡",
    cat_transport: "🚌",
    cat_entertainment: "🎬",
    cat_clothing: "👕",
    cat_shoes: "👟",
    cat_stationery: "✏️",
    cat_health: "🩺",
    cat_shopping: "🛍️",
    cat_education: "📚",
    cat_travel: "✈️",
    cat_investments: "📈",
    cat_other: "💳",
  };
  return map[cat] || "🏷️";
}

function paymentMethodBadge(method) {
  const map = {
    pay_card: { label: "Card", icon: "💳" },
    pay_cash: { label: "Cash", icon: "💵" },
    pay_online: { label: "UPI / Online", icon: "⚡" },
    pay_bank: { label: "Bank Transfer", icon: "🏦" },
  };
  const m = map[method] || map.pay_card;
  return `<span class="pay-method-badge">${m.icon} ${m.label}</span>`;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ===================== NAVIGATION ===================== */
function switchSection(name, updateHash = true) {
  const validSections = ["dashboard", "expenses", "analysis", "savings", "calculator", "settings"];
  const secName = validSections.includes(name) ? name : "dashboard";

  document.querySelectorAll(".section").forEach((s) => s.classList.add("hidden"));
  const target = document.getElementById(`section-${secName}`);
  if (target) target.classList.remove("hidden");

  // Sync nav buttons
  document.querySelectorAll(".nav-btn, .sidebar-link").forEach((b) => {
    b.classList.toggle("active", b.dataset.section === secName);
  });

  if (updateHash && window.location.hash !== `#${secName}`) {
    history.replaceState(null, "", `#${secName}`);
  }

  if (secName === "analysis" && window.renderCharts) {
    window.renderCharts();
  }
  if (secName === "dashboard") {
    renderDashboard();
  }
  if (secName === "expenses") {
    renderExpensesSection();
  }
  if (secName === "savings") {
    renderGoals();
  }
  if (secName === "calculator" && typeof syncBudgetCalcPrefill === "function") {
    syncBudgetCalcPrefill();
  }

  // Scroll to top of content smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleHashNavigation() {
  const hash = (window.location.hash || "").replace("#", "").trim();
  if (hash) {
    switchSection(hash, false);
  }
}

/* ===================== FINANCIAL COMPUTATIONS & PERIODS ===================== */
function isDateInPeriod(dateStr, timeframe, customStart = "", customEnd = "") {
  if (!dateStr) return false;
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = `${curY}-${pad(curM + 1)}-${pad(now.getDate())}`;

  if (timeframe === "today") {
    return dateStr.slice(0, 10) === todayStr;
  }
  if (timeframe === "week") {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 for Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const mondayStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
    return dateStr >= mondayStr && dateStr <= sundayStr;
  }
  if (timeframe === "month") {
    const mStr = `${curY}-${pad(curM + 1)}`;
    return dateStr.startsWith(mStr);
  }
  if (timeframe === "last_month") {
    const lastM = curM === 0 ? 12 : curM;
    const lastY = curM === 0 ? curY - 1 : curY;
    const lmStr = `${lastY}-${pad(lastM)}`;
    return dateStr.startsWith(lmStr);
  }
  if (timeframe === "year") {
    return dateStr.startsWith(`${curY}-`);
  }
  if (timeframe === "custom") {
    if (customStart && dateStr < customStart) return false;
    if (customEnd && dateStr > customEnd) return false;
    return true;
  }
  return true; // 'all'
}

function computePeriodFinancials(data, timeframe = "month", customStart = "", customEnd = "") {
  const incomes = Array.isArray(data.incomes) ? data.incomes : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const openingBalance = typeof roundMoney === "function" ? roundMoney(Number(data.openingBalance) || 0, 2) : Number(data.openingBalance) || 0;

  // 1. Period Income
  const periodIncomes = incomes.filter(
    (inc) => inc.status !== "scheduled" && isDateInPeriod(inc.date, timeframe, customStart, customEnd)
  );

  let periodIncome = 0;
  if (periodIncomes.length > 0) {
    periodIncome = periodIncomes.reduce((s, inc) => s + Number(inc.amount || 0), 0);
  } else if (Number(data.income) > 0) {
    const baseIncome = Number(data.income);
    if (timeframe === "month" || timeframe === "last_month") {
      periodIncome = baseIncome;
    } else if (timeframe === "year") {
      periodIncome = baseIncome * 12;
    } else if (timeframe === "today") {
      periodIncome = baseIncome / 30;
    } else if (timeframe === "week") {
      periodIncome = (baseIncome / 30) * 7;
    } else {
      periodIncome = baseIncome;
    }
  }
  periodIncome = typeof roundMoney === "function" ? roundMoney(periodIncome, 2) : Math.round(periodIncome * 100) / 100;

  // 2. Period Expenses (Internal transfers do not count as expenses!)
  const periodExpensesList = expenses.filter(
    (e) => e.transactionType !== "transfer" && isDateInPeriod(e.date, timeframe, customStart, customEnd)
  );

  let periodExpenses = periodExpensesList.reduce((s, e) => s + Number(e.amount || 0), 0);
  periodExpenses = typeof roundMoney === "function" ? roundMoney(periodExpenses, 2) : Math.round(periodExpenses * 100) / 100;

  // 3. Category Breakdown
  const byCategory = {};
  periodExpensesList.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
  });
  for (const cat in byCategory) {
    byCategory[cat] = typeof roundMoney === "function" ? roundMoney(byCategory[cat], 2) : Math.round(byCategory[cat] * 100) / 100;
  }

  // 4. Family Contributions
  const familyExpenses = periodExpensesList.filter(
    (e) => e.transactionType === "family_contribution" || FAMILY_CATEGORIES.includes(e.category)
  );
  let familyContribution = familyExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  familyContribution = typeof roundMoney === "function" ? roundMoney(familyContribution, 2) : Math.round(familyContribution * 100) / 100;

  // 5. Net Surplus, Remaining, and Percentages
  const remainingBalance = typeof roundMoney === "function" ? roundMoney(periodIncome - periodExpenses, 2) : Math.round((periodIncome - periodExpenses) * 100) / 100;
  const periodSavings = Math.max(0, remainingBalance);
  const spendingPct = periodIncome > 0 ? (typeof roundMoney === "function" ? roundMoney((periodExpenses / periodIncome) * 100, 1) : Math.round((periodExpenses / periodIncome) * 100)) : 0;
  const familyContributionPct = periodIncome > 0 ? (typeof roundMoney === "function" ? roundMoney((familyContribution / periodIncome) * 100, 1) : Math.round((familyContribution / periodIncome) * 100)) : 0;

  // 6. All-Time Recorded Net Account Balance (Distinct from period balance!)
  const allTimeReceivedIncomes = incomes.filter((inc) => inc.status !== "scheduled");
  let allTimeIncome = 0;
  if (allTimeReceivedIncomes.length > 0) {
    allTimeIncome = allTimeReceivedIncomes.reduce((s, inc) => s + Number(inc.amount || 0), 0);
  } else {
    allTimeIncome = Number(data.income) || 0;
  }
  const allTimeExpenses = expenses
    .filter((e) => e.transactionType !== "transfer")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const netAccountBalance = typeof roundMoney === "function"
    ? roundMoney(openingBalance + allTimeIncome - allTimeExpenses, 2)
    : Math.round((openingBalance + allTimeIncome - allTimeExpenses) * 100) / 100;

  return {
    periodIncome,
    periodExpenses,
    periodSavings,
    remainingBalance,
    spendingPct,
    familyContribution,
    familyContributionPct,
    byCategory,
    periodExpensesList,
    openingBalance,
    netAccountBalance,
    allTimeIncome,
    allTimeExpenses,
  };
}

function computeTotals(data) {
  return computePeriodFinancials(data, dashSelectedTimeframe, dashCustomStart, dashCustomEnd);
}

/* ===================== CONFIRMATION DIALOG ===================== */
function showDeleteConfirmation(title, message, onConfirm) {
  const modal = document.getElementById("confirmDeleteModal");
  if (!modal) {
    if (confirm(message)) onConfirm();
    return;
  }
  const titleEl = document.getElementById("confirmDeleteTitle");
  const msgEl = document.getElementById("confirmDeleteMsg");
  const cancelBtn = document.getElementById("confirmDeleteCancelBtn");
  const confirmBtn = document.getElementById("confirmDeleteActionBtn");

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  modal.classList.remove("hidden");

  const cleanup = () => {
    modal.classList.add("hidden");
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  };

  cancelBtn.onclick = cleanup;
  confirmBtn.onclick = () => {
    cleanup();
    onConfirm();
  };
}

/* ===================== DASHBOARD ===================== */
function renderDashboard() {
  const data = getData();
  const fin = computePeriodFinancials(data, dashSelectedTimeframe, dashCustomStart, dashCustomEnd);

  // Timeframe Label
  const periodLabelMap = {
    today: t("filter_time_today") || "Today",
    week: t("filter_time_week") || "This Week",
    month: t("filter_time_month") || "This Month",
    last_month: t("filter_time_prev_month") || "Previous Month",
    year: t("filter_time_year") || "This Year",
    all: t("filter_time_all") || "All Time",
    custom: t("filter_time_custom") || "Custom Range",
  };
  const periodLabelEl = document.getElementById("dashPeriodLabel");
  if (periodLabelEl) {
    periodLabelEl.textContent = periodLabelMap[dashSelectedTimeframe] || "This Month";
  }

  // 1. Total Income
  const incomeEl = document.getElementById("dashIncome");
  if (incomeEl) incomeEl.textContent = fmtMoney(fin.periodIncome);

  // 2. Total Expenses
  const expEl = document.getElementById("dashExpenses");
  if (expEl) expEl.textContent = fmtMoney(fin.periodExpenses);

  // 3. Remaining Balance & Spending Pct
  const remEl = document.getElementById("dashRemaining");
  if (remEl) {
    remEl.textContent = fmtMoney(fin.remainingBalance);
    remEl.style.color = fin.remainingBalance >= 0 ? "var(--cyan)" : "var(--rose)";
  }
  const spendPctEl = document.getElementById("dashSpendingPct");
  if (spendPctEl) {
    spendPctEl.textContent = fin.periodIncome > 0 ? `${fin.spendingPct}%` : "—";
  }

  // 4. Recorded Net Account Balance (Distinct from Period Balance)
  const netEl = document.getElementById("dashRecordedNet");
  if (netEl) {
    netEl.textContent = fmtMoney(fin.netAccountBalance);
    netEl.style.color = fin.netAccountBalance >= 0 ? "var(--emerald)" : "var(--rose)";
  }
  const openBalSub = document.getElementById("dashOpeningBalanceSub");
  if (openBalSub) {
    openBalSub.textContent = `Opening Balance: ${fmtMoney(fin.openingBalance)}`;
  }

  // Savings Summary / Active Goals Target
  const savEl = document.getElementById("dashSavings");
  if (savEl) savEl.textContent = fmtMoney(fin.periodSavings);

  const goalTotalEl = document.getElementById("dashGoalTotal");
  if (goalTotalEl) {
    const goalsSaved = (data.goals || []).reduce((acc, g) => acc + Number(g.saved || 0), 0);
    const goalsTarget = (data.goals || []).reduce((acc, g) => acc + Number(g.target || 0), 0);
    goalTotalEl.textContent = `${fmtMoney(goalsSaved)} / ${fmtMoney(goalsTarget)}`;
  }

  // Family Contribution Highlight Banner
  const familyBanner = document.getElementById("dashFamilyBanner");
  const familyAmtEl = document.getElementById("dashFamilyAmt") || document.getElementById("dashFamilyContribAmt");
  const familyPctEl = document.getElementById("dashFamilyPct") || document.getElementById("dashFamilyContribPct");
  if (familyBanner) {
    if (fin.familyContribution > 0) {
      familyBanner.classList.remove("hidden");
      if (familyAmtEl) familyAmtEl.textContent = fmtMoney(fin.familyContribution);
      if (familyPctEl) {
        familyPctEl.textContent = fin.periodIncome > 0
          ? `${fin.familyContributionPct}% of period income · ${fin.periodExpenses > 0 ? Math.round((fin.familyContribution / fin.periodExpenses) * 100) : 0}% of expenses`
          : "Recorded family contribution";
      }
    } else {
      familyBanner.classList.add("hidden");
    }
  }

  // Salary & Expense Distribution Breakdown Table (Section 4)
  renderSalaryBreakdownTable(fin);

  // Monthly Budget Pace & Velocity Widget
  renderBudgetPace(data, fin.periodExpenses, fin.periodIncome);

  // Recommendations and Recent Transactions
  renderRecommendations(data, fin.periodExpenses, fin.periodSavings);
  if (typeof window.renderAICopilotCard === "function") {
    window.renderAICopilotCard();
  }
  renderRecent(data);

  // Sidebar Mini Summary
  renderSidebarWidget(data, fin.periodExpenses, fin.periodIncome);
}

function renderSalaryBreakdownTable(fin) {
  const tbody = document.getElementById("salaryBreakdownTableBody");
  const breakdownPill = document.getElementById("salaryBreakdownPill");
  if (breakdownPill) {
    breakdownPill.textContent = "Income: " + fmtMoney(fin.periodIncome);
  }
  if (!tbody) return;

  const { periodIncome, periodExpenses, remainingBalance, spendingPct, byCategory } = fin;
  const categoriesList = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  let rowsHtml = `
    <tr class="row-income">
      <td><strong>💼 Salary / Income Received</strong></td>
      <td><span class="cat-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald);">Income Source</span></td>
      <td style="text-align: right; font-weight: 800; color: var(--emerald);">+ ${fmtMoney(periodIncome)}</td>
      <td style="text-align: right; font-weight: 700; color: var(--emerald);">100%</td>
    </tr>
  `;

  if (categoriesList.length === 0) {
    rowsHtml += `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-dim); padding: 16px;">
          No expenses recorded in this period.
        </td>
      </tr>
    `;
  } else {
    categoriesList.forEach(([cat, amt]) => {
      const isFamily = FAMILY_CATEGORIES.includes(cat);
      const pctOfIncome = periodIncome > 0 ? (typeof roundMoney === "function" ? roundMoney((amt / periodIncome) * 100, 1) : Math.round((amt / periodIncome) * 100)) : 0;
      const badge = isFamily ? `<span style="font-size: 10.5px; padding: 2px 6px; border-radius: 4px; background: rgba(99, 102, 241, 0.2); color: var(--indigo); font-weight: 700; margin-left: 6px;">FAMILY</span>` : "";

      rowsHtml += `
        <tr class="${isFamily ? 'row-family' : ''}">
          <td><strong>${categoryEmoji(cat)} ${t(cat)}</strong></td>
          <td><span class="cat-badge">${t(cat)}</span> ${badge}</td>
          <td style="text-align: right; font-weight: 600;">${fmtMoney(amt)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--text-dim);">${pctOfIncome}%</td>
        </tr>
      `;
    });
  }

  const remainingPct = periodIncome > 0 ? (typeof roundMoney === "function" ? roundMoney((remainingBalance / periodIncome) * 100, 1) : Math.round((remainingBalance / periodIncome) * 100)) : 0;

  rowsHtml += `
    <tr class="row-total-exp">
      <td><strong>📉 Total Expenses</strong></td>
      <td><span class="cat-badge" style="background: rgba(244, 63, 94, 0.15); color: var(--rose);">All Spending</span></td>
      <td style="text-align: right; font-weight: 800; color: var(--rose);">- ${fmtMoney(periodExpenses)}</td>
      <td style="text-align: right; font-weight: 700; color: var(--rose);">${spendingPct}%</td>
    </tr>
    <tr class="row-remaining">
      <td><strong>🏦 Remaining Balance</strong></td>
      <td><span class="cat-badge" style="background: rgba(6, 182, 212, 0.15); color: var(--cyan);">Net Surplus</span></td>
      <td style="text-align: right; font-weight: 800; color: var(--cyan);">= ${fmtMoney(remainingBalance)}</td>
      <td style="text-align: right; font-weight: 800; color: var(--cyan);">${remainingPct}%</td>
    </tr>
  `;

  tbody.innerHTML = rowsHtml;
}

function renderBudgetPace(data, totalExpenses, periodIncome) {
  const paceBar = document.getElementById("budgetPaceFill");
  const paceText = document.getElementById("budgetPaceText");
  const paceRemaining = document.getElementById("budgetPaceRemaining");
  const paceDailySpeed = document.getElementById("budgetPaceDailySpeed");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth);

  const income = Number(periodIncome !== undefined ? periodIncome : data.income) || 0;

  if (!income) {
    if (paceBar) paceBar.style.width = "0%";
    if (paceText) paceText.textContent = "Set monthly income to track budget pace";
    if (paceRemaining) paceRemaining.textContent = "—";
    if (paceDailySpeed) paceDailySpeed.textContent = "—";
    return;
  }

  const pct = Math.min(100, Math.round((totalExpenses / income) * 100));
  if (paceBar) {
    paceBar.style.width = `${pct}%`;
    paceBar.className = "pace-bar-fill " + (pct > 90 ? "bg-rose" : pct > 75 ? "bg-amber" : "bg-emerald");
  }

  const remaining = Math.max(0, income - totalExpenses);
  const dailyAllowance = Math.round((remaining / daysLeft) * 100) / 100;

  if (paceText) paceText.textContent = `${pct}% spent of ${fmtMoney(income)}`;
  if (paceRemaining) paceRemaining.textContent = `${fmtMoney(remaining)} left (${daysLeft} days remaining)`;
  if (paceDailySpeed) paceDailySpeed.textContent = `Safe daily spend: ${fmtMoney(dailyAllowance)}/day`;
}

function renderSidebarWidget(data, totalExpenses, periodIncome) {
  const sideSpent = document.getElementById("sidebarMonthSpent");
  const sideIncome = document.getElementById("sidebarMonthIncome");
  const sideBar = document.getElementById("sidebarProgressBar");

  const income = Number(periodIncome !== undefined ? periodIncome : data.income) || 0;
  if (sideSpent) sideSpent.textContent = fmtMoney(totalExpenses);
  if (sideIncome) sideIncome.textContent = fmtMoney(income);

  if (sideBar) {
    const pct = income ? Math.min(100, Math.round((totalExpenses / income) * 100)) : 0;
    sideBar.style.width = `${pct}%`;
  }
}

function renderRecommendations(data, totalExpenses, savings) {
  const list = document.getElementById("recList");
  if (!list) return;

  const recs = [];
  const income = Number(data.income) || 0;

  if (!income || income <= 0) {
    recs.push({
      type: "amber",
      icon: "💡",
      text: t("rec_no_income"),
    });
  } else {
    if (totalExpenses > income) {
      recs.push({
        type: "rose",
        icon: "⚠️",
        text: t("rec_overspend", { amt: fmtMoney(totalExpenses - income) }),
      });
    } else {
      const pct = Math.round((savings / income) * 100);
      if (pct < 10) {
        recs.push({
          type: "amber",
          icon: "📉",
          text: t("rec_low_savings"),
        });
      } else {
        recs.push({
          type: "emerald",
          icon: "🚀",
          text: t("rec_good_savings", { pct }),
        });
      }
    }
  }

  // Top category this month
  const mKey = thisMonthKey();
  const monthExpenses = (data.expenses || []).filter((e) => monthKey(e.date) === mKey && e.transactionType !== "transfer");
  if (monthExpenses.length) {
    const byCat = {};
    monthExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
    });
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      recs.push({
        type: "indigo",
        icon: "🏷️",
        text: t("rec_high_category", { cat: t(top[0]), amt: fmtMoney(top[1]) }),
      });
    }
  }

  if (!data.goals || !data.goals.length) {
    recs.push({
      type: "indigo",
      icon: "🎯",
      text: t("rec_no_goal"),
    });
  } else {
    const goal = data.goals[0];
    const pct = Math.min(100, Math.round((goal.saved / (goal.target || 1)) * 100));
    recs.push({
      type: pct >= 100 ? "emerald" : "indigo",
      icon: pct >= 100 ? "🎉" : "🎯",
      text: t("rec_goal_progress", { pct, name: goal.name }),
    });
  }

  list.innerHTML = recs.map((r) => `
    <li class="rec-item rec-${r.type}">
      <span class="rec-icon">${r.icon}</span>
      <span class="rec-text">${r.text}</span>
    </li>
  `).join("");
}

function renderRecent(data) {
  const container = document.getElementById("dashRecentList");
  if (!container) return;

  const recent = [...(data.expenses || [])]
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
    .slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `<div class="list-empty"><p>${t("dash_no_recent")}</p></div>`;
    return;
  }
  container.innerHTML = recent.map((e) => entryRowHtml(e, false)).join("");

  // Bind receipt clicks in recent
  container.querySelectorAll("[data-view-receipt]").forEach((btn) => {
    btn.addEventListener("click", () => openReceiptLightbox(btn.dataset.viewReceipt));
  });
}

function entryRowHtml(e, deletable) {
  const payBadge = e.payMethod ? paymentMethodBadge(e.payMethod) : "";
  const notesText = e.notes ? `<span class="entry-notes">"${escapeHtml(e.notes)}"</span>` : "";
  const recipientBadge = e.recipient ? `<span style="font-size: 11px; padding: 2px 7px; border-radius: 4px; background: rgba(99, 102, 241, 0.15); color: var(--indigo); font-weight: 600;">To: ${escapeHtml(e.recipient)}</span>` : "";
  const isTransfer = e.transactionType === "transfer";
  const isFamily = e.transactionType === "family_contribution" || FAMILY_CATEGORIES.includes(e.category);
  const typeBadge = isTransfer
    ? `<span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(6, 182, 212, 0.15); color: var(--cyan); font-weight: 700;">TRANSFER</span>`
    : isFamily
    ? `<span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(99, 102, 241, 0.15); color: var(--indigo); font-weight: 700;">FAMILY</span>`
    : "";

  const receiptBtn = e.receipt
    ? `<button type="button" class="receipt-pill-btn" data-view-receipt="${e.id}" title="View Attached Receipt">📎 Receipt</button>`
    : "";

  return `
    <div class="entry-row" data-id="${e.id}">
      <div class="entry-left">
        <div class="entry-icon">${categoryEmoji(e.category)}</div>
        <div class="entry-info">
          <div class="entry-title">${escapeHtml(e.description)}</div>
          <div class="entry-sub">
            <span>${e.date}</span> · 
            <span class="cat-badge">${t(e.category)}</span>
            ${typeBadge}
            ${recipientBadge}
            ${payBadge}
            ${receiptBtn}
            ${notesText}
          </div>
        </div>
      </div>
      <div class="entry-right">
        <div class="entry-amt ${isTransfer ? 'transfer' : 'expense'}" style="${isTransfer ? 'color: var(--cyan);' : ''}">
          ${isTransfer ? '🔄 ' : '-'}${fmtMoney(e.amount)}
        </div>
        ${deletable ? `
          <div class="entry-actions">
            <button class="entry-btn-edit" data-edit-exp="${e.id}" title="${t('exp_edit_title')}">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="entry-del" data-del="${e.id}" title="${t('sav_remove')}">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ` : ""}
      </div>
    </div>`;
}

/* ===================== EXPENSES SECTION ===================== */
function renderExpensesSection() {
  const data = getData();
  const incomeInput = document.getElementById("incomeInput");
  if (incomeInput) {
    if (data.income) {
      const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD" };
      const val = typeof convertFromBase === "function" ? convertFromBase(data.income) : data.income;
      incomeInput.value = cur.code === "JPY" ? Math.round(val) : Number(val.toFixed(2));
    } else {
      incomeInput.value = "";
    }
  }
  renderSubscriptions(data);
  renderCategoryPills(data.expenses || [], expenseFilterCat);
  renderExpenseList(data);
}

function renderCategoryPills(expenses, activeCategory) {
  const wrap = document.getElementById("categoryPillsWrap");
  if (!wrap) return;

  const nonTransfers = (expenses || []).filter((e) => e.transactionType !== "transfer");
  const total = nonTransfers.reduce((s, e) => s + Number(e.amount || 0), 0);

  const catMap = {};
  nonTransfers.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
  });

  const familyTotal = nonTransfers
    .filter((e) => e.transactionType === "family_contribution" || FAMILY_CATEGORIES.includes(e.category))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  let pillsHtml = `
    <button type="button" class="category-pill-btn ${activeCategory === 'all' ? 'active' : ''}" data-cat-pill="all">
      <span>🌐 All</span>
      <span class="pill-amt">${fmtMoney(total)}</span>
    </button>
  `;

  if (familyTotal > 0) {
    const fPct = total > 0 ? Math.round((familyTotal / total) * 100) : 0;
    pillsHtml += `
      <button type="button" class="category-pill-btn ${activeCategory === 'family_all' ? 'active' : ''}" data-cat-pill="family_all">
        <span>🏡 Family Only</span>
        <span class="pill-amt">${fmtMoney(familyTotal)}</span>
        <span class="pill-pct">(${fPct}%)</span>
      </button>
    `;
  }

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  sortedCats.forEach(([cat, amt]) => {
    const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
    const isActive = activeCategory === cat;
    pillsHtml += `
      <button type="button" class="category-pill-btn ${isActive ? 'active' : ''}" data-cat-pill="${cat}">
        <span>${categoryEmoji(cat)} ${t(cat)}</span>
        <span class="pill-amt">${fmtMoney(amt)}</span>
        <span class="pill-pct">(${pct}%)</span>
      </button>
    `;
  });

  wrap.innerHTML = pillsHtml;

  // Bind click handlers to pills
  wrap.querySelectorAll("[data-cat-pill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetCat = btn.dataset.catPill;
      expenseFilterCat = targetCat;
      const select = document.getElementById("expenseCategoryFilter");
      if (select) select.value = targetCat;
      renderExpensesSection();
    });
  });
}

function filterAndSortExpenses(expenses) {
  let list = [...expenses];

  // 1. Text search
  if (expenseFilterQuery) {
    const q = expenseFilterQuery.toLowerCase();
    list = list.filter((e) =>
      (e.description || "").toLowerCase().includes(q) ||
      (e.notes || "").toLowerCase().includes(q) ||
      (e.recipient || "").toLowerCase().includes(q) ||
      t(e.category).toLowerCase().includes(q)
    );
  }

  // 2. Category filter
  if (expenseFilterCat && expenseFilterCat !== "all") {
    if (expenseFilterCat === "family_all") {
      list = list.filter((e) => e.transactionType === "family_contribution" || FAMILY_CATEGORIES.includes(e.category));
    } else {
      list = list.filter((e) => e.category === expenseFilterCat);
    }
  }

  // 3. Timeframe filter
  if (expenseFilterTime && expenseFilterTime !== "all") {
    list = list.filter((e) => isDateInPeriod(e.date, expenseFilterTime, expenseCustomStart, expenseCustomEnd));
  }

  // 4. Sort order
  if (expenseSortOrder === "newest") {
    list.sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  } else if (expenseSortOrder === "oldest") {
    list.sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
  } else if (expenseSortOrder === "highest") {
    list.sort((a, b) => Number(b.amount) - Number(a.amount));
  } else if (expenseSortOrder === "lowest") {
    list.sort((a, b) => Number(a.amount) - Number(b.amount));
  }

  return list;
}

function renderExpenseList(data) {
  const container = document.getElementById("expenseList");
  const countEl = document.getElementById("expenseCountSummary");
  const periodTotalEl = document.getElementById("expensesPeriodTotal");
  const txCountEl = document.getElementById("expensesTxCount");
  if (!container) return;

  const filtered = filterAndSortExpenses(data.expenses || []);
  const totalFilteredAmt = filtered
    .filter((e) => e.transactionType !== "transfer")
    .reduce((s, e) => s + Number(e.amount), 0);

  if (periodTotalEl) periodTotalEl.textContent = fmtMoney(totalFilteredAmt);
  if (txCountEl) txCountEl.textContent = `${filtered.length} transactions`;

  if (countEl) {
    countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${(data.expenses || []).length}</strong> records · Total Outflow: <strong>${fmtMoney(totalFilteredAmt)}</strong>`;
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="list-empty"><p>${t("exp_empty")}</p></div>`;
    return;
  }

  container.innerHTML = filtered.map((e) => entryRowHtml(e, true)).join("");

  // Bind Delete buttons with confirmation dialog
  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.del;
      const d = getData();
      const exp = (d.expenses || []).find((e) => e.id === id);
      const desc = exp ? exp.description : "this transaction";
      const amt = exp ? fmtMoney(exp.amount) : "";

      showDeleteConfirmation(
        t("confirm_delete_title") || "Confirm Deletion",
        `Are you sure you want to delete "${desc}" (${amt})? This action cannot be undone.`,
        () => {
          const fresh = getData();
          fresh.expenses = (fresh.expenses || []).filter((e) => e.id !== id);
          saveData(fresh);
          renderExpensesSection();
          renderDashboard();
          if (window.renderCharts) window.renderCharts();
        }
      );
    });
  });

  // Bind Edit buttons
  container.querySelectorAll("[data-edit-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditExpenseModal(btn.dataset.editExp);
    });
  });

  // Bind Receipt View buttons
  container.querySelectorAll("[data-view-receipt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openReceiptLightbox(btn.dataset.viewReceipt);
    });
  });
}

/* ===================== EDIT EXPENSE MODAL ===================== */
function openEditExpenseModal(id) {
  const d = getData();
  const exp = (d.expenses || []).find((e) => e.id === id);
  if (!exp) return;

  const modal = document.getElementById("editExpenseModal");
  if (!modal) return;

  const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD" };
  const converted = typeof convertFromBase === "function" ? convertFromBase(exp.amount) : exp.amount;

  document.getElementById("editExpId").value = exp.id;
  document.getElementById("editExpDesc").value = exp.description || "";
  document.getElementById("editExpAmount").value = cur.code === "JPY" ? Math.round(converted) : Number(converted.toFixed(2));
  document.getElementById("editExpCategory").value = exp.category || "cat_food";
  document.getElementById("editExpDate").value = exp.date || "";
  document.getElementById("editExpPayMethod").value = exp.payMethod || "pay_card";
  document.getElementById("editExpNotes").value = exp.notes || "";

  const txTypeSelect = document.getElementById("editExpTransactionType");
  if (txTypeSelect) {
    txTypeSelect.value = exp.transactionType || (FAMILY_CATEGORIES.includes(exp.category) ? "family_contribution" : "expense");
  }

  const recipientInput = document.getElementById("editExpRecipient");
  if (recipientInput) {
    recipientInput.value = exp.recipient || "";
  }

  // Receipt preview in edit modal
  currentEditReceiptBase64 = exp.receipt || null;
  const editPreviewThumb = document.getElementById("editExpReceiptPreviewThumb");
  const removeEditReceiptBtn = document.getElementById("removeEditReceiptBtn");
  const editFileInput = document.getElementById("editExpReceipt");
  if (editFileInput) editFileInput.value = "";
  if (editPreviewThumb) {
    if (exp.receipt) {
      editPreviewThumb.style.backgroundImage = `url("${exp.receipt}")`;
      editPreviewThumb.classList.remove("hidden");
      if (removeEditReceiptBtn) removeEditReceiptBtn.classList.remove("hidden");
    } else {
      editPreviewThumb.classList.add("hidden");
      if (removeEditReceiptBtn) removeEditReceiptBtn.classList.add("hidden");
    }
  }

  modal.classList.remove("hidden");
}

function closeEditExpenseModal() {
  const modal = document.getElementById("editExpenseModal");
  if (modal) modal.classList.add("hidden");
}

/* ===================== SUBSCRIPTIONS & FIXED OVERHEAD ===================== */
function computeSubscriptionMonthlyEquiv(sub) {
  const rawAmt = Number(sub.amount) || 0;
  if (sub.cycle === "yearly") return rawAmt / 12;
  if (sub.cycle === "weekly") return rawAmt * 4.33;
  return rawAmt;
}

function renderSubscriptions(data) {
  const subs = data.subscriptions || [];
  const listEl = document.getElementById("subsList");
  const totalEl = document.getElementById("subsTotalMonthlyAmt");
  if (!listEl) return;

  const activeSubs = subs.filter((s) => s.active !== false);
  const totalMonthlyUSD = activeSubs.reduce((acc, s) => acc + computeSubscriptionMonthlyEquiv(s), 0);

  if (totalEl) {
    totalEl.textContent = `${fmtMoney(totalMonthlyUSD)}/mo`;
  }

  if (!subs.length) {
    listEl.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px 12px; color: var(--text-dim); font-size: 13px;">No active subscriptions. Click "+ Add Subscription" to track your recurring bills.</div>`;
    return;
  }

  const now = new Date();
  listEl.innerHTML = subs.map((s) => {
    const isInactive = s.active === false;
    let dueSoonNotice = "";
    if (s.renewalDate) {
      const ren = new Date(s.renewalDate);
      const diffDays = Math.ceil((ren - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        dueSoonNotice = `<span class="subs-due-soon">⚠️ Due in ${diffDays === 0 ? "today" : diffDays + "d"}</span>`;
      } else if (diffDays > 7) {
        dueSoonNotice = `<span>Due: ${s.renewalDate.slice(5)}</span>`;
      } else {
        dueSoonNotice = `<span class="subs-due-soon">Renewal passed</span>`;
      }
    }

    const cycleText = s.cycle === "yearly" ? "yr" : s.cycle === "weekly" ? "wk" : "mo";

    return `
      <div class="subs-item ${isInactive ? 'inactive' : ''}" data-sub-id="${s.id}">
        <div class="subs-item-left">
          <div class="subs-icon-circle">${categoryEmoji(s.category)}</div>
          <div>
            <div class="subs-name">${escapeHtml(s.name)}</div>
            <div class="subs-meta">
              <span class="subs-cycle-pill">${s.cycle}</span>
              ${dueSoonNotice}
            </div>
          </div>
        </div>
        <div class="subs-item-right">
          <div class="subs-amount">${fmtMoney(s.amount)}<span style="font-size: 11px; font-weight: 600; color: var(--text-dim);">/${cycleText}</span></div>
          <div class="subs-actions">
            <button type="button" class="subs-toggle-btn" data-toggle-sub="${s.id}" title="${isInactive ? 'Resume' : 'Pause'}">
              ${isInactive ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button type="button" class="subs-toggle-btn" data-edit-sub="${s.id}" title="Edit">✏️</button>
            <button type="button" class="subs-toggle-btn" data-del-sub="${s.id}" title="Delete" style="color: var(--rose);">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Bind Sub Toggle
  listEl.querySelectorAll("[data-toggle-sub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = getData();
      const s = (d.subscriptions || []).find((x) => x.id === btn.dataset.toggleSub);
      if (s) {
        s.active = s.active === false ? true : false;
        saveData(d);
        renderSubscriptions(d);
        renderDashboard();
      }
    });
  });

  // Bind Sub Edit
  listEl.querySelectorAll("[data-edit-sub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openSubscriptionModal(btn.dataset.editSub);
    });
  });

  // Bind Sub Delete
  listEl.querySelectorAll("[data-del-sub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = getData();
      d.subscriptions = (d.subscriptions || []).filter((x) => x.id !== btn.dataset.delSub);
      saveData(d);
      renderSubscriptions(d);
      renderDashboard();
    });
  });
}

function openSubscriptionModal(id = null) {
  const modal = document.getElementById("subscriptionModal");
  if (!modal) return;
  const form = document.getElementById("subscriptionForm");
  if (form) form.reset();

  const titleEl = document.getElementById("subModalTitle");
  if (id) {
    const d = getData();
    const s = (d.subscriptions || []).find((x) => x.id === id);
    if (!s) return;
    if (titleEl) titleEl.textContent = "Edit Subscription";
    document.getElementById("subId").value = s.id;
    document.getElementById("subName").value = s.name;
    const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD" };
    const converted = typeof convertFromBase === "function" ? convertFromBase(s.amount) : s.amount;
    document.getElementById("subAmount").value = cur.code === "JPY" ? Math.round(converted) : Number(converted.toFixed(2));
    document.getElementById("subCycle").value = s.cycle || "monthly";
    document.getElementById("subCategory").value = s.category || "cat_bills";
    document.getElementById("subRenewalDate").value = s.renewalDate || "";
    document.getElementById("subActive").checked = s.active !== false;
  } else {
    if (titleEl) titleEl.textContent = "Add Recurring Subscription";
    document.getElementById("subId").value = "";
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 14);
    document.getElementById("subRenewalDate").value = nextWeek.toISOString().slice(0, 10);
    document.getElementById("subActive").checked = true;
  }

  modal.classList.remove("hidden");
}

function closeSubscriptionModal() {
  const modal = document.getElementById("subscriptionModal");
  if (modal) modal.classList.add("hidden");
}

/* ===================== RECEIPT LIGHTBOX ===================== */
let currentAddReceiptBase64 = null;
let currentEditReceiptBase64 = null;

function setupReceiptHandlers() {
  const addFileInput = document.getElementById("expReceipt");
  const addPreviewThumb = document.getElementById("expReceiptPreviewThumb");
  if (addFileInput) {
    addFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentAddReceiptBase64 = ev.target.result;
          if (addPreviewThumb) {
            addPreviewThumb.style.backgroundImage = `url("${currentAddReceiptBase64}")`;
            addPreviewThumb.classList.remove("hidden");
          }
        };
        reader.readAsDataURL(file);
      } else {
        currentAddReceiptBase64 = null;
        if (addPreviewThumb) addPreviewThumb.classList.add("hidden");
      }
    });
  }

  const editFileInput = document.getElementById("editExpReceipt");
  const editPreviewThumb = document.getElementById("editExpReceiptPreviewThumb");
  const removeEditReceiptBtn = document.getElementById("removeEditReceiptBtn");

  if (editFileInput) {
    editFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentEditReceiptBase64 = ev.target.result;
          if (editPreviewThumb) {
            editPreviewThumb.style.backgroundImage = `url("${currentEditReceiptBase64}")`;
            editPreviewThumb.classList.remove("hidden");
          }
          if (removeEditReceiptBtn) removeEditReceiptBtn.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeEditReceiptBtn) {
    removeEditReceiptBtn.addEventListener("click", () => {
      currentEditReceiptBase64 = null;
      if (editFileInput) editFileInput.value = "";
      if (editPreviewThumb) editPreviewThumb.classList.add("hidden");
      removeEditReceiptBtn.classList.add("hidden");
    });
  }

  const closeReceiptModalBtn = document.getElementById("closeReceiptModalBtn");
  const dismissReceiptModalBtn = document.getElementById("dismissReceiptModalBtn");
  if (closeReceiptModalBtn) closeReceiptModalBtn.addEventListener("click", closeReceiptLightbox);
  if (dismissReceiptModalBtn) dismissReceiptModalBtn.addEventListener("click", closeReceiptLightbox);
}

function openReceiptLightbox(expId) {
  const d = getData();
  const exp = (d.expenses || []).find((x) => x.id === expId);
  if (!exp || !exp.receipt) return;

  const modal = document.getElementById("receiptModal");
  const imgEl = document.getElementById("receiptModalImg");
  const titleEl = document.getElementById("receiptModalTitle");
  const metaEl = document.getElementById("receiptModalMeta");
  const downloadLink = document.getElementById("downloadReceiptLink");

  if (!modal || !imgEl) return;

  imgEl.src = exp.receipt;
  if (titleEl) titleEl.textContent = `${exp.description} — Receipt`;
  if (metaEl) metaEl.textContent = `${exp.date} · ${fmtMoney(exp.amount)} · ${t(exp.category)}`;
  if (downloadLink) {
    downloadLink.href = exp.receipt;
    downloadLink.download = `receipt_${exp.date}_${(exp.description || 'expense').replace(/\s+/g, '_')}.png`;
  }

  modal.classList.remove("hidden");
}

function closeReceiptLightbox() {
  const modal = document.getElementById("receiptModal");
  if (modal) modal.classList.add("hidden");
}

/* ===================== WEALTH STATEMENT ===================== */
function renderWealthStatement() {
  const d = getData();
  const container = document.getElementById("statementSheetBody");
  if (!container) return;

  const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD", symbol: "$" };
  const user = currentUserEmail() || "Alex Vance";
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  const incomeUSD = Number(d.income || 0);
  const activeSubs = (d.subscriptions || []).filter((s) => s.active !== false);
  const subsMonthlyUSD = activeSubs.reduce((acc, s) => acc + computeSubscriptionMonthlyEquiv(s), 0);

  const monthExpenses = (d.expenses || []).filter((e) => (e.date || "").startsWith(curMonthKey));
  const monthSpentUSD = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netSurplusUSD = incomeUSD - monthSpentUSD;

  // 50/30/20 Breakdown
  const needsCats = ["cat_bills", "cat_food", "cat_transport", "cat_health", "cat_education"];
  const wantsCats = ["cat_entertainment", "cat_shopping", "cat_clothing", "cat_shoes", "cat_travel", "cat_stationery", "cat_other"];

  const needsSpentUSD = monthExpenses.filter((e) => needsCats.includes(e.category)).reduce((s, e) => s + Number(e.amount), 0);
  const wantsSpentUSD = monthExpenses.filter((e) => wantsCats.includes(e.category)).reduce((s, e) => s + Number(e.amount), 0);
  const savingsAllocatedUSD = Math.max(0, netSurplusUSD);

  const totalFundedGoalsUSD = (d.goals || []).reduce((s, g) => s + Number(g.saved || 0), 0);
  const totalTargetGoalsUSD = (d.goals || []).reduce((s, g) => s + Number(g.target || 0), 0);

  container.innerHTML = `
    <div class="statement-brand-row">
      <div>
        <div class="statement-logo-title">
          <img src="assets/icon.svg" width="28" height="28" alt="Logo">
          <span>Ledger Statement</span>
          <span style="font-size: 11px; padding: 2px 7px; background: rgba(99, 102, 241, 0.15); color: var(--indigo); border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.3);">CONFIDENTIAL</span>
        </div>
        <div style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">Account Portfolio: <strong>${escapeHtml(user)}</strong></div>
      </div>
      <div class="statement-meta-right">
        <div><strong>Period:</strong> ${monthName}</div>
        <div><strong>Issued:</strong> ${now.toLocaleDateString()}</div>
        <div><strong>Currency:</strong> ${cur.code} (${cur.symbol})</div>
      </div>
    </div>

    <!-- 4 High Level KPIs -->
    <div class="statement-kpi-grid">
      <div class="statement-kpi-box">
        <div class="statement-kpi-label">Monthly Gross Income</div>
        <div class="statement-kpi-num" style="color: var(--emerald);">${fmtMoney(incomeUSD)}</div>
      </div>
      <div class="statement-kpi-box">
        <div class="statement-kpi-label">Total Outflows (Month)</div>
        <div class="statement-kpi-num" style="color: var(--rose);">${fmtMoney(monthSpentUSD)}</div>
      </div>
      <div class="statement-kpi-box">
        <div class="statement-kpi-label">Fixed Recurring Overhead</div>
        <div class="statement-kpi-num" style="color: var(--amber);">${fmtMoney(subsMonthlyUSD)}/mo</div>
      </div>
      <div class="statement-kpi-box">
        <div class="statement-kpi-label">Net Surplus / Cashflow</div>
        <div class="statement-kpi-num" style="color: ${netSurplusUSD >= 0 ? 'var(--emerald)' : 'var(--rose)'};">${fmtMoney(netSurplusUSD)}</div>
      </div>
    </div>

    <!-- 50/30/20 Health Audit -->
    <div class="statement-section-title">📊 50/30/20 Wealth Allocation Framework</div>
    <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
      <div class="statement-breakdown-row">
        <span><strong>Essential Needs (Target 50% = ${fmtMoney(incomeUSD * 0.5)})</strong></span>
        <span>${fmtMoney(needsSpentUSD)} (${incomeUSD > 0 ? Math.round((needsSpentUSD / incomeUSD) * 100) : 0}%)</span>
      </div>
      <div class="statement-breakdown-row">
        <span><strong>Discretionary Wants (Target 30% = ${fmtMoney(incomeUSD * 0.3)})</strong></span>
        <span>${fmtMoney(wantsSpentUSD)} (${incomeUSD > 0 ? Math.round((wantsSpentUSD / incomeUSD) * 100) : 0}%)</span>
      </div>
      <div class="statement-breakdown-row">
        <span><strong>Net Surplus & Capital Growth (Target 20% = ${fmtMoney(incomeUSD * 0.2)})</strong></span>
        <span>${fmtMoney(savingsAllocatedUSD)} (${incomeUSD > 0 ? Math.round((savingsAllocatedUSD / incomeUSD) * 100) : 0}%)</span>
      </div>
      <div class="statement-breakdown-row" style="background: rgba(255,255,255,0.02);">
        <span><strong>Long-Term Savings Goals Funded</strong></span>
        <span><strong>${fmtMoney(totalFundedGoalsUSD)}</strong> / ${fmtMoney(totalTargetGoalsUSD)} (${totalTargetGoalsUSD > 0 ? Math.round((totalFundedGoalsUSD / totalTargetGoalsUSD) * 100) : 0}%)</span>
      </div>
    </div>

    <!-- Monthly Transaction Ledger -->
    <div class="statement-section-title">💳 Current Period Itemized Ledger (${monthExpenses.length} entries)</div>
    <div style="overflow-x: auto; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px;">
      <table class="statement-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment</th>
            <th style="text-align: right;">Amount (${cur.code})</th>
          </tr>
        </thead>
        <tbody>
          ${monthExpenses.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:16px;">No transactions recorded for this period.</td></tr>' :
            monthExpenses.map((e) => `
              <tr>
                <td>${e.date}</td>
                <td><strong>${escapeHtml(e.description)}</strong> ${e.receipt ? '📎' : ''}</td>
                <td>${t(e.category)}</td>
                <td>${e.payMethod ? e.payMethod.replace('pay_', '').toUpperCase() : 'CARD'}</td>
                <td style="text-align: right; font-weight: 700; color: var(--rose);">-${fmtMoney(e.amount)}</td>
              </tr>
            `).join("")
          }
        </tbody>
      </table>
    </div>

    <div class="statement-footer-disclaimer">
      This statement is generated automatically by Ledger Personal Financial Operating System.<br>
      Foreign exchange rates and historical valuations reflect dynamic market indices. Values computed using base ISO 4217 parity standards.
    </div>
  `;
}

function openWealthStatementModal() {
  const modal = document.getElementById("statementModal");
  if (!modal) return;
  renderWealthStatement();
  modal.classList.remove("hidden");
}

function closeWealthStatementModal() {
  const modal = document.getElementById("statementModal");
  if (modal) modal.classList.add("hidden");
}

/* ===================== CSV EXPORT ===================== */
function exportExpensesToCSV() {
  const data = getData();
  const expenses = data.expenses || [];
  if (!expenses.length) {
    alert("No expenses available to export.");
    return;
  }

  const headers = ["ID", "Date", "Description", "Category", "Amount", "Currency", "Payment Method", "Notes"];
  const cur = getCurrency();
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${t(e.category)}"`,
    e.amount,
    cur.code,
    `"${e.payMethod || 'pay_card'}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ledger_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ===================== SAVINGS SECTION ===================== */
window.savingsForexBufferPct = 0;

function updateSavingsBanner(data, bufferPct = 0) {
  const targetEl = document.getElementById("portfolioTargetAmt");
  const targetSub = document.getElementById("portfolioTargetSub");
  const savedEl = document.getElementById("portfolioSavedAmt");
  const savedPct = document.getElementById("portfolioSavedPct");
  const remEl = document.getElementById("portfolioRemainingAmt");
  const remNotice = document.getElementById("portfolioBufferNotice");
  const runwayEl = document.getElementById("portfolioRunwayMonths");
  const barFill = document.getElementById("portfolioBarFill");

  if (!targetEl) return;

  const goals = data.goals || [];
  const totalTargetUSD = goals.reduce((s, g) => s + Number(g.target || 0), 0);
  const totalSavedUSD = goals.reduce((s, g) => s + Number(g.saved || 0), 0);

  const multiplier = 1 + (bufferPct / 100);
  const bufferedTargetUSD = totalTargetUSD * multiplier;
  const remainingUSD = Math.max(0, bufferedTargetUSD - totalSavedUSD);
  const pct = bufferedTargetUSD > 0 ? Math.min(100, Math.round((totalSavedUSD / bufferedTargetUSD) * 100)) : 0;

  targetEl.textContent = fmtMoney(bufferedTargetUSD);
  if (bufferPct > 0) {
    targetSub.textContent = `Includes +${bufferPct}% macro forex buffer`;
    remNotice.textContent = `+${fmtMoney(bufferedTargetUSD - totalTargetUSD)} currency contingency`;
  } else {
    targetSub.textContent = "Base nominal target";
    remNotice.textContent = "Nominal baseline (0% buffer)";
  }

  if (savedEl) savedEl.textContent = fmtMoney(totalSavedUSD);
  if (savedPct) savedPct.textContent = `${pct}% of target portfolio`;
  if (remEl) remEl.textContent = fmtMoney(remainingUSD);
  if (barFill) barFill.style.width = `${pct}%`;

  // Compute Runway using monthly net surplus
  const incomeUSD = Number(data.income || 0);
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalExpUSD = (data.expenses || []).filter((e) => (e.date || "").startsWith(curMonthKey)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const surplusUSD = Math.max(0, incomeUSD - totalExpUSD);

  if (runwayEl) {
    if (remainingUSD <= 0) {
      runwayEl.textContent = "🎉 Fully Funded";
      runwayEl.style.color = "var(--emerald)";
    } else if (surplusUSD > 0) {
      const months = (remainingUSD / surplusUSD).toFixed(1);
      runwayEl.textContent = `~${months} mos`;
      runwayEl.style.color = "var(--indigo)";
    } else {
      runwayEl.textContent = "Awaiting surplus";
      runwayEl.style.color = "var(--amber)";
    }
  }
}

function renderGoals() {
  const data = getData();
  const container = document.getElementById("goalList");
  if (!container) return;

  const bufferPct = window.savingsForexBufferPct || 0;
  updateSavingsBanner(data, bufferPct);

  // Bind buffer sensitivity pills
  document.querySelectorAll("[data-forex-buffer]").forEach((pill) => {
    pill.classList.toggle("active", Number(pill.dataset.forexBuffer) === bufferPct);
    pill.onclick = () => {
      window.savingsForexBufferPct = Number(pill.dataset.forexBuffer);
      renderGoals();
    };
  });

  if (!data.goals || !data.goals.length) {
    container.innerHTML = `<div class="list-empty"><p>${t("sav_empty")}</p></div>`;
    return;
  }

  container.innerHTML = data.goals.map((g) => {
    const multiplier = 1 + (bufferPct / 100);
    const bufferedTarget = Number(g.target || 0) * multiplier;
    const saved = Number(g.saved || 0);
    const pct = Math.min(100, Math.round((saved / (bufferedTarget || 1)) * 100));
    const isCompleted = pct >= 100;
    const remaining = Math.max(0, bufferedTarget - saved);

    let daysLeftHtml = "";
    let paceHtml = "";
    if (g.targetDate) {
      const diffMs = new Date(g.targetDate) - new Date();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        daysLeftHtml = `<span class="goal-days-badge">${t("sav_days_left", { days: diffDays })}</span>`;
        const monthsLeft = Math.max(0.5, diffDays / 30.4);
        const neededPerMonth = remaining / monthsLeft;
        paceHtml = `<span class="goal-pace-badge">Pace: <strong>${fmtMoney(neededPerMonth)}/mo</strong></span>`;
      }
    }

    return `
      <div class="goal-card ${isCompleted ? 'goal-completed' : ''}" data-goal-id="${g.id}">
        <div class="goal-top">
          <div class="goal-header-left">
            <span class="goal-icon-badge">${g.icon || '🎯'}</span>
            <div>
              <div class="goal-name">${escapeHtml(g.name)}</div>
              <div class="goal-target-sub" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                ${daysLeftHtml}
                ${paceHtml}
              </div>
            </div>
          </div>
          <div class="goal-header-right">
            <span class="goal-pct-badge ${isCompleted ? 'completed' : ''}">${isCompleted ? '🎉 ' + t('sav_completed') : `${pct}%`}</span>
          </div>
        </div>

        <div class="goal-metrics">
          <div class="goal-metric-col">
            <span class="lbl">Saved</span>
            <span class="val emerald">${fmtMoney(saved)}</span>
          </div>
          <div class="goal-metric-col">
            <span class="lbl">Target ${bufferPct > 0 ? `(+${bufferPct}%)` : ''}</span>
            <span class="val">${fmtMoney(bufferedTarget)}</span>
          </div>
          <div class="goal-metric-col">
            <span class="lbl">Remaining</span>
            <span class="val ${remaining === 0 ? 'emerald' : ''}">${fmtMoney(remaining)}</span>
          </div>
        </div>

        <div class="goal-bar-track">
          <div class="goal-bar-fill" style="width: ${pct}%;"></div>
        </div>

        <div class="goal-quick-actions">
          <button class="goal-chip-btn" data-quick-add="${g.id}" data-amount="50">+ ${fmtMoney(50)}</button>
          <button class="goal-chip-btn" data-quick-add="${g.id}" data-amount="100">+ ${fmtMoney(100)}</button>
          <div class="goal-fund-input-wrap">
            <input type="number" min="1" step="0.01" placeholder="${t('sav_funds_ph')}" data-fund-input="${g.id}">
            <button class="btn-deposit" data-addfund="${g.id}">Deposit</button>
            <button class="btn-withdraw" data-withdrawfund="${g.id}">Withdraw</button>
          </div>
          <button class="goal-del-btn" data-delgoal="${g.id}" title="${t('sav_remove')}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
  }).join("");

  // Bind Quick Add Chips
  container.querySelectorAll("[data-quick-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.quickAdd;
      const amt = Number(btn.dataset.amount);
      if (!amt || amt <= 0) return;
      const d = getData();
      const g = d.goals.find((x) => x.id === id);
      if (g) {
        g.saved = Number(g.saved || 0) + amt;
        saveData(d);
        renderGoals();
        renderDashboard();
      }
    });
  });

  // Bind Custom Deposit Button
  container.querySelectorAll("[data-addfund]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.addfund;
      const input = container.querySelector(`[data-fund-input="${id}"]`);
      const rawAmt = Number(input.value);
      if (!rawAmt || rawAmt <= 0) return;
      const amt = typeof convertToBase === "function" ? convertToBase(rawAmt) : rawAmt;
      const d = getData();
      const g = d.goals.find((x) => x.id === id);
      if (g) {
        g.saved = Number(g.saved || 0) + amt;
        saveData(d);
        renderGoals();
        renderDashboard();
      }
    });
  });

  // Bind Custom Withdraw Button
  container.querySelectorAll("[data-withdrawfund]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.withdrawfund;
      const input = container.querySelector(`[data-fund-input="${id}"]`);
      const rawAmt = Number(input.value);
      if (!rawAmt || rawAmt <= 0) return;
      const amt = typeof convertToBase === "function" ? convertToBase(rawAmt) : rawAmt;
      const d = getData();
      const g = d.goals.find((x) => x.id === id);
      if (g) {
        g.saved = Math.max(0, Number(g.saved || 0) - amt);
        saveData(d);
        renderGoals();
        renderDashboard();
      }
    });
  });

  // Bind Delete Goal Button
  container.querySelectorAll("[data-delgoal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to remove this savings goal?")) return;
      const d = getData();
      d.goals = d.goals.filter((g) => g.id !== btn.dataset.delgoal);
      saveData(d);
      renderGoals();
      renderDashboard();
    });
  });
}

/* ===================== BACKUP & RESTORE ===================== */
function exportBackupJSON() {
  const data = getData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledger_backup_${currentUserEmail()}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restoreBackupJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed !== "object" || parsed === null) throw new Error("Invalid format");
      saveData({
        income: Number(parsed.income) || 0,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      });
      renderDashboard();
      renderExpensesSection();
      renderGoals();
      if (window.renderCharts) window.renderCharts();
      alert("Backup successfully restored!");
    } catch {
      alert("Error: Invalid JSON backup file.");
    }
  };
  reader.readAsText(file);
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  if (!currentUserEmail()) {
    if (typeof initDemoAccount === "function") {
      initDemoAccount();
    } else {
      window.location.href = "index.html";
      return;
    }
  }

  // Populate user profile info in header/sidebar safely
  const p = typeof getUserProfile === "function" ? getUserProfile() : null;
  const profile = p || { name: "Alex Vance", initials: "AV", email: currentUserEmail() || "user@ledger.local" };
  document.querySelectorAll(".user-name-display").forEach((el) => {
    el.textContent = profile.name || "Alex Vance";
  });
  document.querySelectorAll(".user-avatar-initials").forEach((el) => {
    el.textContent = profile.initials || "AV";
  });
  document.querySelectorAll(".user-email-display").forEach((el) => {
    el.textContent = profile.email || "demo@ledger.app";
  });

  // Navigation handlers (both desktop sidebar and mobile bottom nav)
  document.querySelectorAll(".nav-btn, .sidebar-link").forEach((btn) => {
    btn.addEventListener("click", () => switchSection(btn.dataset.section));
  });

  // Settings & Logout
  document.querySelectorAll(".btn-logout").forEach((b) => {
    b.addEventListener("click", () => {
      localStorage.removeItem("ledger_session");
      window.location.href = "index.html";
    });
  });

  document.querySelectorAll("#settingsBtn, [data-go-settings]").forEach((b) => {
    b.addEventListener("click", () => switchSection("settings"));
  });

  // Clear data
  const clearDataBtn = document.getElementById("clearDataBtn");
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      showDeleteConfirmation(
        t("settings_clear_data") || "Clear All Data",
        t("settings_clear_confirm") || "Are you sure you want to clear all data? This cannot be undone.",
        () => {
          saveData({ income: 0, openingBalance: 0, incomes: [], expenses: [], goals: [], subscriptions: getDefaultSubscriptions() });
          renderDashboard();
          renderExpensesSection();
          renderGoals();
          if (window.renderCharts) window.renderCharts();
          const toast = document.getElementById("settingsToast");
          if (toast) {
            toast.textContent = t("settings_cleared");
            setTimeout(() => { toast.textContent = ""; }, 3000);
          }
        }
      );
    });
  }

  // Set default expense date
  const dateInput = document.getElementById("expDate");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  // Dashboard Timeframe Filter Bar
  const dashTimeframeBar = document.getElementById("dashTimeframeBar");
  const dashCustomRangeWrap = document.getElementById("dashCustomRangeWrap");
  if (dashTimeframeBar) {
    dashTimeframeBar.querySelectorAll("[data-dash-time], [data-dash-timeframe]").forEach((btn) => {
      btn.addEventListener("click", () => {
        dashTimeframeBar.querySelectorAll("[data-dash-time], [data-dash-timeframe]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        dashSelectedTimeframe = btn.dataset.dashTime || btn.dataset.dashTimeframe;

        if (dashSelectedTimeframe === "custom") {
          if (dashCustomRangeWrap) dashCustomRangeWrap.classList.remove("hidden");
        } else {
          if (dashCustomRangeWrap) dashCustomRangeWrap.classList.add("hidden");
          renderDashboard();
        }
      });
    });
  }

  const dashCustomApplyBtn = document.getElementById("dashApplyCustomBtn") || document.getElementById("dashCustomApplyBtn");
  if (dashCustomApplyBtn) {
    dashCustomApplyBtn.addEventListener("click", () => {
      dashCustomStart = document.getElementById("dashCustomStart") ? document.getElementById("dashCustomStart").value : "";
      dashCustomEnd = document.getElementById("dashCustomEnd") ? document.getElementById("dashCustomEnd").value : "";
      renderDashboard();
    });
  }

  // Dashboard Family Banner "Filter Family" Button
  const dashViewFamilyBtn = document.getElementById("dashViewFamilyBtn");
  if (dashViewFamilyBtn) {
    dashViewFamilyBtn.addEventListener("click", () => {
      expenseFilterCat = "family_all";
      switchSection("expenses");
      const catSelect = document.getElementById("expenseCategoryFilter");
      if (catSelect) catSelect.value = "family_all";
      renderExpensesSection();
    });
  }

  // Add Income Modal Handlers
  const addIncomeModal = document.getElementById("addIncomeModal");
  const openAddIncomeBtn = document.getElementById("openAddIncomeBtn");
  const dashAddIncomeBtn = document.getElementById("dashAddIncomeBtn");
  const closeIncomeModalBtn = document.getElementById("closeIncomeModalBtn");
  const cancelIncomeBtn = document.getElementById("cancelIncomeBtn");
  const incomeDateInput = document.getElementById("incomeDate");

  function openIncomeModal() {
    if (!addIncomeModal) return;
    const form = document.getElementById("incomeForm");
    if (form) form.reset();
    if (incomeDateInput) incomeDateInput.value = new Date().toISOString().slice(0, 10);
    addIncomeModal.classList.remove("hidden");
  }

  function closeIncomeModal() {
    if (addIncomeModal) addIncomeModal.classList.add("hidden");
  }

  if (openAddIncomeBtn) openAddIncomeBtn.addEventListener("click", openIncomeModal);
  if (dashAddIncomeBtn) dashAddIncomeBtn.addEventListener("click", openIncomeModal);
  if (closeIncomeModalBtn) closeIncomeModalBtn.addEventListener("click", closeIncomeModal);
  if (cancelIncomeBtn) cancelIncomeBtn.addEventListener("click", closeIncomeModal);

  // Income Form Submission with Duplicate Submission Prevention
  const incomeForm = document.getElementById("incomeForm");
  const saveIncomeSubmitBtn = document.getElementById("saveIncomeSubmitBtn");
  if (incomeForm) {
    incomeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (saveIncomeSubmitBtn) saveIncomeSubmitBtn.disabled = true;

      const source = document.getElementById("incomeSource").value.trim();
      const rawAmount = Number(document.getElementById("incomeAmount").value);
      const amount = typeof convertToBase === "function" ? convertToBase(rawAmount) : rawAmount;
      const category = document.getElementById("incomeCategory").value;
      const status = document.getElementById("incomeStatus").value;
      const date = document.getElementById("incomeDate").value;
      const payMethod = document.getElementById("incomePayMethod").value;
      const notes = document.getElementById("incomeNotes") ? document.getElementById("incomeNotes").value.trim() : "";

      if (!source || !rawAmount || rawAmount <= 0 || !date) {
        if (saveIncomeSubmitBtn) saveIncomeSubmitBtn.disabled = false;
        return;
      }

      const d = getData();
      if (!Array.isArray(d.incomes)) d.incomes = [];
      d.incomes.push({
        id: uid(),
        source,
        amount,
        category,
        status,
        date,
        payMethod,
        notes,
      });

      // If status is received and it's salary or no income was set, update baseline income
      if (status === "received" && (category === "inc_salary" || !d.income)) {
        d.income = amount;
      }

      saveData(d);
      closeIncomeModal();
      if (saveIncomeSubmitBtn) saveIncomeSubmitBtn.disabled = false;

      renderDashboard();
      renderExpensesSection();
      if (window.renderCharts) window.renderCharts();
    });
  }

  // Save Income Button (Existing Settings/Expenses Quick Save)
  const saveIncomeBtn = document.getElementById("saveIncomeBtn");
  if (saveIncomeBtn) {
    saveIncomeBtn.addEventListener("click", () => {
      const rawVal = Number(document.getElementById("incomeInput").value) || 0;
      const d = getData();
      d.income = typeof convertToBase === "function" ? convertToBase(rawVal) : rawVal;
      saveData(d);
      renderDashboard();
      if (window.renderCharts) window.renderCharts();
      const toast = document.getElementById("incomeToast");
      if (toast) {
        toast.textContent = t("exp_income_saved");
        setTimeout(() => { toast.textContent = ""; }, 2500);
      }
    });
  }

  // Opening Balance Setting in Settings Section
  const settingsOpeningBalance = document.getElementById("settingsOpeningBalance");
  const saveOpeningBalanceBtn = document.getElementById("saveOpeningBalanceBtn");
  if (settingsOpeningBalance) {
    const curData = getData();
    settingsOpeningBalance.value = curData.openingBalance || "";
  }
  if (saveOpeningBalanceBtn) {
    saveOpeningBalanceBtn.addEventListener("click", () => {
      const rawVal = Number(document.getElementById("settingsOpeningBalance").value) || 0;
      const d = getData();
      d.openingBalance = typeof convertToBase === "function" ? convertToBase(rawVal) : rawVal;
      saveData(d);
      renderDashboard();
      saveOpeningBalanceBtn.textContent = "Saved ✓";
      setTimeout(() => { saveOpeningBalanceBtn.textContent = "Save"; }, 2000);
    });
  }

  // Add Expense Form with Duplicate Submission Prevention
  const expenseForm = document.getElementById("expenseForm");
  const addExpenseSubmitBtn = expenseForm ? expenseForm.querySelector("button[type='submit']") : null;
  if (expenseForm) {
    expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (addExpenseSubmitBtn) addExpenseSubmitBtn.disabled = true;

      const desc = document.getElementById("expDesc").value.trim();
      const rawAmount = Number(document.getElementById("expAmount").value);
      const amount = typeof convertToBase === "function" ? convertToBase(rawAmount) : rawAmount;
      const category = document.getElementById("expCategory").value;
      const date = document.getElementById("expDate").value;
      const payMethod = document.getElementById("expPayMethod") ? document.getElementById("expPayMethod").value : "pay_card";
      const notes = document.getElementById("expNotes") ? document.getElementById("expNotes").value.trim() : "";
      const txTypeSelect = document.getElementById("expTransactionType");
      const transactionType = txTypeSelect ? txTypeSelect.value : (FAMILY_CATEGORIES.includes(category) ? "family_contribution" : "expense");
      const recipientInput = document.getElementById("expRecipient");
      const recipient = recipientInput ? recipientInput.value.trim() : "";

      if (!desc || !rawAmount || rawAmount <= 0 || !date) {
        if (addExpenseSubmitBtn) addExpenseSubmitBtn.disabled = false;
        return;
      }

      const d = getData();
      d.expenses.push({
        id: uid(),
        description: desc,
        amount,
        category,
        date,
        payMethod,
        notes,
        transactionType,
        recipient,
        receipt: currentAddReceiptBase64,
      });
      saveData(d);

      expenseForm.reset();
      currentAddReceiptBase64 = null;
      const addThumb = document.getElementById("expReceiptPreviewThumb");
      if (addThumb) addThumb.classList.add("hidden");
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      if (addExpenseSubmitBtn) addExpenseSubmitBtn.disabled = false;

      renderExpensesSection();
      renderDashboard();
      if (window.renderCharts) window.renderCharts();

      // Close modal if open
      const addExpModal = document.getElementById("addExpenseModal");
      if (addExpModal) addExpModal.classList.add("hidden");
    });
  }

  // Edit Expense Form Submit with Duplicate Submission Prevention
  const editExpenseForm = document.getElementById("editExpenseForm");
  const updateExpenseSubmitBtn = document.getElementById("updateExpenseSubmitBtn");
  if (editExpenseForm) {
    editExpenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (updateExpenseSubmitBtn) updateExpenseSubmitBtn.disabled = true;

      const id = document.getElementById("editExpId").value;
      const desc = document.getElementById("editExpDesc").value.trim();
      const rawAmount = Number(document.getElementById("editExpAmount").value);
      const amount = typeof convertToBase === "function" ? convertToBase(rawAmount) : rawAmount;
      const category = document.getElementById("editExpCategory").value;
      const date = document.getElementById("editExpDate").value;
      const payMethod = document.getElementById("editExpPayMethod").value;
      const notes = document.getElementById("editExpNotes").value.trim();
      const txTypeSelect = document.getElementById("editExpTransactionType");
      const transactionType = txTypeSelect ? txTypeSelect.value : (FAMILY_CATEGORIES.includes(category) ? "family_contribution" : "expense");
      const recipientInput = document.getElementById("editExpRecipient");
      const recipient = recipientInput ? recipientInput.value.trim() : "";

      const d = getData();
      const exp = (d.expenses || []).find((x) => x.id === id);
      if (exp) {
        exp.description = desc;
        exp.amount = amount;
        exp.category = category;
        exp.date = date;
        exp.payMethod = payMethod;
        exp.notes = notes;
        exp.transactionType = transactionType;
        exp.recipient = recipient;
        exp.receipt = currentEditReceiptBase64;
        saveData(d);
      }

      closeEditExpenseModal();
      if (updateExpenseSubmitBtn) updateExpenseSubmitBtn.disabled = false;

      renderExpensesSection();
      renderDashboard();
      if (window.renderCharts) window.renderCharts();
    });
  }

  const cancelEditBtn = document.getElementById("cancelEditExpBtn");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditExpenseModal);

  // Setup Receipt Lightbox Handlers
  setupReceiptHandlers();

  // Subscriptions Modal & Form
  const openAddSubBtn = document.getElementById("openAddSubBtn");
  if (openAddSubBtn) openAddSubBtn.addEventListener("click", () => openSubscriptionModal());

  const closeSubModalBtn = document.getElementById("closeSubModalBtn");
  const cancelSubBtn = document.getElementById("cancelSubBtn");
  if (closeSubModalBtn) closeSubModalBtn.addEventListener("click", closeSubscriptionModal);
  if (cancelSubBtn) cancelSubBtn.addEventListener("click", closeSubscriptionModal);

  const subForm = document.getElementById("subscriptionForm");
  if (subForm) {
    subForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("subId").value;
      const name = document.getElementById("subName").value.trim();
      const rawAmt = Number(document.getElementById("subAmount").value);
      const amount = typeof convertToBase === "function" ? convertToBase(rawAmt) : rawAmt;
      const cycle = document.getElementById("subCycle").value;
      const category = document.getElementById("subCategory").value;
      const renewalDate = document.getElementById("subRenewalDate").value;
      const active = document.getElementById("subActive").checked;

      if (!name || isNaN(rawAmt) || rawAmt <= 0) return;

      const d = getData();
      if (!Array.isArray(d.subscriptions)) d.subscriptions = [];

      if (id) {
        const s = d.subscriptions.find((x) => x.id === id);
        if (s) {
          s.name = name;
          s.amount = amount;
          s.cycle = cycle;
          s.category = category;
          s.renewalDate = renewalDate;
          s.active = active;
        }
      } else {
        d.subscriptions.push({
          id: uid(),
          name,
          amount,
          cycle,
          category,
          renewalDate,
          active,
        });
      }

      saveData(d);
      closeSubscriptionModal();
      renderSubscriptions(d);
      renderDashboard();
    });
  }

  // Executive Wealth Statement Modal
  const printStatementBtn = document.getElementById("printStatementBtn");
  if (printStatementBtn) printStatementBtn.addEventListener("click", openWealthStatementModal);

  const closeStatementModalBtn = document.getElementById("closeStatementModalBtn");
  if (closeStatementModalBtn) closeStatementModalBtn.addEventListener("click", closeWealthStatementModal);

  const printStatementActionBtn = document.getElementById("printStatementActionBtn");
  if (printStatementActionBtn) {
    printStatementActionBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Expense Search & Filters listeners
  const searchInput = document.getElementById("expenseSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      expenseFilterQuery = e.target.value.trim();
      renderExpenseList(getData());
    });
  }

  const catFilterSelect = document.getElementById("expenseCategoryFilter");
  if (catFilterSelect) {
    catFilterSelect.addEventListener("change", (e) => {
      expenseFilterCat = e.target.value;
      renderExpensesSection();
    });
  }

  const timeFilterSelect = document.getElementById("expenseTimeFilter");
  const expenseCustomRangeWrap = document.getElementById("expenseCustomRangeWrap");
  if (timeFilterSelect) {
    timeFilterSelect.addEventListener("change", (e) => {
      expenseFilterTime = e.target.value;
      if (expenseFilterTime === "custom") {
        if (expenseCustomRangeWrap) expenseCustomRangeWrap.classList.remove("hidden");
      } else {
        if (expenseCustomRangeWrap) expenseCustomRangeWrap.classList.add("hidden");
        renderExpensesSection();
      }
    });
  }

  const expenseCustomApplyBtn = document.getElementById("expenseCustomApplyBtn");
  if (expenseCustomApplyBtn) {
    expenseCustomApplyBtn.addEventListener("click", () => {
      expenseCustomStart = document.getElementById("expenseCustomStart") ? document.getElementById("expenseCustomStart").value : "";
      expenseCustomEnd = document.getElementById("expenseCustomEnd") ? document.getElementById("expenseCustomEnd").value : "";
      renderExpensesSection();
    });
  }

  const sortOrderSelect = document.getElementById("expenseSortOrder");
  if (sortOrderSelect) {
    sortOrderSelect.addEventListener("change", (e) => {
      expenseSortOrder = e.target.value;
      renderExpenseList(getData());
    });
  }

  // Export CSV button
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportExpensesToCSV);

  // Add Goal Form
  const goalForm = document.getElementById("goalForm");
  if (goalForm) {
    goalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("goalName").value.trim();
      const rawTarget = Number(document.getElementById("goalAmount").value);
      const target = typeof convertToBase === "function" ? convertToBase(rawTarget) : rawTarget;
      const targetDate = document.getElementById("goalTargetDate") ? document.getElementById("goalTargetDate").value : "";
      const icon = document.getElementById("goalIcon") ? document.getElementById("goalIcon").value : "🎯";

      if (!name || !rawTarget || rawTarget <= 0) return;

      const d = getData();
      d.goals.push({
        id: uid(),
        name,
        target,
        saved: 0,
        targetDate,
        icon,
      });
      saveData(d);

      goalForm.reset();
      renderGoals();
      renderDashboard();
    });
  }

  // Backup & Restore
  const exportBackupBtn = document.getElementById("exportBackupBtn");
  if (exportBackupBtn) exportBackupBtn.addEventListener("click", exportBackupJSON);

  const restoreBackupInput = document.getElementById("restoreBackupInput");
  if (restoreBackupInput) {
    restoreBackupInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        restoreBackupJSON(e.target.files[0]);
      }
    });
  }

  // Load Demo Data button in settings, dashboard & analysis
  const loadDemoBtn = document.getElementById("loadDemoDataBtn");
  const dashLoadDemoBtn = document.getElementById("dashLoadDemoBtn");
  const analysisLoadDemoBtn = document.getElementById("analysisLoadDemoBtn");
  
  function triggerLoadDemo() {
    const curEmail = currentUserEmail() || "demo@ledger.app";
    if (typeof populateSampleDataForUser === "function") {
      populateSampleDataForUser(curEmail);
    } else if (typeof initDemoAccount === "function") {
      initDemoAccount();
    }
    renderDashboard();
    renderExpensesSection();
    renderGoals();
    if (typeof syncBudgetCalcPrefill === "function") syncBudgetCalcPrefill();
    if (window.renderCharts) window.renderCharts();
  }

  if (loadDemoBtn) loadDemoBtn.addEventListener("click", triggerLoadDemo);
  if (dashLoadDemoBtn) dashLoadDemoBtn.addEventListener("click", triggerLoadDemo);
  if (analysisLoadDemoBtn) analysisLoadDemoBtn.addEventListener("click", triggerLoadDemo);

  // Global triggers
  window.onCurrencyChange = () => {
    renderDashboard();
    renderExpensesSection();
    renderGoals();
    if (window.renderCharts) window.renderCharts();
  };
  window.onLanguageChange = () => {
    renderDashboard();
    renderExpensesSection();
    renderGoals();
    if (window.renderCharts) window.renderCharts();
  };
  window.onThemeChange = () => {
    if (window.renderCharts) window.renderCharts();
  };

  // Initial renders
  renderDashboard();
  renderExpensesSection();
  renderGoals();

  // Route according to URL hash (e.g., #analysis, #calculator)
  handleHashNavigation();
  window.addEventListener("hashchange", handleHashNavigation);
});
