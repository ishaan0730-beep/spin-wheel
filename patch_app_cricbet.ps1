# PowerShell script to patch app.js with Cricbet99 event handlers, drawer logic, modals, and one-click bet
$ErrorActionPreference = 'Stop'

$appPath = "C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app\app.js"
$appContent = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# 1. Ensure this.bindCricbetEvents() is called in init()
if (!$appContent.Contains('this.bindCricbetEvents();')) {
    $appContent = $appContent.Replace('this.bindCustomerEvents();', "this.bindCustomerEvents();`n    this.bindCricbetEvents();")
}

# 2. Update updateCustomerUI() to sync Cricbet navbar and drawer widgets
$oldUpdateCustUI = @'
    if (this.currentCustomer) {
      this.customerLoginBtn?.classList.add('hidden');
      this.customerProfileChip?.classList.remove('hidden');
'@

$newUpdateCustUI = @'
    if (this.currentCustomer) {
      this.customerLoginBtn?.classList.add('hidden');
      this.customerProfileChip?.classList.remove('hidden');
      
      // Cricbet99 Top Navbar & Drawer widgets sync
      const balanceEl = document.getElementById('cric-balance-val');
      if (balanceEl) balanceEl.textContent = Number(this.currentCustomer.coins || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const drawerUserIdEl = document.getElementById('cric-drawer-user-id');
      if (drawerUserIdEl) drawerUserIdEl.textContent = this.currentCustomer.id || 'Guest Player';
      
      const drawerDispNameEl = document.getElementById('cric-drawer-display-name');
      if (drawerDispNameEl) drawerDispNameEl.textContent = this.currentCustomer.name || this.currentCustomer.id || 'Player';
'@

if ($appContent.Contains($oldUpdateCustUI)) {
    $appContent = $appContent.Replace($oldUpdateCustUI, $newUpdateCustUI)
}

# Also sync exposure and unsettled count in updateCustomerUI
$oldActiveSync = @'
      if (myBets.length > 0) {
        this.activeBetNotice?.classList.remove('hidden');
        const totalLockedCoins = myBets.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0)), 0);
        if (this.myActiveBetsCount) this.myActiveBetsCount.textContent = myBets.length;
        if (this.myActiveBetsPool) this.myActiveBetsPool.textContent = `Total: 💰 ${totalLockedCoins.toLocaleString()} IHD`;
'@

$newActiveSync = @'
      if (myBets.length > 0) {
        this.activeBetNotice?.classList.remove('hidden');
        const totalLockedCoins = myBets.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0)), 0);
        if (this.myActiveBetsCount) this.myActiveBetsCount.textContent = myBets.length;
        if (this.myActiveBetsPool) this.myActiveBetsPool.textContent = `Total: 💰 ${totalLockedCoins.toLocaleString()} IHD`;
        
        const expEl = document.getElementById('cric-drawer-exp-val');
        if (expEl) expEl.textContent = Number(totalLockedCoins).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const unsettledEl = document.getElementById('cric-unsettled-count');
        if (unsettledEl) unsettledEl.textContent = myBets.length;
'@

if ($appContent.Contains($oldActiveSync)) {
    $appContent = $appContent.Replace($oldActiveSync, $newActiveSync)
}

