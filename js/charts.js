let categoryChartInstance = null;
let trendChartInstance = null;
let velocityChartInstance = null;
let dowChartInstance = null;

let currentAnalysisTimeframe = "month";

const CATEGORY_COLOR_MAP = {
  cat_food: "#10b981",
  cat_bills: "#6366f1",
  cat_transport: "#06b6d4",
  cat_entertainment: "#f59e0b",
  cat_clothing: "#ec4899",
  cat_shoes: "#8b5cf6",
  cat_stationery: "#f97316",
  cat_health: "#14b8a6",
  cat_shopping: "#e11d48",
  cat_education: "#3b82f6",
  cat_travel: "#84cc16",
  cat_investments: "#a855f7",
  cat_family: "#059669",
  cat_parents: "#d97706",
  cat_family_support: "#2563eb",
  cat_household: "#7c3aed",
  cat_rent: "#db2777",
  cat_groceries_bills: "#0891b2",
  cat_other: "#64748b",
};

const FALLBACK_COLORS = [
  "#10b981", "#6366f1", "#06b6d4", "#f59e0b", "#ec4899",
  "#8b5cf6", "#f97316", "#14b8a6", "#e11d48", "#3b82f6",
  "#059669", "#d97706", "#2563eb", "#7c3aed", "#db2777"
];

function getCategoryColor(cat, idx = 0) {
  return CATEGORY_COLOR_MAP[cat] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function chartThemeColors() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  return {
    isLight,
    text: isLight ? "#64748b" : "#94a3b8",
    heading: isLight ? "#0f172a" : "#f1f5f9",
    grid: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.06)",
    cardBg: isLight ? "#ffffff" : "#121a2d",
    border: isLight ? "#e2e8f0" : "#1e293b",
    incomeColor: "#10b981",
    incomeBg: isLight ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.25)",
    expenseColor: "#f43f5e",
    expenseBg: isLight ? "rgba(244, 63, 94, 0.15)" : "rgba(244, 63, 94, 0.25)",
    accentColor: "#6366f1",
    accentBg: isLight ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.25)",
  };
}

function filterExpensesByTimeframe(expenses, timeframe) {
  if (typeof window.filterByDateRange === "function") {
    return window.filterByDateRange(expenses, timeframe);
  }
  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth();

  if (timeframe === "today") {
    const todayStr = `${currentY}-${String(currentM + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return expenses.filter((e) => (e.date || "").startsWith(todayStr));
  }
  if (timeframe === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(currentY, currentM, now.getDate() - dayOfWeek);
    const startStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, "0")}-${String(startOfWeek.getDate()).padStart(2, "0")}`;
    return expenses.filter((e) => (e.date || "").slice(0, 10) >= startStr);
  }
  if (timeframe === "month" || timeframe === "this_month") {
    const curMonthStr = `${currentY}-${String(currentM + 1).padStart(2, "0")}`;
    return expenses.filter((e) => (e.date || "").startsWith(curMonthStr));
  }
  if (timeframe === "last_month" || timeframe === "prev_month") {
    const lastM = currentM === 0 ? 12 : currentM;
    const lastY = currentM === 0 ? currentY - 1 : currentY;
    const lmStr = `${lastY}-${String(lastM).padStart(2, "0")}`;
    return expenses.filter((e) => (e.date || "").startsWith(lmStr));
  }
  if (timeframe === "3m") {
    const cutoff = new Date(currentY, currentM - 2, 1);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-01`;
    return expenses.filter((e) => (e.date || "").slice(0, 10) >= cutoffStr);
  }
  if (timeframe === "6m") {
    const cutoff = new Date(currentY, currentM - 5, 1);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-01`;
    return expenses.filter((e) => (e.date || "").slice(0, 10) >= cutoffStr);
  }
  if (timeframe === "year" || timeframe === "this_year") {
    const yrStr = `${currentY}-`;
    return expenses.filter((e) => (e.date || "").startsWith(yrStr));
  }
  return [...expenses];
}

