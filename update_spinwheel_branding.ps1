# PowerShell script to update header branding and drawer icons in index.html cleanly
$ErrorActionPreference = 'Stop'

$indexFile = "C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app\index.html"
$indexContent = [System.IO.File]::ReadAllText($indexFile, [System.Text.Encoding]::UTF8)

# 1. Update Header Logo to SPIN & WHEEL
$indexContent = $indexContent.Replace(
    '<div class="cric-logo" id="brand-header" title="CRICBET99">',
    '<div class="cric-logo" id="brand-header" title="SPIN & WHEEL">'
)
$indexContent = $indexContent.Replace(
    '<span class="cric-logo-text">CRICBET99</span>',
    '<span class="cric-logo-text">SPIN & WHEEL</span>'
)

# 2. Remove the unwanted Sports Category tabs strip
$tabsRegex = '(?s)<div class="cric-sports-tabs-bar">.*?</div>'
$indexContent = [System.Text.RegularExpressions.Regex]::Replace($indexContent, $tabsRegex, '')

# 3. Clean and replace the entire Drawer and Modals block with clean SVG / Unicode icons
$oldDrawerRegex = '(?s)<!-- CRICBET99 SLIDE-OUT 3-LINE MENU DRAWER -->.*?</body>'

$cleanDrawerAndModals = @'
  <!-- SPIN & WHEEL SLIDE-OUT 3-LINE MENU DRAWER -->
  <div id="cric-drawer-overlay" class="cric-drawer-overlay hidden"></div>
  <aside id="cric-menu-drawer" class="cric-menu-drawer hidden">
    <!-- Top User Profile Box -->
    <div class="cric-drawer-user-card">
      <div class="cric-card-top-row">
        <span class="cric-card-user-id" id="cric-drawer-user-id">Guest Player</span>
        <button type="button" class="cric-card-copy-btn" id="cric-drawer-copy-btn" title="Copy User ID">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </div>

      <div class="cric-card-toggle-row">
        <span class="cric-card-text">One Click Bet</span>
        <label class="cric-switch">
          <input type="checkbox" id="cric-one-click-switch">
          <span class="cric-slider round"></span>
        </label>
      </div>

      <div class="cric-card-name-row">
        <span class="cric-card-text">Display name : <strong id="cric-drawer-display-name">Player</strong></span>
        <button type="button" class="cric-edit-pencil-btn" id="cric-drawer-edit-name-btn" title="Edit Display Name">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
      </div>

      <div class="cric-card-exp-row">
        <span class="cric-card-text">Exp:</span>
        <span class="cric-card-exp-val" id="cric-drawer-exp-val">0.00</span>
      </div>

      <button type="button" class="cric-drawer-refer-btn" id="cric-drawer-refer-btn">
        Refer & Earn
      </button>
    </div>

    <!-- Menu Items List -->
    <div class="cric-drawer-menu-list">
      <div class="cric-menu-row" id="cric-row-affiliate">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></span>
        <span class="cric-row-name">Affiliate</span>
      </div>

      <div class="cric-menu-row" id="cric-row-my-market">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
        <span class="cric-row-name">My Market</span>
      </div>

      <div class="cric-menu-row" id="cric-row-unsettled-bets">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg></span>
        <span class="cric-row-name">Unsettled Bets</span>
        <span class="cric-row-count" id="cric-unsettled-count">0</span>
      </div>

      <div class="cric-menu-row" id="cric-row-bet-history">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
        <span class="cric-row-name">Bet History</span>
      </div>

      <div class="cric-menu-row" id="cric-row-completed-events">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
        <span class="cric-row-name">Completed Events</span>
      </div>

      <div class="cric-menu-row" id="cric-row-account-statement">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="5 6 12 3 19 6"></polyline><line x1="4" y1="10" x2="4" y2="21"></line><line x1="20" y1="10" x2="20" y2="21"></line><line x1="8" y1="14" x2="8" y2="17"></line><line x1="12" y1="14" x2="12" y2="17"></line><line x1="16" y1="14" x2="16" y2="17"></line></svg></span>
        <span class="cric-row-name">Account Statement</span>
      </div>

      <div class="cric-menu-row" id="cric-row-profit-loss">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
        <span class="cric-row-name">Profit Loss Report</span>
      </div>

      <div class="cric-menu-row" id="cric-row-set-button-values">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></span>
        <span class="cric-row-name">Set Button Values</span>
      </div>

      <div class="cric-menu-row" id="cric-row-update-mobile">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg></span>
        <span class="cric-row-name">Update Mobile Number</span>
      </div>

      <div class="cric-menu-row" id="cric-row-change-password">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
        <span class="cric-row-name">Change Password</span>
      </div>

      <div class="cric-menu-row" id="cric-row-2fa">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>
        <span class="cric-row-name">2FA</span>
      </div>

      <div class="cric-menu-row" id="cric-row-notification">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
        <span class="cric-row-name">Notification</span>
      </div>

      <div class="cric-menu-row" id="cric-row-language">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></span>
        <span class="cric-row-name">Language</span>
        <span class="cric-row-badge" id="cric-current-lang">English</span>
      </div>

      <div class="cric-menu-row" id="cric-row-rules">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
        <span class="cric-row-name">Rules</span>
      </div>

      <div class="cric-menu-row cric-row-logout" id="cric-row-logout">
        <span class="cric-row-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#b71c1c" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span>
        <span class="cric-row-name">Logout</span>
      </div>
    </div>
  </aside>

  <!-- MODAL 1: REFER & EARN / AFFILIATE MODAL -->
  <div id="cric-refer-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:440px;">
      <div class="modal-header">
        <h3 style="color:#2ecc71; font-weight:800; font-size:1.15rem;">🎁 Refer & Earn Commission</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:1rem;">
          Invite your friends to play! Earn <strong>5% Lifetime Commission</strong> on every deposit your friends make.
        </p>
        
        <div class="cric-box" style="background:rgba(0,0,0,0.3); padding:0.8rem; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:1rem;">
          <label class="field-label" style="font-size:0.75rem; color:var(--text-muted);">Your Referral Code:</label>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <strong id="cric-refer-code-val" style="font-size:1.1rem; color:var(--primary-gold-bright); font-family:monospace; letter-spacing:1px;">SPIN-PLAYER</strong>
            <button type="button" class="btn btn-secondary btn-xs" onclick="app.copyReferralCode()">📋 Copy</button>
          </div>
        </div>

        <div class="cric-box" style="background:rgba(0,0,0,0.3); padding:0.8rem; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:1rem;">
          <label class="field-label" style="font-size:0.75rem; color:var(--text-muted);">Your Invite Link:</label>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <input type="text" id="cric-refer-link-input" class="admin-input" readonly style="font-size:0.75rem; color:#00f0ff;">
            <button type="button" class="btn btn-gold btn-xs" onclick="app.copyReferralLink()">Copy Link</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-bottom:1rem;">
          <div style="background:rgba(46,204,113,0.1); border:1px solid rgba(46,204,113,0.3); border-radius:8px; padding:0.75rem; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">Referred Friends</span>
            <strong id="cric-refer-count" style="font-size:1.3rem; color:#2ecc71;">0</strong>
          </div>
          <div style="background:rgba(245,176,65,0.1); border:1px solid rgba(245,176,65,0.3); border-radius:8px; padding:0.75rem; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">Total Commission</span>
            <strong id="cric-refer-earnings" style="font-size:1.3rem; color:var(--primary-gold-bright);">💰 0 IHD</strong>
          </div>
        </div>

        <button type="button" id="cric-share-whatsapp-btn" class="btn btn-block" style="background:#25D366; color:#fff; font-weight:800;" onclick="app.shareOnWhatsApp()">
          📲 Share via WhatsApp
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: ACCOUNT STATEMENT / PASSBOOK MODAL -->
  <div id="cric-statement-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:620px;">
      <div class="modal-header">
        <h3 style="color:#00f0ff; font-weight:800; font-size:1.15rem;">🏛️ Account Statement / Passbook</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
          <div class="cric-filter-pills" style="display:flex; gap:4px;">
            <button type="button" class="btn btn-secondary btn-xs cric-stmt-filter active" data-filter="ALL" onclick="app.renderAccountStatement('ALL')">All</button>
            <button type="button" class="btn btn-secondary btn-xs cric-stmt-filter" data-filter="DEPOSIT" onclick="app.renderAccountStatement('DEPOSIT')">Deposits</button>
            <button type="button" class="btn btn-secondary btn-xs cric-stmt-filter" data-filter="WITHDRAW" onclick="app.renderAccountStatement('WITHDRAW')">Withdrawals</button>
            <button type="button" class="btn btn-secondary btn-xs cric-stmt-filter" data-filter="BETS" onclick="app.renderAccountStatement('BETS')">Bets & Wins</button>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);" id="cric-stmt-count-label">Showing all entries</span>
        </div>

        <div class="schedule-table-wrap" style="max-height:320px; overflow-y:auto;">
          <table class="schedule-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody id="cric-statement-table-body">
              <tr>
                <td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">No transactions recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL 3: PROFIT & LOSS REPORT MODAL -->
  <div id="cric-pnl-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:480px;">
      <div class="modal-header">
        <h3 style="color:var(--primary-gold-bright); font-weight:800; font-size:1.15rem;">📊 Profit & Loss Report</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; padding:0.8rem; text-align:center;">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Total Bets Placed</span>
            <strong id="cric-pnl-total-bets" style="font-size:1.25rem; color:#fff;">0</strong>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; padding:0.8rem; text-align:center;">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Total Wagered</span>
            <strong id="cric-pnl-total-staked" style="font-size:1.25rem; color:#00f0ff;">💰 0</strong>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; padding:0.8rem; text-align:center;">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Total Payouts Won</span>
            <strong id="cric-pnl-total-won" style="font-size:1.25rem; color:#2ecc71;">💰 0</strong>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:8px; padding:0.8rem; text-align:center;">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Win Rate</span>
            <strong id="cric-pnl-win-rate" style="font-size:1.25rem; color:var(--primary-gold-bright);">0%</strong>
          </div>
        </div>

        <div id="cric-pnl-net-card" style="background:linear-gradient(135deg, rgba(46,204,113,0.15), rgba(0,0,0,0.4)); border:1.5px solid #2ecc71; border-radius:10px; padding:1rem; text-align:center;">
          <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; font-weight:700;">Net Profit / Loss</span>
          <div id="cric-pnl-net-value" style="font-size:1.8rem; font-weight:900; color:#2ecc71; margin-top:4px;">💰 +0 IHD</div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL 4: SET BUTTON VALUES MODAL -->
  <div id="cric-button-values-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:440px;">
      <div class="modal-header">
        <h3 style="color:#fff; font-weight:800; font-size:1.15rem;">⚙️ Set Quick Bet Button Values</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">
          Customize the quick chip amount buttons shown in the prediction game:
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-bottom:1rem;">
          <div>
            <label class="field-label" style="font-size:0.72rem;">Button 1:</label>
            <input type="number" id="cric-btn-val-1" class="admin-input" value="10" min="1">
          </div>
          <div>
            <label class="field-label" style="font-size:0.72rem;">Button 2:</label>
            <input type="number" id="cric-btn-val-2" class="admin-input" value="50" min="1">
          </div>
          <div>
            <label class="field-label" style="font-size:0.72rem;">Button 3:</label>
            <input type="number" id="cric-btn-val-3" class="admin-input" value="100" min="1">
          </div>
          <div>
            <label class="field-label" style="font-size:0.72rem;">Button 4:</label>
            <input type="number" id="cric-btn-val-4" class="admin-input" value="500" min="1">
          </div>
          <div style="grid-column: span 2;">
            <label class="field-label" style="font-size:0.72rem;">Button 5:</label>
            <input type="number" id="cric-btn-val-5" class="admin-input" value="1000" min="1">
          </div>
        </div>

        <button type="button" class="btn btn-gold btn-block" onclick="app.saveCustomButtonValues()">
          💾 Save Button Values
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 5: UPDATE MOBILE NUMBER MODAL -->
  <div id="cric-mobile-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:400px;">
      <div class="modal-header">
        <h3 style="color:#fff; font-weight:800; font-size:1.15rem;">📱 Update Mobile Number</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="field-label">Current Mobile:</label>
          <input type="text" id="cric-current-mobile-display" class="admin-input" readonly style="opacity:0.7;">
        </div>
        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="field-label">New 10-Digit Mobile Number:</label>
          <input type="tel" id="cric-new-mobile-input" maxlength="10" class="admin-input" placeholder="e.g. 9876543210">
        </div>
        <p id="cric-mobile-feedback" class="save-status-msg" style="display:block; margin-bottom:0.6rem;"></p>
        <button type="button" class="btn btn-gold btn-block" onclick="app.saveUpdatedMobileNumber()">
          ✅ Save Mobile Number
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 6: EDIT DISPLAY NAME MODAL -->
  <div id="cric-edit-name-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:400px;">
      <div class="modal-header">
        <h3 style="color:#fff; font-weight:800; font-size:1.15rem;">✏️ Edit Display Name</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="field-label">Your New Display Name:</label>
          <input type="text" id="cric-new-display-name-input" class="admin-input" placeholder="e.g. LuckyPlayer777">
        </div>
        <p id="cric-name-feedback" class="save-status-msg" style="display:block; margin-bottom:0.6rem;"></p>
        <button type="button" class="btn btn-gold btn-block" onclick="app.saveUpdatedDisplayName()">
          ✅ Save Display Name
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL 7: 2FA SECURITY MODAL -->
  <div id="cric-2fa-modal" class="modal-backdrop hidden">
    <div class="modal-overlay" onclick="app.closeCricModals()"></div>
    <div class="modal-content cric-popup-content" style="max-width:400px;">
      <div class="modal-header">
        <h3 style="color:#00f0ff; font-weight:800; font-size:1.15rem;">🛡️ Two-Factor Authentication (2FA)</h3>
        <button type="button" class="icon-btn" onclick="app.closeCricModals()">&times;</button>
      </div>
      <div class="modal-body" style="padding:1.25rem;">
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:1rem;">
          Enhance your account security with Two-Factor PIN Verification on every withdrawal and login.
        </p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:0.8rem; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:1rem;">
          <span style="font-weight:700; color:#fff;">2FA Security Status:</span>
          <label class="cric-switch">
            <input type="checkbox" id="cric-2fa-toggle-switch" onchange="app.toggle2FAStatus(this.checked)">
            <span class="cric-slider round"></span>
          </label>
        </div>

        <p id="cric-2fa-status-text" style="font-size:0.78rem; color:#2ecc71; text-align:center; font-weight:700;">✅ 2FA is currently ACTIVE</p>
      </div>
    </div>
  </div>
</body>
'@

$indexContent = [System.Text.RegularExpressions.Regex]::Replace($indexContent, $oldDrawerRegex, "$cleanDrawerAndModals`n</html>")

[System.IO.File]::WriteAllText($indexFile, $indexContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated index.html: branding set to SPIN & WHEEL, sports tabs removed, clean icons applied!"
