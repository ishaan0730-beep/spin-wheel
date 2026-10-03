# Append Cricbet99 CSS styles to style.css
$ErrorActionPreference = 'Stop'

$styleFile = "C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app\style.css"
$styleContent = [System.IO.File]::ReadAllText($styleFile, [System.Text.Encoding]::UTF8)

$cricCSS = @'

/* ==========================================================
   CRICBET99 AUTHENTIC UI THEME & 3-LINE MENU DRAWER
   ========================================================== */

/* Top Navbar Header */
.cric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  background: linear-gradient(180deg, #381c19 0%, #291210 100%);
  border-bottom: 2px solid #542722;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
}

.cric-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.cric-home-btn {
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, color 0.2s ease;
  text-decoration: none;
}

.cric-home-btn:hover {
  color: #fff;
  transform: scale(1.1);
}

.cric-logo {
  cursor: pointer;
  user-select: none;
}

.cric-logo-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 1.2px;
  color: #f5a623;
  text-shadow: 0 0 10px rgba(245, 166, 35, 0.4);
}

.cric-header-center {
  display: flex;
  align-items: center;
}

.cric-top-deposit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, #1e7e34 0%, #155724 100%);
  color: #ffffff;
  border: 1px solid #28a745;
  border-radius: 14px;
  padding: 5px 14px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.35);
  transition: all 0.2s ease;
}

.cric-top-deposit-btn:hover {
  background: linear-gradient(180deg, #28a745 0%, #1e7e34 100%);
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.6);
  transform: translateY(-1px);
}

.cric-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cric-icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f0f0f0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cric-icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffd700;
}

.cric-balance-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1b5e20;
  border: 1px solid #2e7d32;
  color: #ffffff;
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cric-balance-pill:hover {
  background: #2e7d32;
  box-shadow: 0 0 10px rgba(46, 125, 50, 0.5);
}

.cric-user-icon {
  display: flex;
  align-items: center;
  color: #ffd700;
}

.cric-login-btn {
  background: linear-gradient(135deg, #f5a623, #d97706);
  color: #000;
  border: none;
  border-radius: 14px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cric-login-btn:hover {
  transform: scale(1.04);
}

.cric-hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 32px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 2px;
}

.cric-bar {
  width: 100%;
  height: 2.5px;
  background: #ffffff;
  border-radius: 2px;
  transition: all 0.25s ease;
}

.cric-hamburger-btn:hover .cric-bar {
  background: #ffd700;
}

/* Promo Code Strip */
.cric-promo-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.85rem;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cric-promo-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
}

.cric-promo-input-group {
  display: flex;
  gap: 4px;
  flex: 1;
  max-width: 320px;
  justify-content: flex-end;
}

.cric-promo-input {
  background: #fff;
  color: #111;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.76rem;
  font-weight: 700;
  width: 140px;
  text-transform: uppercase;
}

.cric-promo-input::placeholder {
  color: #888;
  font-weight: normal;
}

.cric-promo-apply-btn {
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}

.cric-promo-apply-btn:hover {
  background: #1b5e20;
}

/* Sports / Games Horizontal Category Tabs */
.cric-sports-tabs-bar {
  display: flex;
  gap: 4px;
  padding: 0.45rem 0.6rem;
  background: #141414;
  border-bottom: 1px solid #282828;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.cric-sports-tabs-bar::-webkit-scrollbar {
  display: none;
}

.cric-sport-tab {
  background: #222;
  color: #bbb;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 0.74rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cric-sport-tab:hover {
  color: #fff;
  border-color: #555;
}

.cric-sport-tab.active {
  background: linear-gradient(180deg, #1f6448 0%, #154734 100%);
  color: #ffffff;
  border-color: #2ecc71;
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.3);
}

/* ==========================================================
   CRICBET99 SLIDE-OUT 3-LINE MENU DRAWER
   ========================================================== */
.cric-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 99998;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.cric-menu-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 86vw;
  background: #f4f6f6;
  color: #222222;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  box-shadow: -6px 0 25px rgba(0, 0, 0, 0.7);
  overflow-y: auto;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
}

.cric-menu-drawer.hidden {
  transform: translateX(100%);
  pointer-events: none;
}

/* User Profile Top Box */
.cric-drawer-user-card {
  background: #ffffff;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e6e6;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.cric-card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cric-card-user-id {
  font-family: 'Space Grotesk', monospace;
  font-size: 1.05rem;
  font-weight: 800;
  color: #222222;
}

.cric-card-copy-btn {
  background: transparent;
  border: none;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cric-card-copy-btn:hover {
  background: #f0f0f0;
  color: #000;
}

.cric-card-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cric-card-text {
  font-size: 0.84rem;
  color: #333333;
  font-weight: 600;
}

/* One Click Bet Toggle Switch */
.cric-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.cric-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.cric-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #ccc;
  transition: 0.3s;
}

.cric-slider.round {
  border-radius: 22px;
}

.cric-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

input:checked + .cric-slider {
  background-color: #1f6448;
}

input:checked + .cric-slider:before {
  transform: translateX(22px);
}

.cric-card-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.84rem;
  color: #333333;
}

.cric-edit-pencil-btn {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
}

.cric-edit-pencil-btn:hover {
  color: #1f6448;
}

.cric-card-exp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cric-card-exp-val {
  font-weight: 800;
  font-size: 0.88rem;
  color: #d32f2f;
}

.cric-drawer-refer-btn {
  background: #1f6448;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  text-align: center;
  width: 100%;
  box-shadow: 0 2px 6px rgba(31, 100, 72, 0.3);
  transition: background 0.2s ease;
  margin-top: 2px;
}

.cric-drawer-refer-btn:hover {
  background: #174e38;
}

/* Menu Items List */
.cric-drawer-menu-list {
  display: flex;
  flex-direction: column;
  padding: 0.35rem 0 1.5rem 0;
}

.cric-menu-row {
  display: flex;
  align-items: center;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid #e8ebeb;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
  gap: 0.75rem;
}

.cric-menu-row:hover {
  background: #e4e8e8;
}

.cric-row-icon {
  font-size: 1.1rem;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cric-row-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #2b2e31;
  flex: 1;
}

.cric-row-count {
  background: #00f0ff;
  color: #000;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
}

.cric-row-badge {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
}

.cric-row-logout {
  margin-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.cric-row-logout .cric-row-name {
  color: #b71c1c;
  font-weight: 800;
}

.cric-row-logout:hover {
  background: #fde8e8;
}

/* Cric Modals Styling */
.cric-popup-content {
  background: #111622 !important;
  color: #ffffff !important;
  border: 1.5px solid var(--border-subtle) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9) !important;
}

'@

if (!$styleContent.Contains('cric-header')) {
    $styleContent += "`n$cricCSS"
    [System.IO.File]::WriteAllText($styleFile, $styleContent, [System.Text.Encoding]::UTF8)
    Write-Host "Updated style.css successfully!"
} else {
    Write-Host "style.css already has Cricbet99 styles."
}