# 3. Add Cricbet methods before the closing brace of SpinWheelApp class
$cricbetMethods = @'

  // ==========================================================
  // CRICBET99 LUXURY INTERFACE & 3-LINE DRAWER CONTROLLER
  // ==========================================================
  bindCricbetEvents() {
    // 1. Hamburger & Balance Pill Drawer Toggles
    const hamburgerBtn = document.getElementById('cric-hamburger-btn');
    const balancePill = document.getElementById('cric-balance-pill');
    const drawerOverlay = document.getElementById('cric-drawer-overlay');
    const topDepositBtn = document.getElementById('cric-top-deposit-btn');
    const homeBtn = document.getElementById('cric-home-btn');
    const searchBtn = document.getElementById('cric-search-btn');
    const langBtn = document.getElementById('cric-lang-btn');

    hamburgerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCricDrawer();
    });

    balancePill?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCricDrawer();
    });

    drawerOverlay?.addEventListener('click', () => {
      this.closeCricDrawer();
    });

    homeBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    topDepositBtn?.addEventListener('click', () => {
      if (this.currentCustomer) {
        this.openAuthModal('deposit');
      } else {
        this.openAuthModal('signin');
      }
    });

    searchBtn?.addEventListener('click', () => {
      this.openAllSpinHistoryModal();
    });

    langBtn?.addEventListener('click', () => {
      this.toggleCricLanguage();
    });

    // 2. Category Sports Tabs
    document.querySelectorAll('.cric-sport-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cric-sport-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabType = tab.getAttribute('data-tab');
        if (tabType === 'spin' || tabType === 'inplay') {
          const predSec = document.getElementById('customer-prediction-section');
          if (predSec) predSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          this.showLiveToast({
            title: 'SPORTS BETTING MARKET',
            message: `<b>${tab.textContent.trim()}</b> matches live feed is active. Place your live predictions on the 10-Slot Spin Wheel!`,
            type: 'bet',
            duration: 4000
          });
        }
      });
    });

    // 3. Promo Code Redeem Bar
    const promoInput = document.getElementById('cric-promo-input');
    const promoApplyBtn = document.getElementById('cric-promo-apply-btn');

    const applyPromo = () => {
      const code = (promoInput?.value || '').trim().toUpperCase();
      if (!code) {
        alert('Please enter a valid Promo Code (e.g. WELCOME100, CRIC99, BONUS50, LUCKY10)');
        return;
      }
      this.applyPromoCode(code);
    };

    promoApplyBtn?.addEventListener('click', applyPromo);
    promoInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyPromo();
    });

    // 4. Drawer Top Controls (Copy ID, One-Click Switch, Edit Name, Refer & Earn)
    const drawerCopyBtn = document.getElementById('cric-drawer-copy-btn');
    drawerCopyBtn?.addEventListener('click', () => {
      const userId = this.currentCustomer ? this.currentCustomer.id : 'Guest';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(userId).then(() => {
          this.showLiveToast({
            title: 'USER ID COPIED',
            message: `User ID <b>${userId}</b> copied to clipboard!`,
            type: 'success',
            duration: 3000
          });
        });
      } else {
        alert(`User ID: ${userId}`);
      }
    });

    // One-Click Bet toggle
    const oneClickSwitch = document.getElementById('cric-one-click-switch');
    if (oneClickSwitch) {
      const savedOneClick = localStorage.getItem('cric_one_click_bet') === 'true';
      oneClickSwitch.checked = savedOneClick;
      oneClickSwitch.addEventListener('change', () => {
        localStorage.setItem('cric_one_click_bet', oneClickSwitch.checked ? 'true' : 'false');
        this.showLiveToast({
          title: 'ONE CLICK BET',
          message: oneClickSwitch.checked ? '⚡ One Click Bet is now <b>ENABLED</b>! Tapping any number chip places bet immediately.' : 'One Click Bet is now <b>DISABLED</b>.',
          type: 'bet',
          duration: 3500
        });
      });
    }

    const editNameBtn = document.getElementById('cric-drawer-edit-name-btn');
    editNameBtn?.addEventListener('click', () => {
      this.openEditDisplayNameModal();
    });

    const referBtn = document.getElementById('cric-drawer-refer-btn');
    referBtn?.addEventListener('click', () => {
      this.openReferEarnModal();
    });

    // 5. 15 Drawer Menu Rows
    document.getElementById('cric-row-affiliate')?.addEventListener('click', () => this.openReferEarnModal());
    document.getElementById('cric-row-my-market')?.addEventListener('click', () => {
      this.closeCricDrawer();
      const predSec = document.getElementById('customer-prediction-section');
      if (predSec) predSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('cric-row-unsettled-bets')?.addEventListener('click', () => {
      this.closeCricDrawer();
      if (this.currentCustomer) this.openAuthModal('bets');
      else this.openAuthModal('signin');
    });
    document.getElementById('cric-row-bet-history')?.addEventListener('click', () => {
      this.closeCricDrawer();
      if (this.currentCustomer) this.openAuthModal('bets');
      else this.openAuthModal('signin');
    });
    document.getElementById('cric-row-completed-events')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openAllSpinHistoryModal();
    });
    document.getElementById('cric-row-account-statement')?.addEventListener('click', () => {
      this.openAccountStatementModal();
    });
    document.getElementById('cric-row-profit-loss')?.addEventListener('click', () => {
      this.openProfitLossModal();
    });
    document.getElementById('cric-row-set-button-values')?.addEventListener('click', () => {
      this.openButtonValuesModal();
    });
    document.getElementById('cric-row-update-mobile')?.addEventListener('click', () => {
      this.openUpdateMobileModal();
    });
    document.getElementById('cric-row-change-password')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openAuthModal('forgot');
    });
    document.getElementById('cric-row-2fa')?.addEventListener('click', () => {
      this.open2FAModal();
    });
    document.getElementById('cric-row-notification')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.audio.playWinFanfare();
      this.showLiveToast({
        title: 'NOTIFICATIONS ACTIVE',
        message: '🔔 Sound & Telegram notifications are 100% active and running.',
        type: 'success',
        duration: 3500
      });
    });
    document.getElementById('cric-row-language')?.addEventListener('click', () => {
      this.toggleCricLanguage();
    });
    document.getElementById('cric-row-rules')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.openHelpModal();
    });
    document.getElementById('cric-row-logout')?.addEventListener('click', () => {
      this.closeCricDrawer();
      this.handleCustomerLogout();
    });
  }

  toggleCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('hidden') || !drawer.classList.contains('open')) {
      this.openCricDrawer();
    } else {
      this.closeCricDrawer();
    }
  }

  openCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    const overlay = document.getElementById('cric-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('hidden');
      setTimeout(() => drawer.classList.add('open'), 10);
    }
    if (overlay) overlay.classList.remove('hidden');

    // Update drawer profile
    const userIdEl = document.getElementById('cric-drawer-user-id');
    const dispNameEl = document.getElementById('cric-drawer-display-name');
    const expEl = document.getElementById('cric-drawer-exp-val');
    const unsettledEl = document.getElementById('cric-unsettled-count');

    if (this.currentCustomer) {
      if (userIdEl) userIdEl.textContent = this.currentCustomer.id || 'Guest Player';
      if (dispNameEl) dispNameEl.textContent = this.currentCustomer.name || this.currentCustomer.id || 'Player';

      const now = new Date();
      const custId = String(this.currentCustomer.id || '').toLowerCase();
      const myBets = (this.activeBets || []).filter(b => {
        if (!b || this.isBetExpired(b, now)) return false;
        const pId = String(b.playerId || b.memberId || b.userId || b.customerId || '').toLowerCase();
        return pId === custId;
      });

      const totalLockedCoins = myBets.reduce((sum, b) => sum + (Number(b.amount || b.coins || 0)), 0);
      if (expEl) expEl.textContent = Number(totalLockedCoins).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (unsettledEl) unsettledEl.textContent = myBets.length;
    } else {
      if (userIdEl) userIdEl.textContent = 'Guest Player';
      if (dispNameEl) dispNameEl.textContent = 'Guest';
      if (expEl) expEl.textContent = '0.00';
      if (unsettledEl) unsettledEl.textContent = '0';
    }
  }

  closeCricDrawer() {
    const drawer = document.getElementById('cric-menu-drawer');
    const overlay = document.getElementById('cric-drawer-overlay');
    if (drawer) {
      drawer.classList.remove('open');
      setTimeout(() => drawer.classList.add('hidden'), 250);
    }
    if (overlay) overlay.classList.add('hidden');
  }

  closeCricModals() {
    [
      'cric-refer-modal',
      'cric-statement-modal',
      'cric-pnl-modal',
      'cric-button-values-modal',
      'cric-mobile-modal',
      'cric-edit-name-modal',
      'cric-2fa-modal'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  toggleCricLanguage() {
    const langBadge = document.getElementById('cric-current-lang');
    const curr = langBadge ? langBadge.textContent.trim() : 'English';
    const next = curr === 'English' ? 'Hindi' : 'English';
    if (langBadge) langBadge.textContent = next;
    this.showLiveToast({
      title: 'LANGUAGE CHANGED',
      message: `Interface language set to <b>${next}</b>.`,
      type: 'success',
      duration: 3000
    });
  }

  // 1. Refer & Earn Modal
  openReferEarnModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-refer-modal');
    if (!modal) return;

    const refCode = this.currentCustomer ? `CRIC99-${this.currentCustomer.id}` : 'CRIC99-PLAYER';
    const codeEl = document.getElementById('cric-refer-code-val');
    if (codeEl) codeEl.textContent = refCode;

    const linkInput = document.getElementById('cric-refer-link-input');
    if (linkInput) {
      linkInput.value = `${window.location.origin}${window.location.pathname}?ref=${refCode}`;
    }

    modal.classList.remove('hidden');
  }

  copyReferralCode() {
    const code = document.getElementById('cric-refer-code-val')?.textContent || 'CRIC99-PLAYER';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        alert(`Referral Code "${code}" copied to clipboard!`);
      });
    } else {
      alert(`Referral Code: ${code}`);
    }
  }

  copyReferralLink() {
    const input = document.getElementById('cric-refer-link-input');
    if (input) {
      input.select();
      navigator.clipboard?.writeText(input.value);
      alert('Referral Invite Link copied to clipboard!');
    }
  }

  shareOnWhatsApp() {
    const code = document.getElementById('cric-refer-code-val')?.textContent || 'CRIC99-PLAYER';
    const url = encodeURIComponent(`${window.location.origin}${window.location.pathname}?ref=${code}`);
    const text = encodeURIComponent(`🎰 Play Cricbet99 Lucky Hourly Spin Wheel! Use my referral code *${code}* to get Free Bonus Coins: `);
    window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
  }

  // 2. Account Statement / Passbook Modal
  openAccountStatementModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-statement-modal');
    if (!modal) return;
    this.renderAccountStatement('ALL');
    modal.classList.remove('hidden');
  }

  renderAccountStatement(filter = 'ALL') {
    const tbody = document.getElementById('cric-statement-table-body');
    const label = document.getElementById('cric-stmt-count-label');
    if (!tbody) return;

    document.querySelectorAll('.cric-stmt-filter').forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    if (!this.currentCustomer) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">Please sign in to view your account passbook.</td></tr>';
      return;
    }

    const playerId = String(this.currentCustomer.id || '').toLowerCase();
    const records = [];

    // 1. Initial signup welcome bonus
    records.push({
      date: new Date(this.currentCustomer.joinedAt || Date.now() - 86400000),
      desc: '🎁 Welcome Bonus Credited',
      type: 'DEPOSIT',
      amount: '+10.00',
      color: '#2ecc71',
      rawAmt: 10
    });

    // 2. Deposits
    (this.deposits || []).filter(d => String(d.customerId || '').toLowerCase() === playerId).forEach(d => {
      records.push({
        date: new Date(d.requestedAt || Date.now()),
        desc: `💳 Deposit (${d.utr ? 'UTR: ' + d.utr : d.id}) [${d.status}]`,
        type: 'DEPOSIT',
        amount: d.status === 'APPROVED' ? `+${d.amount}.00` : `${d.amount}.00 (${d.status})`,
        color: d.status === 'APPROVED' ? '#2ecc71' : '#ffd700',
        rawAmt: d.status === 'APPROVED' ? Number(d.amount) : 0
      });
    });

    // 3. Withdrawals
    (this.withdrawals || []).filter(w => String(w.customerId || '').toLowerCase() === playerId).forEach(w => {
      records.push({
        date: new Date(w.requestedAt || Date.now()),
        desc: `💸 Withdrawal Request [${w.status}]`,
        type: 'WITHDRAW',
        amount: `-${w.amount}.00`,
        color: '#ff6b6b',
        rawAmt: -Number(w.amount)
      });
    });

    // 4. Bets
    (this.activeBets || []).filter(b => String(b.playerId || b.customerId || '').toLowerCase() === playerId).forEach(b => {
      records.push({
        date: new Date(b.timestamp || Date.now()),
        desc: `🎯 Prediction Bet #${b.number || b.no} (${b.targetSlot || 'Slot'})`,
        type: 'BETS',
        amount: `-${b.amount || b.coins}.00`,
        color: '#ff6b6b',
        rawAmt: -Number(b.amount || b.coins)
      });
    });

    // 5. Settled Bet History (Wins & Losses)
    (this.currentCustomer.betHistory || []).forEach(b => {
      if (b.status === 'WON') {
        records.push({
          date: new Date(b.timestamp || Date.now()),
          desc: `🏆 Won Prediction #${b.number || b.no} (9x Payout)`,
          type: 'BETS',
          amount: `+${b.payout || (Number(b.amount) * 9)}.00`,
          color: '#2ecc71',
          rawAmt: Number(b.payout || (Number(b.amount) * 9))
        });
      }
    });

    records.sort((a, b) => b.date - a.date);

    let filtered = records;
    if (filter !== 'ALL') {
      filtered = records.filter(r => r.type === filter);
    }

    if (label) label.textContent = `Showing ${filtered.length} entries`;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">No transactions recorded for this filter.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    let currentBalance = Number(this.currentCustomer.coins || 0);

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      const dateStr = r.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + formatTime12(r.date);
      tr.innerHTML = `
        <td style="font-size:0.75rem; color:var(--text-secondary);">${dateStr}</td>
        <td style="font-size:0.78rem; font-weight:700; color:#fff;">${r.desc}</td>
        <td><span style="font-size:0.7rem; font-weight:800; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.08);">${r.type}</span></td>
        <td style="font-size:0.85rem; font-weight:900; color:${r.color};">${r.amount}</td>
        <td style="font-size:0.85rem; font-weight:800; color:var(--primary-gold-bright);">💰 ${currentBalance.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 3. Profit & Loss Report Modal
  openProfitLossModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-pnl-modal');
    if (!modal) return;

    if (!this.currentCustomer) {
      alert('Please sign in to view your Profit & Loss statement.');
      return;
    }

    const playerId = String(this.currentCustomer.id || '').toLowerCase();
    const allBets = (this.currentCustomer.betHistory || []);
    const active = (this.activeBets || []).filter(b => String(b.playerId || b.customerId || '').toLowerCase() === playerId);

    let totalStaked = 0;
    let totalWon = 0;
    let wonCount = 0;
    let totalBetsCount = allBets.length + active.length;

    allBets.forEach(b => {
      const amt = Number(b.amount || b.coins || 0);
      totalStaked += amt;
      if (b.status === 'WON') {
        wonCount++;
        totalWon += Number(b.payout || (amt * 9));
      }
    });

    active.forEach(b => {
      totalStaked += Number(b.amount || b.coins || 0);
    });

    const net = totalWon - totalStaked;
    const winRate = totalBetsCount > 0 ? ((wonCount / totalBetsCount) * 100).toFixed(1) : '0';

    document.getElementById('cric-pnl-total-bets').textContent = totalBetsCount;
    document.getElementById('cric-pnl-total-staked').textContent = `💰 ${totalStaked.toLocaleString()}`;
    document.getElementById('cric-pnl-total-won').textContent = `💰 ${totalWon.toLocaleString()}`;
    document.getElementById('cric-pnl-win-rate').textContent = `${winRate}%`;

    const netValEl = document.getElementById('cric-pnl-net-value');
    const netCard = document.getElementById('cric-pnl-net-card');

    if (net >= 0) {
      if (netValEl) {
        netValEl.textContent = `💰 +${net.toLocaleString()} IHD (PROFIT)`;
        netValEl.style.color = '#2ecc71';
      }
      if (netCard) {
        netCard.style.borderColor = '#2ecc71';
        netCard.style.background = 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(0,0,0,0.4))';
      }
    } else {
      if (netValEl) {
        netValEl.textContent = `💰 -${Math.abs(net).toLocaleString()} IHD (LOSS)`;
        netValEl.style.color = '#ff6b6b';
      }
      if (netCard) {
        netCard.style.borderColor = '#ff6b6b';
        netCard.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(0,0,0,0.4))';
      }
    }

    modal.classList.remove('hidden');
  }

  // 4. Set Button Values Modal
  openButtonValuesModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-button-values-modal');
    if (!modal) return;

    const saved = JSON.parse(localStorage.getItem('cric_custom_chip_values') || '[10, 50, 100, 500, 1000]');
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`cric-btn-val-${i}`);
      if (el && saved[i - 1] !== undefined) el.value = saved[i - 1];
    }

    modal.classList.remove('hidden');
  }

  saveCustomButtonValues() {
    const values = [];
    for (let i = 1; i <= 5; i++) {
      const val = parseInt(document.getElementById(`cric-btn-val-${i}`)?.value, 10) || (i === 1 ? 10 : i === 2 ? 50 : i === 3 ? 100 : i === 4 ? 500 : 1000);
      values.push(val);
    }
    localStorage.setItem('cric_custom_chip_values', JSON.stringify(values));
    this.closeCricModals();
    this.showLiveToast({
      title: 'QUICK BUTTON VALUES SAVED',
      message: `Buttons updated: ${values.join(', ')} IHD`,
      type: 'success',
      duration: 3500
    });
  }

  // 5. Update Mobile Number Modal
  openUpdateMobileModal() {
    this.closeCricDrawer();
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      return;
    }
    const modal = document.getElementById('cric-mobile-modal');
    if (!modal) return;

    const currEl = document.getElementById('cric-current-mobile-display');
    if (currEl) currEl.value = this.currentCustomer.mobile || 'None';
    const newInp = document.getElementById('cric-new-mobile-input');
    if (newInp) newInp.value = '';
    const fb = document.getElementById('cric-mobile-feedback');
    if (fb) fb.textContent = '';

    modal.classList.remove('hidden');
  }

  saveUpdatedMobileNumber() {
    const newInp = document.getElementById('cric-new-mobile-input');
    const fb = document.getElementById('cric-mobile-feedback');
    const mobile = (newInp?.value || '').trim();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      if (fb) {
        fb.textContent = '❌ Please enter a valid 10-digit mobile number!';
        fb.style.color = '#ff6b6b';
      }
      return;
    }

    this.currentCustomer.mobile = mobile;
    this.customersDb[this.currentCustomer.id].mobile = mobile;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb });

    if (fb) {
      fb.textContent = '✅ Mobile number updated successfully!';
      fb.style.color = '#2ecc71';
    }
    setTimeout(() => this.closeCricModals(), 1200);
  }

  // 6. Edit Display Name Modal
  openEditDisplayNameModal() {
    this.closeCricDrawer();
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      return;
    }
    const modal = document.getElementById('cric-edit-name-modal');
    if (!modal) return;

    const nameInp = document.getElementById('cric-new-display-name-input');
    if (nameInp) nameInp.value = this.currentCustomer.name || '';
    const fb = document.getElementById('cric-name-feedback');
    if (fb) fb.textContent = '';

    modal.classList.remove('hidden');
  }

  saveUpdatedDisplayName() {
    const nameInp = document.getElementById('cric-new-display-name-input');
    const fb = document.getElementById('cric-name-feedback');
    const name = (nameInp?.value || '').trim();

    if (!name || name.length < 2) {
      if (fb) {
        fb.textContent = '❌ Please enter at least 2 characters for Display Name!';
        fb.style.color = '#ff6b6b';
      }
      return;
    }

    this.currentCustomer.name = name;
    this.customersDb[this.currentCustomer.id].name = name;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb });

    if (fb) {
      fb.textContent = '✅ Display name updated successfully!';
      fb.style.color = '#2ecc71';
    }
    setTimeout(() => this.closeCricModals(), 1200);
  }

  // 7. 2FA Security Modal
  open2FAModal() {
    this.closeCricDrawer();
    const modal = document.getElementById('cric-2fa-modal');
    if (!modal) return;

    const is2FA = localStorage.getItem('cric_2fa_enabled') !== 'false';
    const sw = document.getElementById('cric-2fa-toggle-switch');
    const txt = document.getElementById('cric-2fa-status-text');
    if (sw) sw.checked = is2FA;
    if (txt) {
      txt.textContent = is2FA ? '✅ 2FA is currently ACTIVE' : '⚠️ 2FA is currently DISABLED';
      txt.style.color = is2FA ? '#2ecc71' : '#ff6b6b';
    }

    modal.classList.remove('hidden');
  }

  toggle2FAStatus(enabled) {
    localStorage.setItem('cric_2fa_enabled', enabled ? 'true' : 'false');
    const txt = document.getElementById('cric-2fa-status-text');
    if (txt) {
      txt.textContent = enabled ? '✅ 2FA is currently ACTIVE' : '⚠️ 2FA is currently DISABLED';
      txt.style.color = enabled ? '#2ecc71' : '#ff6b6b';
    }
  }

  // 8. Promo Code Redeemer
  applyPromoCode(code) {
    if (!this.currentCustomer) {
      this.openAuthModal('signin');
      alert('Please Sign In or Register first to redeem Promo Codes!');
      return;
    }

    const usedKey = `promo_used_${this.currentCustomer.id}_${code}`;
    if (localStorage.getItem(usedKey)) {
      alert(`⚠️ You have already redeemed code "${code}"!`);
      return;
    }

    const PROMOS = {
      'WELCOME100': 100,
      'CRIC99': 99,
      'BONUS50': 50,
      'LUCKY10': 10,
      'FREEBET': 25,
      'VIP500': 500
    };

    const bonus = PROMOS[code];
    if (!bonus) {
      alert(`❌ Invalid Promo Code "${code}". Valid codes: WELCOME100, CRIC99, BONUS50, LUCKY10, FREEBET, VIP500`);
      return;
    }

    localStorage.setItem(usedKey, 'true');
    this.currentCustomer.coins = (this.currentCustomer.coins || 0) + bonus;
    this.customersDb[this.currentCustomer.id].coins = this.currentCustomer.coins;
    this.saveCustomersDB(this.customersDb);
    this.saveCustomerSession(this.currentCustomer);
    this.updateCustomerUI();
    this.pushStateToServer({ customersDb: this.customersDb });

    this.confetti.fire(3000);
    this.audio.playWinFanfare();

    this.showLiveToast({
      title: '🎉 PROMO CODE REDEEMED!',
      message: `Code <b>${code}</b> applied! 💰<b>+${bonus} IHD Coins</b> credited instantly to your wallet!`,
      type: 'success',
      duration: 6000
    });

    const promoInp = document.getElementById('cric-promo-input');
    if (promoInp) promoInp.value = '';
  }
'@

# Also update renderPredictionChips to trigger One-Click Bet if enabled
$oldRenderChips = @'
      btn.addEventListener('click', () => {
        this.selectedBetNumber = num;
        this.predictionNumberChips.querySelectorAll('.predict-num-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.audio.playTick();
        if (this.predictionFeedbackMsg) {
          this.predictionFeedbackMsg.style.color = '#00f0ff';
          this.predictionFeedbackMsg.textContent = `Selected #${num} for prediction!`;
        }
      });
'@

$newRenderChips = @'
      btn.addEventListener('click', () => {
        this.selectedBetNumber = num;
        this.predictionNumberChips.querySelectorAll('.predict-num-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.audio.playTick();
        if (this.predictionFeedbackMsg) {
          this.predictionFeedbackMsg.style.color = '#00f0ff';
          this.predictionFeedbackMsg.textContent = `Selected #${num} for prediction!`;
        }
        // One-Click Bet feature
        if (localStorage.getItem('cric_one_click_bet') === 'true') {
          this.placeCustomerPrediction();
        }
      });
'@

if ($appContent.Contains($oldRenderChips)) {
    $appContent = $appContent.Replace($oldRenderChips, $newRenderChips)
}

# Insert methods before the final closing brace
$lastBraceIndex = $appContent.LastIndexOf('}')
if ($lastBraceIndex -ge 0) {
    $appContent = $appContent.Substring(0, $lastBraceIndex) + $cricbetMethods + "`n}" + $appContent.Substring($lastBraceIndex + 1)
}

[System.IO.File]::WriteAllText($appPath, $appContent, [System.Text.Encoding]::UTF8)
Write-Host "Successfully patched app.js with Cricbet99 interface methods!"
