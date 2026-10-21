const BASE_CURRENCY = "USD";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)", rate: 1.0, trend30d: 0.0, trend6m: 0.0, range3m: "1.00 - 1.00", volatility: "Anchor Base", macroDriver: "Global reserve currency benchmark" },
  { code: "INR", symbol: "₹", label: "INR (₹)", rate: 83.50, trend30d: +0.45, trend6m: +1.15, range3m: "82.80 - 83.75", volatility: "Low-Mod", macroDriver: "Crude oil import pricing & RBI liquidity operations" },
  { code: "EUR", symbol: "€", label: "EUR (€)", rate: 0.92, trend30d: -0.65, trend6m: -1.20, range3m: "0.91 - 0.94", volatility: "Moderate", macroDriver: "ECB interest rate policy & Eurozone manufacturing shifts" },
  { code: "GBP", symbol: "£", label: "GBP (£)", rate: 0.79, trend30d: +0.30, trend6m: +0.75, range3m: "0.78 - 0.81", volatility: "Moderate", macroDriver: "Bank of England policy stance & UK inflation print" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)", rate: 154.50, trend30d: +2.10, trend6m: +4.80, range3m: "148.0 - 158.2", volatility: "High", macroDriver: "Bank of Japan yield curve control & interest differential" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)", rate: 1.52, trend30d: -0.40, trend6m: +1.20, range3m: "1.50 - 1.56", volatility: "Moderate", macroDriver: "Commodity export demand (iron ore/metals) & China trade" },
  { code: "CAD", symbol: "C$", label: "CAD (C$)", rate: 1.38, trend30d: +0.50, trend6m: +1.60, range3m: "1.35 - 1.40", volatility: "Low-Mod", macroDriver: "North American energy pricing & US-Canada trade correlation" },
  { code: "SGD", symbol: "S$", label: "SGD (S$)", rate: 1.35, trend30d: -0.15, trend6m: +0.20, range3m: "1.34 - 1.36", volatility: "Low", macroDriver: "MAS monetary exchange band policy & regional trade stability" },
  { code: "AED", symbol: "AED", label: "AED (د.إ)", rate: 3.67, trend30d: 0.0, trend6m: 0.0, range3m: "3.67 - 3.67", volatility: "Pegged", macroDriver: "Officially pegged to USD by UAE Central Bank" },
  { code: "CHF", symbol: "CHF", label: "CHF (Fr)", rate: 0.90, trend30d: -0.80, trend6m: -1.50, range3m: "0.89 - 0.92", volatility: "Moderate", macroDriver: "Global safe-haven currency demand & Swiss National Bank policy" },
];

