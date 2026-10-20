/**
 * Smart AI Financial Copilot
 * Context-aware wealth advisor analyzing live income, expenses, 50/30/20 splits,
 * savings goals, and real-time forex trends.
 */

(function () {
  let chatHistory = [];

  function getFinancialContext() {
    const d = typeof getData === "function" ? getData() : { income: 0, expenses: [], goals: [] };
    const cur = typeof getCurrency === "function" ? getCurrency() : { code: "USD", symbol: "$" };
    const rate = typeof getExchangeRate === "function" ? getExchangeRate(cur.code) : 1.0;
    const rateText = typeof getRatesLastUpdatedText === "function" ? getRatesLastUpdatedText() : "Market rates active";

    const incomeBase = Number(d.income) || 0;
    const incomeConverted = typeof convertFromBase === "function" ? convertFromBase(incomeBase) : incomeBase;

    const now = new Date();
    const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = Math.max(1, daysInMonth - dayOfMonth);

    const monthExpenses = (d.expenses || []).filter((e) => (e.date || "").startsWith(curMonthKey));
    const totalExpBase = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExpConverted = typeof convertFromBase === "function" ? convertFromBase(totalExpBase) : totalExpBase;

    const surplusBase = Math.max(0, incomeBase - totalExpBase);
    const surplusConverted = typeof convertFromBase === "function" ? convertFromBase(surplusBase) : surplusBase;

    const safeDailySpend = daysLeft > 0 ? surplusConverted / daysLeft : 0;
    const burnPct = incomeBase > 0 ? Math.round((totalExpBase / incomeBase) * 100) : 0;

    // Categories Breakdown
    const byCat = {};
    monthExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0);
    });

    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0] || null;

    // 50/30/20 Breakdown
    const needsCats = new Set(["cat_food", "cat_bills", "cat_transport", "cat_health"]);
    let needsBase = 0;
    let wantsBase = 0;
    monthExpenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      if (needsCats.has(e.category)) needsBase += amt;
      else wantsBase += amt;
    });

    const needsPct = incomeBase > 0 ? Math.round((needsBase / incomeBase) * 100) : 0;
    const wantsPct = incomeBase > 0 ? Math.round((wantsBase / incomeBase) * 100) : 0;
    const savingsPct = incomeBase > 0 ? Math.max(0, 100 - (needsPct + wantsPct)) : 0;

    return {
      d,
      cur,
      rate,
      rateText,
      incomeBase,
      incomeConverted,
      totalExpBase,
      totalExpConverted,
      surplusBase,
      surplusConverted,
      daysLeft,
      daysInMonth,
      dayOfMonth,
      safeDailySpend,
      burnPct,
      sortedCats,
      topCat,
      needsPct,
      wantsPct,
      savingsPct,
      goals: d.goals || [],
    };
  }

  function generateDashboardInsights() {
    const ctx = getFinancialContext();
    const insights = [];

    // 1. Cashflow & Burn Velocity
    if (!ctx.incomeBase || ctx.incomeBase <= 0) {
      insights.push({
        type: "amber",
        icon: "💡",
        title: "Income Baseline Required",
        desc: "Set your monthly recurring income to activate real-time budget burn tracking and daily allowances.",
      });
    } else if (ctx.burnPct > 100) {
      insights.push({
        type: "rose",
        icon: "🚨",
        title: "Budget Deficit Warning",
        desc: `You have spent ${ctx.burnPct}% of your income this month (${fmtMoney(ctx.totalExpBase - ctx.incomeBase)} over baseline). Reduce non-essential spending.`,
      });
    } else if (ctx.burnPct > 75 && ctx.daysLeft > 10) {
      insights.push({
        type: "amber",
        icon: "⚠️",
        title: "High Burn Velocity",
        desc: `You've used ${ctx.burnPct}% of budget with ${ctx.daysLeft} days remaining. Safe daily spend limit: ${fmtMoney(ctx.safeDailySpend, { isDirect: true })}/day.`,
      });
    } else {
      insights.push({
        type: "emerald",
        icon: "🛡️",
        title: "Healthy Cashflow Pace",
        desc: `Safe daily allowance is ${fmtMoney(ctx.safeDailySpend, { isDirect: true })}/day for the next ${ctx.daysLeft} days. Projected surplus: ${fmtMoney(ctx.surplusBase)}.`,
      });
    }

    // 2. Spending Leakage / Category Alert
    if (ctx.topCat) {
      const topName = typeof t === "function" ? t(ctx.topCat[0]) : ctx.topCat[0];
      const topAmtConverted = typeof convertFromBase === "function" ? convertFromBase(ctx.topCat[1]) : ctx.topCat[1];
      const catPct = ctx.totalExpBase > 0 ? Math.round((ctx.topCat[1] / ctx.totalExpBase) * 100) : 0;
      const cut10 = topAmtConverted * 0.10;

      insights.push({
        type: catPct > 35 ? "rose" : "indigo",
        icon: "🍽️",
        title: `${topName} Dominates Spending (${catPct}%)`,
        desc: `Total spent: ${fmtMoney(topAmtConverted, { isDirect: true })}. A modest 10% trim in this category saves ${fmtMoney(cut10, { isDirect: true })} this month.`,
      });
    }

    // 3. Goal Progress & Milestones
    if (ctx.goals && ctx.goals.length > 0) {
      const primaryGoal = ctx.goals[0];
      const goalPct = Math.min(100, Math.round(((primaryGoal.saved || 0) / (primaryGoal.target || 1)) * 100));
      const remainingConverted = typeof convertFromBase === "function"
        ? convertFromBase(Math.max(0, primaryGoal.target - primaryGoal.saved))
        : Math.max(0, primaryGoal.target - primaryGoal.saved);

      insights.push({
        type: goalPct >= 100 ? "emerald" : "indigo",
        icon: primaryGoal.icon || "🎯",
        title: `${primaryGoal.name} (${goalPct}%)`,
        desc: goalPct >= 100
          ? "🎉 Goal milestone 100% reached! Consider creating a new milestone or investing surplus."
          : `${fmtMoney(remainingConverted, { isDirect: true })} left to reach target. Small weekly deposits accelerate completion.`,
      });
    } else {
      insights.push({
        type: "indigo",
        icon: "🎯",
        title: "No Active Savings Goals",
        desc: "Creating target milestones increases saving discipline by 42%. Add your first goal in the Savings tab.",
      });
    }

    // 4. Forex Market Trend Intelligence
    if (ctx.cur.code !== "USD") {
      const trend = typeof getCurrencyTrendData === "function" ? getCurrencyTrendData(ctx.cur.code) : { trend30d: 0, range3m: "Stable" };
      const dirSymbol = trend.trend30d >= 0 ? "↗ +" : "↘ ";
      insights.push({
        type: "indigo",
        icon: "💱",
        title: `Market Forex: ${ctx.cur.code} (${dirSymbol}${trend.trend30d}% 30d)`,
        desc: `1 USD = ${ctx.rate.toFixed(ctx.cur.code === 'JPY' ? 1 : 2)} ${ctx.cur.code}. 3-mo range: ${trend.range3m}. Calculations adapt to live market trends (${ctx.rateText}).`,
      });
    }

    return insights;
  }

  function renderAICopilotCard() {
    const listEl = document.getElementById("aiInsightsList");
    if (!listEl) return;

    const insights = generateDashboardInsights();
    listEl.innerHTML = insights.map((item) => `
      <div class="ai-insight-card ai-insight-${item.type}">
        <div class="ai-insight-top">
          <span class="ai-insight-icon">${item.icon}</span>
          <div class="ai-insight-title">${item.title}</div>
        </div>
        <div class="ai-insight-desc">${item.desc}</div>
      </div>
    `).join("");

    const subtitleEl = document.getElementById("aiStatusSubtitle");
    if (subtitleEl) {
      const ctx = getFinancialContext();
      if (!ctx.incomeBase) {
        subtitleEl.textContent = "Awaiting income baseline";
      } else if (ctx.burnPct > 100) {
        subtitleEl.textContent = "Deficit detected · Action needed";
        subtitleEl.style.color = "var(--rose)";
      } else {
        subtitleEl.textContent = `Pacing healthy · Safe daily: ${fmtMoney(ctx.safeDailySpend, { isDirect: true })}/day`;
        subtitleEl.style.color = "var(--emerald)";
      }
    }
  }

  function answerFinancialQuery(query) {
    const q = (query || "").toLowerCase().trim();
    const ctx = getFinancialContext();

    // 1. How to save more / 15% budget cut
    if (q.includes("save") || q.includes("cut") || q.includes("reduce") || q === "save_more" || q === "cut_budget") {
      const cutPct = q.includes("15") || q === "cut_budget" ? 0.15 : 0.10;
      const cutPctLabel = Math.round(cutPct * 100);

      if (!ctx.sortedCats.length) {
        return `
          <strong>💡 Smart Savings Strategy</strong><br><br>
          You haven't logged any expenses yet. Once you add transactions, I will analyze your discretionary leaks and construct a customized savings plan.<br><br>
          <em>Tip: Click <strong>⚡ Load Sample Data</strong> in the top header to preview a realistic financial portfolio.</em>
        `;
      }

      let potentialSavings = 0;
      const planItems = ctx.sortedCats.slice(0, 3).map(([cat, amt]) => {
        const amtConv = convertFromBase(amt);
        const saving = amtConv * cutPct;
        potentialSavings += saving;
        const name = typeof t === "function" ? t(cat) : cat;
        return `• <strong>${name}</strong>: Current spend is ${fmtMoney(amtConv, { isDirect: true })}. A ${cutPctLabel}% optimization frees <strong>${fmtMoney(saving, { isDirect: true })}</strong>.`;
      });

      return `
        <strong>💡 ${cutPctLabel}% Budget Optimization Blueprint</strong><br><br>
        Based on your current monthly expenditures, here is a targeted 3-point strategy to generate an extra <strong>${fmtMoney(potentialSavings, { isDirect: true })}</strong> this month:<br><br>
        ${planItems.join("<br>")}<br><br>
        📈 <strong>Impact:</strong> Reallocating this ${fmtMoney(potentialSavings, { isDirect: true })} into your active savings goals or emergency reserve boosts your net surplus by <strong>+${cutPctLabel}%</strong> without sacrificing essentials!
      `;
    }

    // 2. Spending Leakage / Top Spend
    if (q.includes("leak") || q.includes("dining") || q.includes("top") || q.includes("food") || q === "analyze_top") {
      if (!ctx.topCat) {
        return "No spending data found for this month. Add some expenses to inspect category distribution!";
      }
      const topName = typeof t === "function" ? t(ctx.topCat[0]) : ctx.topCat[0];
      const topAmt = convertFromBase(ctx.topCat[1]);
      const pct = ctx.totalExpBase > 0 ? Math.round((ctx.topCat[1] / ctx.totalExpBase) * 100) : 0;

      return `
        <strong>🔍 Category Leakage Analysis: ${topName}</strong><br><br>
        • <strong>Monthly Allocation:</strong> ${fmtMoney(topAmt, { isDirect: true })} (${pct}% of all expenses).<br>
        • <strong>Financial Benchmark:</strong> Financial experts recommend keeping non-grocery food and discretionary categories under <strong>15–20%</strong> of net income.<br>
        • <strong>Recommended Action:</strong> Setting a weekly allowance of ${fmtMoney(topAmt / 4.3, { isDirect: true })} will prevent month-end budget pressure while keeping dining enjoyable.
      `;
    }

    // 3. Forex Trends, Fluctuation & Market Trend Intelligence
    if (q.includes("forex") || q.includes("currency") || q.includes("market") || q.includes("exchange") || q.includes("fluctuat") || q.includes("dollar") || q.includes("rupee") || q.includes("euro") || q.includes("rate") || q === "forex_trends") {
      const cur = ctx.cur;
      const rate = ctx.rate;
      const isBase = cur.code === "USD";
      const trend = typeof getCurrencyTrendData === "function" ? getCurrencyTrendData(cur.code) : { trend30d: 0, trend6m: 0, range3m: "Stable", volatility: "Low", macroDriver: "Market stability" };
      const isUp = trend.trend30d >= 0;
      const fluShift = ctx.incomeConverted > 0 ? fmtMoney(ctx.incomeConverted * 0.03, { isDirect: true }) : fmtMoney(150);

      if (q.includes("goal") || q.includes("target") || q.includes("save")) {
        const primaryGoal = ctx.goals && ctx.goals[0] ? ctx.goals[0] : null;
        const targetVal = primaryGoal ? convertFromBase(primaryGoal.target) : 0;
        const bufferAmt = targetVal * 0.05;
        return `
          <strong>💱 Currency Fluctuation Impact on Savings Goals</strong><br><br>
          • <strong>Active Currency:</strong> ${cur.label} (${isBase ? 'USD Anchor' : `1 USD = ${rate.toFixed(cur.code === 'JPY' ? 1 : 2)} ${cur.code}`})<br>
          • <strong>Macro Trend (30d / 6m):</strong> <span style="color: ${isUp ? 'var(--rose)' : 'var(--emerald)'}; font-weight: 700;">${isUp ? '↗ +' : '↘ '}${trend.trend30d}% (30d)</span> · ${trend.trend6m >= 0 ? '+' : ''}${trend.trend6m}% (6m)<br>
          • <strong>3-Month Range:</strong> ${trend.range3m} (${trend.volatility} volatility)<br><br>
          🎯 <strong>Goal Protection Analysis:</strong><br>
          ${primaryGoal 
            ? `For your target <strong>"${primaryGoal.name}"</strong> (${fmtMoney(targetVal, { isDirect: true })}), currency movements over a 6 to 12 month horizon can alter real purchasing power by <strong>±3% to 5% (approx. ${fmtMoney(bufferAmt, { isDirect: true })})</strong>.` 
            : `For any multi-month savings target, macroeconomic shifts between currencies create a purchasing variance of <strong>±3% to 5%</strong>.`
          }<br><br>
          🛡️ <strong>Recommended Shielding Strategy:</strong><br>
          1. <strong>Add a 5% Fluctuation Buffer:</strong> Factor an extra 5% buffer into your goal targets so macro currency dips never leave you short.<br>
          2. <strong>Track Live Trends:</strong> Click <strong>📈 Trends</strong> in the top header or tap <em>Sync Live Rates</em> to maintain synchronization with global open markets.
        `;
      }

      return `
        <strong>💱 Market & Forex Intelligence (${cur.code})</strong><br><br>
        • <strong>Active Rate:</strong> ${isBase ? "1.00 USD (Base Anchor)" : `1 USD = ${rate.toFixed(cur.code === 'JPY' ? 1 : 2)} ${cur.code}`}<br>
        • <strong>30-Day Trend:</strong> <span style="color: ${isUp ? 'var(--rose)' : 'var(--emerald)'}; font-weight: 700;">${isUp ? '↗ +' : '↘ '}${trend.trend30d}%</span><br>
        • <strong>6-Month Macro Cycle:</strong> ${trend.trend6m >= 0 ? '+' : ''}${trend.trend6m}% (Range: ${trend.range3m})<br>
        • <strong>Market Volatility:</strong> ${trend.volatility}<br>
        • <strong>Macro Driver:</strong> ${trend.macroDriver}<br><br>
        📈 <strong>How Market Fluctuations Impact Your Wealth:</strong><br>
        Exchange rates stay stable for certain windows but shift over months based on inflation differentials and central bank policy. If ${cur.code} moves by <strong>±3%</strong>, your monthly purchasing power shifts by approximately <strong>±${fluShift}</strong>.<br><br>
        🛡️ <strong>Recommended Action:</strong><br>
        1. Click <strong>📈 Market Trends</strong> in the topbar or tap <em>Sync Live Rates</em> to stay aligned with current open markets.<br>
        2. When planning goals exceeding 6 months, add a <strong>3–5% currency buffer</strong> to safeguard your targets against macro fluctuations.
      `;
    }

    // 4. Goals Acceleration
    if (q.includes("goal") || q.includes("target") || q === "goals_plan") {
      if (!ctx.goals || !ctx.goals.length) {
        return "You don't have any savings goals active. Visit the <strong>Savings</strong> tab to create one (e.g. Emergency Fund or Vacation), and I'll track your completion runway!";
      }

      const g = ctx.goals[0];
      const targetConv = convertFromBase(g.target);
      const savedConv = convertFromBase(g.saved || 0);
      const remConv = Math.max(0, targetConv - savedConv);
      const pct = Math.min(100, Math.round((savedConv / targetConv) * 100));

      return `
        <strong>🎯 Goal Accelerator: ${g.name}</strong><br><br>
        • <strong>Current Status:</strong> ${fmtMoney(savedConv, { isDirect: true })} of ${fmtMoney(targetConv, { isDirect: true })} funded (${pct}%).<br>
        • <strong>Remaining:</strong> ${fmtMoney(remConv, { isDirect: true })}.<br>
        • <strong>Runway Recommendation:</strong> Contributing <strong>${fmtMoney(remConv / 3, { isDirect: true })}/month</strong> achieves this goal in just <strong>90 days</strong>!
      `;
    }

    // 5. Full Financial Health Audit
    if (q.includes("audit") || q.includes("health") || q.includes("overview") || q === "audit") {
      const score = Math.max(0, Math.min(100, 100 - (ctx.burnPct > 50 ? (ctx.burnPct - 50) * 1.5 : 0)));
      const grade = score >= 85 ? "🟢 Exceptional" : score >= 70 ? "🟡 Good (Minor Tuning Needed)" : "🔴 Caution Needed";

      return `
        <strong>📊 Comprehensive 360° Financial Audit</strong><br><br>
        • <strong>Health Score:</strong> ${Math.round(score)}/100 (${grade})<br>
        • <strong>Income Baseline:</strong> ${fmtMoney(ctx.incomeConverted, { isDirect: true })}<br>
        • <strong>Total Spent:</strong> ${fmtMoney(ctx.totalExpConverted, { isDirect: true })} (${ctx.burnPct}% burn)<br>
        • <strong>Unspent Surplus:</strong> ${fmtMoney(ctx.surplusConverted, { isDirect: true })}<br>
        • <strong>Safe Daily Allowance:</strong> ${fmtMoney(ctx.safeDailySpend, { isDirect: true })}/day (${ctx.daysLeft} days remaining)<br>
        • <strong>50/30/20 Distribution:</strong> Needs: ${ctx.needsPct}% (Goal <50%), Wants: ${ctx.wantsPct}% (Goal <30%), Savings: ${ctx.savingsPct}% (Goal >20%).<br><br>
        💡 <strong>Key Takeaway:</strong> ${ctx.surplusBase > 0 ? "You are generating a net positive surplus. Direct at least 50% of your remaining surplus into target savings goals to maximize compound growth!" : "Cut discretionary expenses immediately to avoid tapping into emergency funds."}
      `;
    }

    // 6. Affordability check (e.g., "Can I afford $200?")
    const numMatch = q.match(/([0-9,.]+)/);
    if (q.includes("afford") || q.includes("buy")) {
      const askedAmt = numMatch ? parseFloat(numMatch[1].replace(/,/g, "")) : null;
      if (askedAmt) {
        const canAfford = ctx.surplusConverted >= askedAmt;
        const remainingAfter = ctx.surplusConverted - askedAmt;
        return `
          <strong>🛍️ Purchase Feasibility Evaluation</strong><br><br>
          • <strong>Proposed Item:</strong> ${fmtMoney(askedAmt, { isDirect: true })}<br>
          • <strong>Available Monthly Surplus:</strong> ${fmtMoney(ctx.surplusConverted, { isDirect: true })}<br><br>
          ${canAfford
            ? `✅ <strong>Approved:</strong> You can safely afford this purchase! After buying, your unspent surplus will be <strong>${fmtMoney(remainingAfter, { isDirect: true })}</strong>, leaving a safe daily budget of <strong>${fmtMoney(remainingAfter / ctx.daysLeft, { isDirect: true })}/day</strong>.`
            : `⚠️ <strong>Caution:</strong> This purchase exceeds your safe monthly surplus by <strong>${fmtMoney(Math.abs(remainingAfter), { isDirect: true })}</strong>. Making this purchase now would cause a budget deficit or dip into savings reserves.`
          }
        `;
      }
    }

    // Default intelligent response
    return `
      <strong>✦ AI Financial Copilot</strong><br><br>
      I analyzed your live financial records (${fmtMoney(ctx.incomeConverted, { isDirect: true })} income, ${fmtMoney(ctx.totalExpConverted, { isDirect: true })} spent this month in ${ctx.cur.code}).<br><br>
      You can ask me specific questions such as:<br>
      • <em>"How can I save ${fmtMoney(150)} this month?"</em><br>
      • <em>"Can I afford a ${fmtMoney(250)} purchase?"</em><br>
      • <em>"Analyze my dining expenses"</em><br>
      • <em>"Give me a full financial audit"</em><br><br>
      Or click any of the quick prompt buttons below!
    `;
  }

  function openAICopilotModal(initialQuery = null) {
    const modal = document.getElementById("aiAdvisorModal");
    const thread = document.getElementById("aiChatThread");
    const pill = document.getElementById("aiModalContextPill");
    if (!modal || !thread) return;

    const ctx = getFinancialContext();
    if (pill) {
      pill.textContent = `Analyzing ${ctx.cur.code} · ${ctx.rateText}`;
    }

    modal.classList.remove("hidden");

    if (chatHistory.length === 0) {
      chatHistory.push({
        sender: "ai",
        text: `Hello! I am your <strong>Personal Financial Copilot</strong>. I monitor your live cashflow, budget burn rate, 50/30/20 compliance, and forex market trends.<br><br>How can I assist your financial goals today?`,
      });
    }

    if (initialQuery) {
      chatHistory.push({ sender: "user", text: initialQuery });
      const answer = answerFinancialQuery(initialQuery);
      chatHistory.push({ sender: "ai", text: answer });
    }

    renderChatThread();
  }

  function closeAICopilotModal() {
    const modal = document.getElementById("aiAdvisorModal");
    if (modal) modal.classList.add("hidden");
  }

  function renderChatThread() {
    const thread = document.getElementById("aiChatThread");
    if (!thread) return;

    thread.innerHTML = chatHistory.map((m) => `
      <div class="ai-chat-bubble ${m.sender}">
        ${m.sender === "ai" ? '<div class="bubble-avatar">✦</div>' : ''}
        <div class="bubble-content">${m.text}</div>
      </div>
    `).join("");

    requestAnimationFrame(() => {
      thread.scrollTop = thread.scrollHeight;
    });
    setTimeout(() => {
      thread.scrollTop = thread.scrollHeight;
    }, 60);
  }

  function initAICopilot() {
    renderAICopilotCard();

    // Bind card "Ask Copilot" button
    const openBtn = document.getElementById("openAiModalBtn");
    if (openBtn) {
      openBtn.addEventListener("click", () => openAICopilotModal());
    }

    // Bind close modal button
    const closeBtn = document.getElementById("closeAiModalBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeAICopilotModal);
    }

    // Bind prompt chips in card
    document.querySelectorAll("[data-ai-prompt]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const promptKey = chip.dataset.aiPrompt;
        openAICopilotModal(promptKey);
      });
    });

    // Bind prompt chips inside modal
    document.querySelectorAll("[data-ai-modal-prompt]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const promptKey = chip.dataset.aiModalPrompt;
        chatHistory.push({ sender: "user", text: chip.textContent.trim() });
        const ans = answerFinancialQuery(promptKey);
        chatHistory.push({ sender: "ai", text: ans });
        renderChatThread();
      });
    });

    // Bind chat form submit
    const chatForm = document.getElementById("aiChatForm");
    const chatInput = document.getElementById("aiChatInput");
    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;

        chatHistory.push({ sender: "user", text: query });
        chatInput.value = "";
        renderChatThread();

        setTimeout(() => {
          const answer = answerFinancialQuery(query);
          chatHistory.push({ sender: "ai", text: answer });
          renderChatThread();
        }, 200);
      });
    }

    // Refresh on currency change
    const oldOnCurr = window.onCurrencyChange;
    window.onCurrencyChange = () => {
      if (oldOnCurr) oldOnCurr();
      renderAICopilotCard();
    };
  }

  document.addEventListener("DOMContentLoaded", initAICopilot);

  window.renderAICopilotCard = renderAICopilotCard;
  window.openAICopilotModal = openAICopilotModal;
})();
