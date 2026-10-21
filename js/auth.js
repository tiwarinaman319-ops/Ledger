function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("ledger_users") || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem("ledger_users", JSON.stringify(users));
}

function setSession(email) {
  localStorage.setItem("ledger_session", email);
}

function getSession() {
  return localStorage.getItem("ledger_session");
}

function getUserProfile() {
  const email = getSession();
  if (!email) return null;
  const users = getUsers();
  const u = users[email] || {};
  return {
    email,
    name: u.name || email.split("@")[0] || "User",
    initials: (u.name || email.split("@")[0] || "U")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  };
}

function populateSampleDataForUser(email) {
  const targetEmail = email || "demo@ledger.app";
  const users = getUsers();
  if (!users[targetEmail]) {
    users[targetEmail] = {
      name: "Alex Vance",
      password: "demopassword",
    };
    saveUsers(users);
  }

  const targetDataKey = `ledger_data_${targetEmail}`;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const p1m = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, "0");
  const p1y = now.getMonth() === 0 ? y - 1 : y;
  const p2m = String(now.getMonth() <= 1 ? 12 + now.getMonth() - 1 : now.getMonth() - 1).padStart(2, "0");
  const p2y = now.getMonth() <= 1 ? y - 1 : y;

  const sampleReceiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480" fill="%230f172a"><rect width="360" height="480" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="180" y="48" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23f8fafc" text-anchor="middle">WHOLE FOODS MARKET</text><text x="180" y="72" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">Store %2310492 · Organic Groceries</text><line x1="28" y1="92" x2="332" y2="92" stroke="%23475569" stroke-dasharray="4"/><text x="32" y="130" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Organic Avocados (x4)</text><text x="328" y="130" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$8.99</text><text x="32" y="165" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Wild Alaskan Salmon 1lb</text><text x="328" y="165" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$18.50</text><text x="32" y="200" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Artisan Sourdough Loaf</text><text x="328" y="200" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$6.25</text><text x="32" y="235" font-family="sans-serif" font-size="13" fill="%23e2e8f0">Organic Cold Pressed Juice</text><text x="328" y="235" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc" text-anchor="end">$8.50</text><line x1="28" y1="270" x2="332" y2="270" stroke="%23475569"/><text x="32" y="305" font-family="sans-serif" font-size="14" fill="%2394a3b8">Subtotal</text><text x="328" y="305" font-family="sans-serif" font-size="14" fill="%23cbd5e1" text-anchor="end">$42.24</text><text x="32" y="335" font-family="sans-serif" font-size="14" fill="%2394a3b8">Tax (8.25%)</text><text x="328" y="335" font-family="sans-serif" font-size="14" fill="%23cbd5e1" text-anchor="end">$3.48</text><line x1="28" y1="360" x2="332" y2="360" stroke="%2310b981" stroke-width="2"/><text x="32" y="395" font-family="sans-serif" font-size="18" font-weight="bold" fill="%2310b981">TOTAL PAID</text><text x="328" y="395" font-family="sans-serif" font-size="20" font-weight="bold" fill="%2310b981" text-anchor="end">$45.72</text><text x="180" y="445" font-family="sans-serif" font-size="11" fill="%2364748b" text-anchor="middle">Apple Pay · Visa ending 8812 · Verified</text></svg>`;

  const mockExpenses = [
    // Current Month
    { id: "demo-fam-1", description: "Monthly Family Contribution", amount: 600.00, category: "cat_family", date: `${y}-${m}-03`, payMethod: "pay_online", recipient: "Parents", notes: "Home allowance & support" },
    { id: "demo-rent-1", description: "Apartment Rent & Housing", amount: 1100.00, category: "cat_rent", date: `${y}-${m}-01`, payMethod: "pay_bank", notes: "Monthly apartment lease" },
    { id: "demo-1", description: "Organic Grocery Haul", amount: 164.20, category: "cat_food", date: `${y}-${m}-02`, payMethod: "pay_card", notes: "Whole Foods weekly stock", receipt: sampleReceiptSvg },
    { id: "demo-2", description: "Fiber High-Speed Internet", amount: 79.99, category: "cat_bills", date: `${y}-${m}-04`, payMethod: "pay_online", notes: "Monthly gigabit plan" },
    { id: "demo-3", description: "City Metro & Subway Pass", amount: 65.00, category: "cat_transport", date: `${y}-${m}-06`, payMethod: "pay_card", notes: "Monthly commuter pass" },
    { id: "demo-4", description: "Weekend Brunch with Friends", amount: 54.50, category: "cat_food", date: `${y}-${m}-08`, payMethod: "pay_online", notes: "Artisan cafe" },
    { id: "demo-5", description: "Streaming & Music Subscriptions", amount: 32.98, category: "cat_entertainment", date: `${y}-${m}-10`, payMethod: "pay_card", notes: "Netflix + Spotify" },
    { id: "demo-6", description: "Fitness Gym Membership", amount: 60.00, category: "cat_health", date: `${y}-${m}-12`, payMethod: "pay_bank", notes: "Gold tier access" },
    { id: "demo-7", description: "New Running Sneakers", amount: 125.00, category: "cat_shoes", date: `${y}-${m}-14`, payMethod: "pay_card", notes: "Marathon training shoes" },
    { id: "demo-8", description: "Electricity & Gas Utility", amount: 112.40, category: "cat_bills", date: `${y}-${m}-16`, payMethod: "pay_bank", notes: "Mid-month bill" },
    { id: "demo-9", description: "Cozy Winter Jacket", amount: 145.00, category: "cat_clothing", date: `${y}-${m}-18`, payMethod: "pay_card", notes: "Seasonal clearance" },
    { id: "demo-10", description: "Designer Notebooks & Fountain Pens", amount: 28.50, category: "cat_stationery", date: `${y}-${m}-20`, payMethod: "pay_cash", notes: "Desk stationery" },

    // Previous Month 1
    { id: "demo-fam-2", description: "Money Given to Parents", amount: 600.00, category: "cat_family", date: `${p1y}-${p1m}-03`, payMethod: "pay_online", recipient: "Parents" },
    { id: "demo-rent-2", description: "Apartment Rent & Housing", amount: 1100.00, category: "cat_rent", date: `${p1y}-${p1m}-01`, payMethod: "pay_bank" },
    { id: "demo-11", description: "Supermarket Groceries", amount: 185.00, category: "cat_food", date: `${p1y}-${p1m}-05`, payMethod: "pay_card" },
    { id: "demo-12", description: "Apartment Energy Bill", amount: 98.20, category: "cat_bills", date: `${p1y}-${p1m}-12`, payMethod: "pay_online" },
    { id: "demo-13", description: "Dining Out & Cocktails", amount: 88.00, category: "cat_food", date: `${p1y}-${p1m}-15`, payMethod: "pay_card" },
    { id: "demo-14", description: "Concert Tickets", amount: 120.00, category: "cat_entertainment", date: `${p1y}-${p1m}-18`, payMethod: "pay_online" },
    { id: "demo-15", description: "Rideshare / Uber trips", amount: 48.60, category: "cat_transport", date: `${p1y}-${p1m}-22`, payMethod: "pay_card" },
    { id: "demo-16", description: "Dentist Routine Checkup", amount: 150.00, category: "cat_health", date: `${p1y}-${p1m}-26`, payMethod: "pay_card" },

    // Previous Month 2
    { id: "demo-fam-3", description: "Family Support Contribution", amount: 600.00, category: "cat_family", date: `${p2y}-${p2m}-03`, payMethod: "pay_online", recipient: "Parents" },
    { id: "demo-rent-3", description: "Apartment Rent & Housing", amount: 1100.00, category: "cat_rent", date: `${p2y}-${p2m}-01`, payMethod: "pay_bank" },
    { id: "demo-17", description: "Fresh Market Supplies", amount: 210.00, category: "cat_food", date: `${p2y}-${p2m}-03`, payMethod: "pay_card" },
    { id: "demo-18", description: "Water & Power Utility", amount: 104.50, category: "cat_bills", date: `${p2y}-${p2m}-10`, payMethod: "pay_bank" },
    { id: "demo-19", description: "Books & Learning Course", amount: 75.00, category: "cat_education", date: `${p2y}-${p2m}-14`, payMethod: "pay_online" },
    { id: "demo-20", description: "Weekend Road Trip Fuel", amount: 68.00, category: "cat_transport", date: `${p2y}-${p2m}-21`, payMethod: "pay_card" },
    { id: "demo-21", description: "Casual Dining & Takeout", amount: 92.00, category: "cat_food", date: `${p2y}-${p2m}-28`, payMethod: "pay_cash" },
  ];

  const mockIncomes = [
    { id: "inc-1", source: "Primary Tech Salary", amount: 5200, category: "inc_salary", date: `${y}-${m}-01`, status: "received", isRecurring: true, notes: "Monthly direct deposit" },
    { id: "inc-2", source: "Primary Tech Salary", amount: 5200, category: "inc_salary", date: `${p1y}-${p1m}-01`, status: "received", isRecurring: true },
    { id: "inc-3", source: "Primary Tech Salary", amount: 5200, category: "inc_salary", date: `${p2y}-${p2m}-01`, status: "received", isRecurring: true },
  ];

  const mockGoals = [
    {
      id: "goal-1",
      name: "Emergency Rainy Day Fund",
      target: 10000,
      saved: 7200,
      targetDate: `${y + 1}-06-30`,
      icon: "🛡️"
    },
    {
      id: "goal-2",
      name: "Tokyo & Kyoto Vacation",
      target: 3500,
      saved: 2450,
      targetDate: `${y}-12-15`,
      icon: "✈️"
    },
    {
      id: "goal-3",
      name: "Pro Developer Workstation",
      target: 2000,
      saved: 2000,
      targetDate: `${y}-${m}-28`,
      icon: "💻"
    }
  ];

  const mockSubs = [
    { id: "sub-1", name: "Netflix Premium 4K", amount: 15.99, cycle: "monthly", category: "cat_entertainment", renewalDate: `${y}-${m}-22`, active: true },
    { id: "sub-2", name: "Spotify Duo Family", amount: 12.99, cycle: "monthly", category: "cat_entertainment", renewalDate: `${y}-${m}-27`, active: true },
    { id: "sub-3", name: "Equinox Gym & Spa", amount: 65.00, cycle: "monthly", category: "cat_health", renewalDate: `${y}-${m}-15`, active: true },
    { id: "sub-4", name: "AWS Cloud Infrastructure", amount: 24.50, cycle: "monthly", category: "cat_bills", renewalDate: `${y}-${m}-08`, active: true },
  ];

  localStorage.setItem(targetDataKey, JSON.stringify({
    income: 5200,
    openingBalance: 1500,
    incomes: mockIncomes,
    expenses: mockExpenses,
    goals: mockGoals,
    subscriptions: mockSubs,
    budgets: {
      overall: 4000,
      categories: { cat_family: 700, cat_food: 600, cat_rent: 1200 }
    }
  }));

  return targetEmail;
}

function initDemoAccount() {
  const demoEmail = populateSampleDataForUser("demo@ledger.app");
  setSession(demoEmail);
  return demoEmail;
}

window.populateSampleDataForUser = populateSampleDataForUser;
window.initDemoAccount = initDemoAccount;

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (!loginForm && !signupForm) {
    return; // On app.html or non-auth page
  }

  const sessionEmail = getSession();
  const sessionBanner = document.getElementById("existingSessionNotice");
  if (sessionEmail && sessionBanner) {
    sessionBanner.classList.remove("hidden");
    const sessionEmailEl = document.getElementById("existingSessionEmail");
    if (sessionEmailEl) sessionEmailEl.textContent = sessionEmail;
  }

  const loginTab = document.getElementById("tabLogin");
  const signupTab = document.getElementById("tabSignup");
  const toSignup = document.getElementById("toSignup");
  const toLogin = document.getElementById("toLogin");
  const loginError = document.getElementById("loginError");
  const signupError = document.getElementById("signupError");
  const demoLoginBtns = document.querySelectorAll(".btn-demo-mode, #btnDemoLogin");

  function showLogin() {
    if (loginForm && signupForm) {
      loginForm.classList.remove("hidden");
      signupForm.classList.add("hidden");
    }
    if (loginTab && signupTab) {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
    }
    if (loginError) loginError.textContent = "";
  }

  function showSignup() {
    if (loginForm && signupForm) {
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
    }
    if (loginTab && signupTab) {
      loginTab.classList.remove("active");
      signupTab.classList.add("active");
    }
    if (signupError) signupError.textContent = "";
  }

  if (loginTab) loginTab.addEventListener("click", showLogin);
  if (signupTab) signupTab.addEventListener("click", showSignup);
  if (toSignup) toSignup.addEventListener("click", (e) => { e.preventDefault(); showSignup(); });
  if (toLogin) toLogin.addEventListener("click", (e) => { e.preventDefault(); showLogin(); });

  // Remembered email autofill
  const savedEmail = localStorage.getItem("ledger_remembered_email");
  const emailInput = document.getElementById("loginEmail");
  const rememberCheckbox = document.getElementById("rememberMe");
  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  // Password visibility toggles
  document.querySelectorAll("[data-toggle-pw]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.togglePw;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.innerHTML = isPw
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  // Password strength meter on signup
  const signupPw = document.getElementById("signupPassword");
  const pwStrengthBar = document.getElementById("pwStrengthBar");
  const pwStrengthLabel = document.getElementById("pwStrengthLabel");

  if (signupPw && pwStrengthBar) {
    signupPw.addEventListener("input", () => {
      const val = signupPw.value;
      if (!val) {
        pwStrengthBar.style.width = "0%";
        if (pwStrengthLabel) pwStrengthLabel.textContent = "";
        return;
      }
      let score = 0;
      if (val.length >= 6) score += 1;
      if (val.length >= 10) score += 1;
      if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score += 1;
      if (/[^a-zA-Z0-9]/.test(val)) score += 1;

      const levels = [
        { width: "25%", color: "var(--rose)", text: "Weak" },
        { width: "50%", color: "var(--amber)", text: "Fair" },
        { width: "75%", color: "var(--indigo)", text: "Good" },
        { width: "100%", color: "var(--emerald)", text: "Strong" },
      ];
      const lvl = levels[Math.max(0, score - 1)] || levels[0];
      pwStrengthBar.style.width = lvl.width;
      pwStrengthBar.style.backgroundColor = lvl.color;
      if (pwStrengthLabel) {
        pwStrengthLabel.textContent = lvl.text;
        pwStrengthLabel.style.color = lvl.color;
      }
    });
  }

  // Demo Login Handler
  demoLoginBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      initDemoAccount();
      window.location.href = "app.html";
    });
  });

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (loginError) loginError.textContent = "";
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const users = getUsers();

      if (!email || !password) {
        if (loginError) loginError.textContent = t("err_fill");
        return;
      }
      if (!users[email] || users[email].password !== password) {
        if (loginError) {
          loginError.textContent = t("err_login");
          loginForm.classList.add("shake-error");
          setTimeout(() => loginForm.classList.remove("shake-error"), 500);
        }
        return;
      }

      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem("ledger_remembered_email", email);
      } else {
        localStorage.removeItem("ledger_remembered_email");
      }

      setSession(email);
      window.location.href = "app.html";
    });
  }

  // Signup Submit
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (signupError) signupError.textContent = "";
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const password = document.getElementById("signupPassword").value;

      if (!name || !email || !password) {
        if (signupError) signupError.textContent = t("err_fill");
        return;
      }
      const users = getUsers();
      if (users[email]) {
        if (signupError) {
          signupError.textContent = t("err_signup_exists");
          signupForm.classList.add("shake-error");
          setTimeout(() => signupForm.classList.remove("shake-error"), 500);
        }
        return;
      }
      users[email] = { name, password };
      saveUsers(users);
      setSession(email);
      window.location.href = "app.html";
    });
  }
});