function renderCharts() {
  const data = typeof getData === "function" ? getData() : { income: 0, expenses: [], goals: [] };
  const tc = chartThemeColors();

  const emptyNote = document.getElementById("analysisEmpty");
  const chartsWrapper = document.getElementById("analysisChartsWrapper");

  if (!data.expenses || !data.expenses.length) {
    if (emptyNote) emptyNote.classList.remove("hidden");
    if (chartsWrapper) chartsWrapper.classList.add("hidden");
    return;
  }
  if (emptyNote) emptyNote.classList.add("hidden");
  if (chartsWrapper) chartsWrapper.classList.remove("hidden");

  const filteredExpenses = filterExpensesByTimeframe(data.expenses, currentAnalysisTimeframe);

  // 1. Update Analytic Highlights summary strip
  renderAnalyticHighlights(data, filteredExpenses);

  // 2. Spending by Category (Interactive Doughnut + Breakdown Matrix)
  renderCategoryDoughnut(filteredExpenses, tc);

  // 3. Monthly Income vs Expenses Trend
  renderTrendChart(data, tc);

  // 4. Daily Spending Velocity & Cumulative Burn Rate
  renderVelocityChart(data, tc);

  // 5. Spending by Day of the Week
  renderDayOfWeekChart(filteredExpenses, tc);

  // 6. Financial Health & 50/30/20 Compliance
  renderHealthScore(data, filteredExpenses);
}