function getCurrencyTrendData(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

function getExchangeRate(code) {
  if (code === BASE_CURRENCY) return 1.0;
  try {
    const cached = JSON.parse(localStorage.getItem("ledger_exchange_rates") || "{}");
    if (cached && typeof cached[code] === "number" && cached[code] > 0) {
      return cached[code];
    }
  } catch {
    // ignore
  }
  const found = CURRENCIES.find((c) => c.code === code);
  return found ? found.rate : 1.0;
}

function getCurrency() {
  const code = localStorage.getItem("ledger_currency") || "USD";
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

function setCurrency(code) {
  localStorage.setItem("ledger_currency", code);
  syncCurrencySelects();
  updateRateBadges();
}

/**
 * Precision-safe rounding to prevent IEEE 754 floating point distortion (e.g. 0.1 + 0.2 != 0.3)
 */
function roundMoney(num, decimals = 2) {
  if (typeof num !== "number" || isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Converts a base USD amount into the target currency (defaults to active currency).
 */
function convertFromBase(amountInUSD, targetCode = null) {
  const code = targetCode || getCurrency().code;
  if (code === BASE_CURRENCY) return roundMoney(Number(amountInUSD) || 0, 2);
  const rate = getExchangeRate(code);
  const result = (Number(amountInUSD) || 0) * rate;
  return roundMoney(result, code === "JPY" ? 0 : 2);
}

/**
 * Converts an amount entered in the source currency back into base USD.
 */
function convertToBase(amountInCurrency, sourceCode = null) {
  const code = sourceCode || getCurrency().code;
  if (code === BASE_CURRENCY) return roundMoney(Number(amountInCurrency) || 0, 2);
  const rate = getExchangeRate(code);
  if (!rate || rate <= 0) return roundMoney(Number(amountInCurrency) || 0, 2);
  return roundMoney((Number(amountInCurrency) || 0) / rate, 4);
}

/**
 * Formats a monetary value.
 * By default, assumes amount is in base USD and converts to the active currency.
 * Pass options.isDirect = true if amount has already been converted.
 */
function fmtMoney(amount, options = {}) {
  const cur = getCurrency();
  const targetCode = options.currency || cur.code;
  const isDirect = Boolean(options.isDirect);

  const numVal = isDirect ? Number(amount) || 0 : convertFromBase(amount, targetCode);
  const isJpy = targetCode === "JPY";

  const formatted = numVal.toLocaleString(undefined, {
    minimumFractionDigits: isJpy ? 0 : 2,
    maximumFractionDigits: isJpy ? 0 : 2,
  });

  const cObj = CURRENCIES.find((c) => c.code === targetCode) || cur;
  return `${cObj.symbol} ${formatted}`;
}

function updateRateBadges() {
  const cur = getCurrency();
  const rate = getExchangeRate(cur.code);
  const trend = getCurrencyTrendData(cur.code);
  const text = cur.code === "USD" ? "Base Currency (1.00)" : `1 USD = ${rate.toFixed(cur.code === 'JPY' ? 1 : 2)} ${cur.code}`;
  
  document.querySelectorAll(".active-rate-indicator").forEach((el) => {
    el.textContent = text;
  });

  document.querySelectorAll(".forex-trend-indicator").forEach((el) => {
    if (cur.code === "USD") {
      el.textContent = "USD Anchor";
      el.className = "forex-trend-indicator trend-neutral";
    } else {
      const isUp = trend.trend30d >= 0;
      el.textContent = `${isUp ? "↗ +" : "↘ "}${trend.trend30d}% (30d)`;
      el.className = `forex-trend-indicator ${isUp ? "trend-up" : "trend-down"}`;
    }
  });
}

function syncCurrencySelects() {
  const code = getCurrency().code;
  const selects = document.querySelectorAll("#currencySelect, .currency-sync-select");
  selects.forEach((sel) => {
    if (sel && sel.value !== code) {
      sel.value = code;
    }
  });
}

function populateCurrencySelect() {
  const selects = document.querySelectorAll("#currencySelect, .currency-sync-select");
  selects.forEach((select) => {
    if (!select) return;
    select.innerHTML = CURRENCIES.map(
      (c) => `<option value="${c.code}">${c.label}</option>`
    ).join("");
    select.value = getCurrency().code;
    select.addEventListener("change", (e) => {
      setCurrency(e.target.value);
      if (window.onCurrencyChange) window.onCurrencyChange();
    });
  });
  updateRateBadges();
}

function getRatesLastUpdatedText() {
  const ts = localStorage.getItem("ledger_rates_last_updated");
  if (!ts) return "Market rates active";
  const diffMinutes = Math.floor((Date.now() - Number(ts)) / 60000);
  if (diffMinutes < 1) return "Live rates (just updated)";
  if (diffMinutes < 60) return `Live rates (${diffMinutes}m ago)`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Live rates (${diffHours}h ago)`;
  return `Market rates (${new Date(Number(ts)).toLocaleDateString()})`;
}

/**
 * Refresh live market rates from public API with fallback.
 */
function refreshMarketRates(isManual = false) {
  const badge = document.querySelector(".active-rate-indicator");
  if (badge && isManual) badge.textContent = "Updating rates...";

  return fetch("https://open.er-api.com/v6/latest/USD")
    .then((r) => r.json())
    .then((data) => {
      if (data && data.rates) {
        const rates = {};
        CURRENCIES.forEach((c) => {
          if (data.rates[c.code]) {
            rates[c.code] = data.rates[c.code];
          }
        });
        localStorage.setItem("ledger_exchange_rates", JSON.stringify(rates));
        localStorage.setItem("ledger_rates_last_updated", String(Date.now()));
        updateRateBadges();
        if (window.onCurrencyChange) window.onCurrencyChange();
        renderForexTrendsModalContent();
        if (isManual) {
          alert(`✅ Market rates updated to latest trends! (${getRatesLastUpdatedText()})`);
        }
      }
    })
    .catch((err) => {
      if (isManual) {
        alert("Using reliable built-in market rates (offline mode).");
      }
    });
}

function tryRefreshLiveRates() {
  const lastTs = Number(localStorage.getItem("ledger_rates_last_updated") || 0);
  // Auto-refresh if rates are older than 6 hours
  if (!lastTs || Date.now() - lastTs > 6 * 3600 * 1000) {
    refreshMarketRates(false);
  } else {
    updateRateBadges();
  }
}

function renderForexTrendsModalContent() {
  const container = document.getElementById("forexTrendsModalBody");
  if (!container) return;

  const cur = getCurrency();
  const rate = getExchangeRate(cur.code);
  const trend = getCurrencyTrendData(cur.code);
  const updatedText = getRatesLastUpdatedText();

  container.innerHTML = `
    <div class="forex-modal-header-hero">
      <div class="forex-code-badge">${cur.code}</div>
      <div>
        <h4 style="margin: 0; font-size: 19px; font-weight: 800;">${cur.label}</h4>
        <div style="font-size: 12.5px; color: var(--text-dim); margin-top: 2px;">
          ${cur.code === 'USD' ? 'Global Benchmark Currency' : `1 USD = ${rate.toFixed(cur.code === 'JPY' ? 1 : 2)} ${cur.code} (${updatedText})`}
        </div>
      </div>
    </div>

    <div class="forex-stats-grid">
      <div class="forex-stat-card">
        <span class="forex-stat-label">30-Day Trend</span>
        <span class="forex-stat-val ${trend.trend30d >= 0 ? 'val-up' : 'val-down'}">
          ${trend.trend30d >= 0 ? '↗ +' : '↘ '}${trend.trend30d}%
        </span>
        <span class="forex-stat-sub">Short-term market shift</span>
      </div>
      <div class="forex-stat-card">
        <span class="forex-stat-label">6-Month Trend</span>
        <span class="forex-stat-val ${trend.trend6m >= 0 ? 'val-up' : 'val-down'}">
          ${trend.trend6m >= 0 ? '↗ +' : '↘ '}${trend.trend6m}%
        </span>
        <span class="forex-stat-sub">Multi-month macro cycle</span>
      </div>
      <div class="forex-stat-card">
        <span class="forex-stat-label">3-Month Fluctuation Range</span>
        <span class="forex-stat-val" style="color: var(--cyan);">${trend.range3m}</span>
        <span class="forex-stat-sub">Volatility: ${trend.volatility}</span>
      </div>
    </div>

    <div class="forex-macro-box">
      <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span>🌐 Primary Market Driver:</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text-dim); line-height: 1.5;">
        ${trend.macroDriver}
      </div>
    </div>

    <div class="forex-advice-box">
      <div style="font-size: 13px; font-weight: 700; color: var(--indigo); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        <span>💡 AI Wealth Management Tip for Fluctuation:</span>
      </div>
      <div style="font-size: 12.5px; color: var(--text); line-height: 1.5;">
        ${cur.code === 'USD' 
          ? 'USD acts as your portfolio baseline anchor. All foreign transactions and income streams automatically adjust to this benchmark.'
          : `For long-term goals in ${cur.code} exceeding 6 months, allocate a <strong>±2.5% to 5% currency fluctuation contingency</strong> to absorb forex swings without missing targets.`
        }
      </div>
    </div>

    <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 14px;">
      <button class="btn-secondary" id="syncLiveRatesBtn" style="font-size: 12.5px; padding: 8px 14px;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Sync Live Rates Now
      </button>
      <button class="btn-secondary" id="askAiAboutForexBtn" style="font-size: 12.5px; padding: 8px 14px; color: var(--indigo); border-color: var(--indigo-glow);">
        ✦ Ask Copilot About Trends
      </button>
    </div>
  `;

  const syncBtn = document.getElementById("syncLiveRatesBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      refreshMarketRates(true);
    });
  }

  const askAiBtn = document.getElementById("askAiAboutForexBtn");
  if (askAiBtn) {
    askAiBtn.addEventListener("click", () => {
      closeForexTrendsModal();
      if (typeof window.openAICopilotModal === "function") {
        window.openAICopilotModal("forex_trends");
      }
    });
  }
}

function openForexTrendsModal() {
  const modal = document.getElementById("forexTrendsModal");
  if (!modal) return;
  renderForexTrendsModalContent();
  modal.classList.remove("hidden");
}

function closeForexTrendsModal() {
  const modal = document.getElementById("forexTrendsModal");
  if (modal) modal.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  populateCurrencySelect();
  tryRefreshLiveRates();

  const openBtn = document.getElementById("openForexTrendsBtn");
  if (openBtn) {
    openBtn.addEventListener("click", openForexTrendsModal);
  }

  const closeBtn = document.getElementById("closeForexTrendsModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeForexTrendsModal);
  }
});

// Expose on window
window.CURRENCIES = CURRENCIES;
window.getCurrency = getCurrency;
window.setCurrency = setCurrency;
window.getExchangeRate = getExchangeRate;
window.convertFromBase = convertFromBase;
window.convertToBase = convertToBase;
window.fmtMoney = fmtMoney;
window.refreshMarketRates = refreshMarketRates;
window.getRatesLastUpdatedText = getRatesLastUpdatedText;
window.getCurrencyTrendData = getCurrencyTrendData;
window.roundMoney = roundMoney;
window.openForexTrendsModal = openForexTrendsModal;
window.closeForexTrendsModal = closeForexTrendsModal;


