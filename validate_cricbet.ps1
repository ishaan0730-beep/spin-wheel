$indexContent = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)
$styleContent = [System.IO.File]::ReadAllText('style.css', [System.Text.Encoding]::UTF8)
$appContent = [System.IO.File]::ReadAllText('app.js', [System.Text.Encoding]::UTF8)

$requiredIds = @(
  'cric-header',
  'cric-home-btn',
  'cric-top-deposit-btn',
  'cric-search-btn',
  'cric-balance-pill',
  'cric-balance-val',
  'cric-lang-btn',
  'cric-hamburger-btn',
  'cric-promo-input',
  'cric-promo-apply-btn',
  'cric-drawer-overlay',
  'cric-menu-drawer',
  'cric-drawer-user-id',
  'cric-drawer-copy-btn',
  'cric-one-click-switch',
  'cric-drawer-display-name',
  'cric-drawer-edit-name-btn',
  'cric-drawer-exp-val',
  'cric-drawer-refer-btn',
  'cric-row-affiliate',
  'cric-row-my-market',
  'cric-row-unsettled-bets',
  'cric-row-bet-history',
  'cric-row-completed-events',
  'cric-row-account-statement',
  'cric-row-profit-loss',
  'cric-row-set-button-values',
  'cric-row-update-mobile',
  'cric-row-change-password',
  'cric-row-2fa',
  'cric-row-notification',
  'cric-row-language',
  'cric-row-rules',
  'cric-row-logout',
  'cric-refer-modal',
  'cric-statement-modal',
  'cric-pnl-modal',
  'cric-button-values-modal',
  'cric-mobile-modal',
  'cric-edit-name-modal',
  'cric-2fa-modal'
)

$missing = @()
foreach ($item in $requiredIds) {
  if (!$indexContent.Contains($item)) {
    $missing += $item
  }
}

if ($missing.Count -eq 0) {
  Write-Host "SUCCESS: All $($requiredIds.Count) Cricbet99 IDs verified in index.html!"
} else {
  Write-Host "Missing IDs: $($missing -join ', ')"
}

Write-Host "Has bindCricbetEvents in app.js: $($appContent.Contains('bindCricbetEvents'))"
Write-Host "Has toggleCricDrawer in app.js: $($appContent.Contains('toggleCricDrawer'))"
Write-Host "Has applyPromoCode in app.js: $($appContent.Contains('applyPromoCode'))"
Write-Host "Has .cric-header in style.css: $($styleContent.Contains('.cric-header'))"
Write-Host "Has .cric-menu-drawer in style.css: $($styleContent.Contains('.cric-menu-drawer'))"