function renderAnalyticHighlights(data, expenses) {
  const totalSpentEl = document.getElementById("anStatTotal");
  const dailyAvgEl = document.getElementById("anStatDailyAvg");
  const highestExpEl = document.getElementById("anStatHighest");
  const topCatEl = document.getElementById("anStatTopCat");

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  if (totalSpentEl) totalSpentEl.textContent = fmtMoney(total);

  // Calculate unique days with spend or days in range
  const days = Math.max(1, new Set(expenses.map((e) => e.date)).size);
  const dailyAvg = expenses.length ? total / days : 0;
  if (dailyAvgEl) dailyAvgEl.textContent = fmtMoney(dailyAvg);

  // Highest single expense
  const highest = expenses.length
    ? [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
    : null;
  if (highestExpEl) {
    highestExpEl.textContent = highest ? fmtMoney(highest.amount) : fmtMoney(0);
  }

  // Top category
  if (topCatEl) {
    if (!expenses.length) {
      topCatEl.textContent = "—";
    } else {
      const byCat = {};
      expenses.forEach((e) => {
        byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
      });
      const topCatPair = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      if (topCatPair) {
        const pct = Math.round((topCatPair[1] / (total || 1)) * 100);
        topCatEl.textContent = `${t(topCatPair[0])} (${pct}%)`;
      }
    }
  }
}

function renderCategoryDoughnut(expenses, tc) {
  const canvas = document.getElementById("categoryChart");
  const matrixContainer = document.getElementById("categoryMatrixList");
  const centerAmtEl = document.getElementById("catChartCenterAmount");
  const centerSubEl = document.getElementById("catChartCenterSub");

  if (!canvas) return;

  const byCat = {};
  let total = 0;
  expenses.forEach((e) => {
    const amt = Number(e.amount);
    byCat[e.category] = (byCat[e.category] || 0) + amt;
    total += amt;
  });

  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catKeys = sortedCats.map(([cat]) => cat);
  const catAmounts = sortedCats.map(([, amt]) => convertFromBase(amt));
  const catColors = catKeys.map((cat, idx) => getCategoryColor(cat, idx));

  if (centerAmtEl) centerAmtEl.textContent = fmtMoney(total);
  if (centerSubEl) centerSubEl.textContent = `${sortedCats.length} categories`;

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: catKeys.map((k) => t(k)),
      datasets: [{
        data: catAmounts.length ? catAmounts : [1],
        backgroundColor: catAmounts.length ? catColors : [tc.grid],
        borderWidth: 2,
        borderColor: tc.cardBg,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tc.cardBg,
          titleColor: tc.heading,
          bodyColor: tc.text,
          borderColor: tc.border,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label(ctx) {
              const val = ctx.raw || 0;
              const convertedTotal = convertFromBase(total);
              const pct = convertedTotal ? Math.round((val / convertedTotal) * 100) : 0;
              return ` ${ctx.label}: ${fmtMoney(val, { isDirect: true })} (${pct}%)`;
            },
          },
        },
      },
      animation: { duration: 600, easing: "easeOutQuart" },
    },
  });

  // Render Category Breakdown Matrix beside chart
  if (matrixContainer) {
    if (!sortedCats.length) {
      matrixContainer.innerHTML = `<div class="list-empty">No category data in this timeframe</div>`;
      return;
    }

    matrixContainer.innerHTML = sortedCats.map(([cat, amt], idx) => {
      const pct = total ? Math.round((amt / total) * 100) : 0;
      const color = getCategoryColor(cat, idx);
      const emoji = typeof categoryEmoji === "function" ? categoryEmoji(cat) : "🏷️";
      return `
        <div class="cat-matrix-item" data-cat-key="${cat}">
          <div class="cat-matrix-header">
            <div class="cat-matrix-left">
              <span class="cat-matrix-badge" style="background: ${color}22; color: ${color};">${emoji}</span>
              <span class="cat-matrix-name">${t(cat)}</span>
            </div>
            <div class="cat-matrix-right">
              <span class="cat-matrix-amt">${fmtMoney(amt)}</span>
              <span class="cat-matrix-pct">${pct}%</span>
            </div>
          </div>
          <div class="cat-matrix-bar-track">
            <div class="cat-matrix-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

function renderTrendChart(data, tc) {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const months = [];
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();

  if (currentAnalysisTimeframe === "year") {
    // Show months of current year: Jan to Dec (or through max recorded month)
    for (let m = 0; m <= 11; m++) {
      months.push(`${curY}-${String(m + 1).padStart(2, "0")}`);
    }
  } else if (currentAnalysisTimeframe === "all") {
    const allSet = new Set();
    (data.expenses || []).forEach((e) => {
      if (e.date) allSet.add(e.date.slice(0, 7));
    });
    // Ensure current month is included
    allSet.add(`${curY}-${String(curM + 1).padStart(2, "0")}`);
    const sorted = Array.from(allSet).sort();
    if (sorted.length < 6) {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(curY, curM - i, 1);
        sorted.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    }
    const uniqueSorted = Array.from(new Set(sorted)).sort();
    months.push(...uniqueSorted);
  } else {
    // Rolling 3 or 6 months ending at current month
    const numMonths = currentAnalysisTimeframe === "3m" ? 3 : 6;
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(curY, curM - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  }

  const expenseByMonth = {};
  data.expenses.forEach((e) => {
    const mk = (e.date || "").slice(0, 7);
    expenseByMonth[mk] = (expenseByMonth[mk] || 0) + Number(e.amount);
  });

  const monthLabels = months.map((m) => {
    const [y, mo] = m.split("-");
    // Day 15 avoids any local/UTC boundary shift
    return new Date(Number(y), Number(mo) - 1, 15).toLocaleDateString(undefined, { month: "short" });
  });

  const expenseValues = months.map((m) => convertFromBase(expenseByMonth[m] || 0));
  const incomeValues = months.map(() => convertFromBase(Number(data.income) || 0));

  if (trendChartInstance) trendChartInstance.destroy();

  const ctx = canvas.getContext("2d");
  const incomeGradient = ctx.createLinearGradient(0, 0, 0, 240);
  incomeGradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  incomeGradient.addColorStop(1, "rgba(16, 185, 129, 0.00)");

  const expenseGradient = ctx.createLinearGradient(0, 0, 0, 240);
  expenseGradient.addColorStop(0, "rgba(244, 63, 94, 0.35)");
  expenseGradient.addColorStop(1, "rgba(244, 63, 94, 0.00)");

  trendChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: t("dash_income"),
          data: incomeValues,
          borderColor: tc.incomeColor,
          backgroundColor: incomeGradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: tc.incomeColor,
          pointBorderColor: tc.cardBg,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: t("dash_expenses"),
          data: expenseValues,
          borderColor: tc.expenseColor,
          backgroundColor: expenseGradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: tc.expenseColor,
          pointBorderColor: tc.cardBg,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 4,
          right: 8,
          top: 6,
          bottom: 8,
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { color: tc.text, boxWidth: 12, usePointStyle: true, font: { size: 11, weight: 600 } },
        },
        tooltip: {
          backgroundColor: tc.cardBg,
          titleColor: tc.heading,
          bodyColor: tc.text,
          borderColor: tc.border,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label(ctx) {
              return ` ${ctx.dataset.label}: ${fmtMoney(ctx.raw, { isDirect: true })}`;
            },
            afterBody(tooltipItems) {
              if (tooltipItems.length >= 2) {
                const inc = tooltipItems[0].raw || 0;
                const exp = tooltipItems[1].raw || 0;
                const diff = inc - exp;
                const prefix = diff >= 0 ? "+ " : "- ";
                return `\nNet Savings: ${prefix}${fmtMoney(Math.abs(diff), { isDirect: true })}`;
              }
              return "";
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: tc.text, font: { size: 11, weight: 600 } },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: tc.text,
            font: { size: 10.5 },
            callback: (v) => {
              const cur = typeof getCurrency === "function" ? getCurrency() : { symbol: "$" };
              if (v >= 1000000) return `${cur.symbol}${(v / 1000000).toFixed(1)}M`;
              if (v >= 1000) return `${cur.symbol}${(v / 1000).toFixed(0)}k`;
              return `${cur.symbol}${v}`;
            },
          },
          grid: { color: tc.grid },
          beginAtZero: true,
        },
      },
      animation: { duration: 600, easing: "easeOutQuart" },
    },
  });
}

function renderVelocityChart(data, tc) {
  const canvas = document.getElementById("velocityChart");
  if (!canvas) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const labels = [];
  const idealPace = [];
  const actualCumulative = [];

  const income = convertFromBase(Number(data.income) || 0);
  const curMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const thisMonthExpenses = (data.expenses || []).filter((e) => (e.date || "").startsWith(curMonthKey));

  // Map daily totals in converted currency
  const dailySpend = {};
  thisMonthExpenses.forEach((e) => {
    const day = parseInt((e.date || "").slice(8, 10), 10);
    if (day) dailySpend[day] = (dailySpend[day] || 0) + convertFromBase(Number(e.amount));
  });

  let runningTotal = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(`${d}`);
    // Linear ideal budget spend
    idealPace.push(income ? (income / daysInMonth) * d : 0);

    if (d <= today) {
      runningTotal += dailySpend[d] || 0;
      actualCumulative.push(runningTotal);
    }
  }

  if (velocityChartInstance) velocityChartInstance.destroy();

  const ctx = canvas.getContext("2d");
  const velocityGrad = ctx.createLinearGradient(0, 0, 0, 200);
  velocityGrad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
  velocityGrad.addColorStop(1, "rgba(99, 102, 241, 0.00)");

  velocityChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual Spend",
          data: actualCumulative,
          borderColor: "#6366f1",
          backgroundColor: velocityGrad,
          fill: true,
          tension: 0.25,
          borderWidth: 2.5,
          pointBackgroundColor: "#6366f1",
          pointRadius: (ctx) => (ctx.dataIndex === actualCumulative.length - 1 ? 5 : 0),
          pointHoverRadius: 6,
        },
        {
          label: "Ideal Monthly Pace",
          data: idealPace,
          borderColor: tc.isLight ? "rgba(100, 116, 139, 0.45)" : "rgba(148, 163, 184, 0.35)",
          borderDash: [5, 5],
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: { color: tc.text, boxWidth: 12, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: tc.cardBg,
          titleColor: tc.heading,
          bodyColor: tc.text,
          borderColor: tc.border,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            title: (items) => `Day ${items[0].label} of ${daysInMonth}`,
            label: (ctx) => ` ${ctx.dataset.label}: ${fmtMoney(ctx.raw, { isDirect: true })}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: tc.text, maxTicksLimit: 15 },
          grid: { display: false },
        },
        y: {
          ticks: { color: tc.text, callback: (v) => fmtMoney(v, { isDirect: true }) },
          grid: { color: tc.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderDayOfWeekChart(expenses, tc) {
  const canvas = document.getElementById("dowChart");
  if (!canvas) return;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = [0, 0, 0, 0, 0, 0, 0];

  expenses.forEach((e) => {
    if (!e.date) return;
    const d = new Date(e.date + "T00:00:00");
    const dow = d.getDay();
    if (!isNaN(dow)) totals[dow] += convertFromBase(Number(e.amount));
  });

  if (dowChartInstance) dowChartInstance.destroy();

  const maxVal = Math.max(...totals, 1);
  const colors = totals.map((val) =>
    val === maxVal && val > 0 ? "#f43f5e" : tc.isLight ? "#6366f1" : "#818cf8"
  );

  dowChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{
        label: t("dash_expenses"),
        data: totals,
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tc.cardBg,
          titleColor: tc.heading,
          bodyColor: tc.text,
          borderColor: tc.border,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${fmtMoney(ctx.raw, { isDirect: true })}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: tc.text, font: { weight: 600 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: tc.text, callback: (v) => fmtMoney(v, { isDirect: true }) },
          grid: { color: tc.grid },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderHealthScore(data, expenses) {
  const scoreNumEl = document.getElementById("healthScoreNum");
  const scoreBadgeEl = document.getElementById("healthScoreBadge");
  const scoreMsgEl = document.getElementById("healthScoreMsg");
  const needsBar = document.getElementById("healthBarNeeds");
  const wantsBar = document.getElementById("healthBarWants");
  const saveBar = document.getElementById("healthBarSave");

  if (!scoreNumEl) return;

  const income = Number(data.income) || 0;
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);

  if (!income || income <= 0) {
    scoreNumEl.textContent = "—";
    if (scoreBadgeEl) scoreBadgeEl.textContent = "Set Income First";
    if (scoreMsgEl) scoreMsgEl.textContent = "Set your monthly income to unlock your financial health score and 50/30/20 breakdown.";
    return;
  }

  // Calculate Needs vs Wants vs Savings from categories
  let needsTotal = 0;
  let wantsTotal = 0;
  let familyTotal = 0;
  const needsCats = new Set([
    "cat_food", "cat_bills", "cat_transport", "cat_health",
    "cat_family", "cat_parents", "cat_family_support", "cat_household", "cat_rent", "cat_groceries_bills"
  ]);
  const familyCats = new Set([
    "cat_family", "cat_parents", "cat_family_support", "cat_household", "cat_rent", "cat_groceries_bills"
  ]);

  expenses.forEach((e) => {
    const amt = Number(e.amount);
    if (familyCats.has(e.category)) {
      familyTotal += amt;
    }
    if (needsCats.has(e.category)) {
      needsTotal += amt;
    } else {
      wantsTotal += amt;
    }
  });

  const actualSavings = Math.max(0, income - totalExp);
  const savingsPct = Math.round((actualSavings / income) * 100);
  const needsPct = Math.round((needsTotal / income) * 100);
  const wantsPct = Math.round((wantsTotal / income) * 100);

  // Health Score algorithm (0 - 100)
  let score = 50;
  if (savingsPct >= 20) score += 25;
  else if (savingsPct >= 10) score += 15;
  else score -= 15;

  if (needsPct <= 50) score += 15;
  else if (needsPct <= 65) score += 5;
  else score -= 10;

  if (wantsPct <= 30) score += 10;
  else score -= 10;

  if (data.goals && data.goals.length > 0) score += 5;

  score = Math.max(10, Math.min(100, score));

  scoreNumEl.textContent = score;

  let badgeText = "Fair";
  let badgeClass = "badge-amber";
  let advice = "Try to boost your savings rate towards 20% to achieve optimal financial health.";

  if (score >= 80) {
    badgeText = "Excellent";
    badgeClass = "badge-emerald";
    advice = "Your spending habits are well balanced and aligned with the 50/30/20 standard!";
  } else if (score >= 65) {
    badgeText = "Good";
    badgeClass = "badge-indigo";
    advice = "Solid financial balance. Keep trimming discretionary spending to hit your savings goals faster.";
  } else if (score < 50) {
    badgeText = "Needs Attention";
    badgeClass = "badge-rose";
    advice = "Your expenses are taking up too high a share of your income. Look into reducing high category items.";
  }

  if (familyTotal > 0 && income > 0) {
    const famPct = Math.round((familyTotal / income) * 100);
    advice += ` Family support represents ${famPct}% (${fmtMoney(familyTotal)}) of your income.`;
  }

  if (scoreBadgeEl) {
    scoreBadgeEl.textContent = badgeText;
    scoreBadgeEl.className = `health-score-badge ${badgeClass}`;
  }
  if (scoreMsgEl) scoreMsgEl.textContent = advice;

  // Update mini 50/30/20 bars
  if (needsBar) needsBar.style.width = `${Math.min(100, needsPct)}%`;
  if (wantsBar) wantsBar.style.width = `${Math.min(100, wantsPct)}%`;
  if (saveBar) saveBar.style.width = `${Math.min(100, savingsPct)}%`;
}

// Timeframe switcher listener
document.addEventListener("DOMContentLoaded", () => {
  const timeframeButtons = document.querySelectorAll("[data-timeframe]");
  timeframeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      timeframeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentAnalysisTimeframe = btn.dataset.timeframe;
      renderCharts();
    });
  });
});

window.renderCharts = renderCharts;
