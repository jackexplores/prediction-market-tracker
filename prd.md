# Prediction Market Top-Trader Tracker — PRD

**Version:** 1.0
**Date:** March 2026
**Author:** Jack
**Status:** Draft

| Field | Value |
|---|---|
| Primary Data Source | Polymarket API (public) |
| Secondary Data Source | Kalshi API (public market stats) |
| Target Platform | Web (Next.js on Vercel) |

---

## 1. Executive Summary

This tool identifies the best-performing traders on Polymarket, ranks them by realised profit, and provides a live feed of their recent trades. Kalshi is used as a secondary source for general market statistics and cross-platform context, but not for per-trader tracking — Kalshi's public trade data is anonymous.

The product is read-only and analytical. It does not execute trades. It aggregates publicly available data from platform APIs and presents it through a clean, light, Robinhood-inspired web interface that prioritises readability and fast scanning.

---

## 2. Problem Statement

Polymarket has grown into a multi-billion-dollar prediction market, but identifying skilled traders is unnecessarily hard. The platform's leaderboard exists but offers limited drill-down: no per-trade feed, no category-level accuracy breakdown, no alerting. A trader who wants to follow "smart money" has to manually cross-reference wallet addresses, parse raw activity logs, and repeatedly check individual profile pages.

There is no lightweight tool that answers: **who has been most consistently right on Polymarket, and what are they trading right now?**

---

## 3. Target User

Active prediction-market participants (retail or semi-pro) who trade on Polymarket and want data-driven context to inform their own positioning. Secondary users include prediction-market researchers, journalists, and quant analysts prototyping signal strategies.

---

## 4. Goals & Non-Goals

### 4.1 Goals

1. Surface the top-performing Polymarket accounts ranked by historical PnL, with drill-down into win rate, volume, and category accuracy.
2. Provide a real-time trade feed showing recent activity from tracked wallets, with market context and position direction.
3. Show general Kalshi market stats (volume, prices, trade counts) alongside Polymarket data for cross-platform context on dual-listed events.
4. Enable filtering by time window, market category, and individual trader.
5. Deliver alerts (webhook, email) when tracked accounts execute new trades above a configurable size threshold.

### 4.2 Non-Goals (v1)

- Per-trader tracking on Kalshi (anonymous trade data makes this infeasible without scraping or third-party services).
- Trade execution or copy-trading automation.
- Portfolio management or fund custody.
- Mobile native apps (web-first, responsive design).
- AI-generated trade recommendations.

---

## 5. Data Sources & API Integration

### 5.1 Polymarket (Primary — Per-Trader Data)

Polymarket's Data API and Gamma API are fully public with no authentication required. This makes Polymarket the only viable source for per-trader intelligence: the leaderboard endpoint returns wallet addresses, and the activity endpoint returns full trade-level detail per wallet.

| Endpoint | Base URL | What We Use It For |
|---|---|---|
| `GET /v1/leaderboard` | `data-api.polymarket.com` | Top traders by PnL and volume. Filterable by window: `1d`, `7d`, `30d`, `all`. Returns `rank`, `proxyWallet`, `userName`, `vol`, `pnl`, `profileImage`, `xUsername`, `verifiedBadge`. |
| `GET /activity` | `data-api.polymarket.com` | On-chain activity per wallet. Returns `timestamp`, `conditionId`, `type` (TRADE, SPLIT, MERGE, REDEEM), `usdcSize`, `price`, `side` (BUY/SELL), `outcome`, `slug`, market title. |
| `GET /trades` | `data-api.polymarket.com` | Trade history filterable by user address or market. Includes price, size, side, tx hash. |
| `GET /positions` | `data-api.polymarket.com` | Current open positions for a wallet. Used to show what a trader is currently holding. |
| `GET /events`, `GET /markets` | `gamma-api.polymarket.com` | Market metadata: titles, slugs, categories, outcomes, `outcomePrices`, resolution status. |
| `GET /prices`, `GET /book` | `clob.polymarket.com` | Current midpoint prices and orderbook depth. Used for live market context in the trade feed. |
| `WSS market channel` | `ws-subscriptions-clob.polymarket.com` | Real-time price and trade updates. Used to keep the feed current without polling. |

### 5.2 Kalshi (Secondary — General Market Stats)

Kalshi's public trade endpoint does not attach user identifiers to trades, and their leaderboard is opt-in with no documented public API. This makes per-trader tracking infeasible. Instead, Kalshi is used strictly for aggregate market data: trade volumes, price levels, and orderbook depth — providing cross-platform context where the same event is listed on both platforms.

| Endpoint | Base URL | What We Use It For |
|---|---|---|
| `GET /markets` | `api.elections.kalshi.com/trade-api/v2` | List markets with ticker, prices, volume, status. Used to identify dual-listed events. |
| `GET /markets/trades` | `api.elections.kalshi.com/trade-api/v2` | Anonymous trade feed: `trade_id`, `ticker`, `yes_price_dollars`, `no_price_dollars`, `taker_side`, `created_time`. Used for aggregate volume/sentiment signals. |
| `GET /markets/{ticker}/orderbook` | `api.elections.kalshi.com/trade-api/v2` | Current orderbook depth. Used for cross-platform price comparison. |
| `GET /events` | `api.elections.kalshi.com/trade-api/v2` | Event groupings and metadata for category mapping. |

### 5.3 API Constraints

| Constraint | Impact | Mitigation |
|---|---|---|
| Polymarket leaderboard returns top ~100 per window | Limited trader universe | Ingest across all 4 windows (1d, 7d, 30d, all) to build a deduplicated set of ~200–300 unique wallets. |
| Activity polling requires per-wallet calls | API budget scales linearly with tracked wallets | Tier polling frequency: top 50 every 5 min, rest every 30 min. Use `since` timestamp to fetch only new activity. |
| Polymarket rate limit ~100 req/min (free tier) | Caps total polling throughput | Stagger requests with jitter. Cache aggressively (5-min TTL for leaderboard, 1-min for trades). |
| Kalshi trades are anonymous | Cannot attribute trades to specific users | Use Kalshi only for market-level aggregates. Clearly label in UI as "Kalshi market data" not trader data. |
| Kalshi rate limits are tiered | May throttle under heavy polling | Cursor-based pagination. Exponential backoff on 429s. Lower refresh frequency (every 15 min). |

---

## 6. System Architecture

### 6.1 Components

| Component | Tech | Responsibility |
|---|---|---|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Leaderboard, trade feed, trader profiles, filters, alert config. Robinhood-inspired light UI. |
| Backend API | Next.js API Routes | Serve aggregated data, proxy platform APIs, handle user auth for alert prefs. |
| Data Ingestion | Vercel Cron Jobs | Scheduled polling: Polymarket leaderboard + per-wallet activity, Kalshi market stats. |
| Database | Supabase (PostgreSQL) | Traders, trades, markets, alert subscriptions, leaderboard snapshots. |
| Cache | Vercel KV (Redis) | Hot leaderboard + recent trades. Sub-10ms reads. |
| Notifications | Resend (email) + webhook dispatcher | Trade alerts on new activity from tracked wallets. |

### 6.2 Ingestion Flow

1. **Leaderboard Sync (every 15 min):** `GET /v1/leaderboard` across all windows. Upsert trader records.
2. **Activity Polling (every 5 min for top 50):** `GET /activity?address={wallet}&since={last_ts}`. Insert new trades.
3. **Extended Activity Polling (every 30 min for wallets 51–300):** Same endpoint, lower frequency.
4. **Kalshi Market Sync (every 15 min):** `GET /markets` and `GET /markets/trades` for aggregate stats. No user attribution.
5. **Market Metadata Refresh (hourly):** Polymarket Gamma API events/markets + Kalshi events. Keep titles, slugs, categories current.
6. **Alert Dispatch:** On new trade insertion for a tracked wallet, check subscriptions and fire webhooks/emails.

### 6.3 Database Schema

**`traders`**
`id`, `wallet_address`, `username`, `profile_image`, `x_username`, `verified`, `total_pnl`, `total_volume`, `win_rate`, `rank_all`, `rank_30d`, `rank_7d`, `rank_1d`, `last_synced_at`
— Polymarket traders only. Unique on `wallet_address`.

**`trades`**
`id`, `trader_id` (FK), `market_slug`, `market_title`, `category`, `side`, `outcome`, `price`, `usdc_size`, `timestamp`, `tx_hash`
— Partitioned by timestamp. Indexed on `(trader_id, timestamp)`.

**`markets`**
`id`, `platform` (polymarket|kalshi), `slug_or_ticker`, `title`, `category`, `outcomes` (JSONB), `current_prices` (JSONB), `volume`, `status`, `resolved_at`
— Both platforms. Used for display context and cross-platform matching.

**`kalshi_trade_stats`**
`id`, `ticker`, `total_volume`, `trade_count`, `last_yes_price`, `last_no_price`, `last_updated`
— Aggregate Kalshi stats per market. No user attribution.

**`alert_subscriptions`**
`id`, `user_id`, `trader_id` (FK), `channel` (webhook|email), `endpoint`, `min_size_usd`, `category_filter`, `cooldown_mins`, `active`
— User alert preferences.

**`leaderboard_snapshots`**
`id`, `window`, `snapshot_data` (JSONB), `captured_at`
— Daily snapshots for historical trend analysis.

---

## 7. Feature Specification

### 7.1 Leaderboard

A clean, sortable table of top Polymarket traders. Default sort: all-time PnL descending. The design follows Robinhood's principle of information density without clutter — generous whitespace, clear type hierarchy, minimal chrome.

- **Columns:** Rank, Username / Wallet (truncated), PnL (green/red), Volume, Win Rate, Markets Traded, Last Active.
- **Filters:** Time window (1d, 7d, 30d, All), Category (Politics, Crypto, Sports, Economics, Other).
- Inline sparkline showing PnL trajectory over the selected window.
- Click-through to trader profile page.

### 7.2 Trade Feed

A reverse-chronological feed of recent trades by tracked Polymarket wallets. Card-based layout, one trade per row, scannable at a glance.

- **Each card:** Trader avatar + name, Market title, Outcome + direction (YES/NO), Price, Size (USDC), Time ago, Current market price for context.
- Colour coding: green background tint for buys, red for sells.
- **Filters:** Category, Trader (multi-select), Min trade size (USDC), Time range.
- Badge indicator for trades from top-10 ranked accounts.
- Near-real-time updates via Supabase Realtime subscriptions on the trades table, or polling with 60s intervals.

### 7.3 Trader Profile

A detail page for each tracked Polymarket wallet, accessible from the leaderboard or a direct URL.

- **Header:** Username, avatar, wallet address (truncated + copy), X/Twitter link, verified badge, "Follow" button for alerts.
- **Stats row:** Total PnL, Volume, Win Rate, Active Markets, Avg Position Size — displayed as large numbers, Robinhood-style.
- **Trade history:** Paginated table with sort by date, size, or market.
- **Category breakdown:** Horizontal bar chart showing volume and accuracy per category.
- **Current positions:** List of open positions with current market price and unrealised PnL.

### 7.4 Cross-Platform Market View

Where the same event exists on both Polymarket and Kalshi, show a side-by-side comparison of prices, volumes, and orderbook depth. This is informational context, not trader-level data from Kalshi.

- Match dual-listed events by title similarity or manual mapping.
- Show: Polymarket YES price vs. Kalshi YES price, volume on each platform, spread differential.
- Highlight when prices diverge by >5% (potential cross-platform signal).

### 7.5 Alerts

Users can subscribe to alerts for specific traders or any top-N trader activity.

- **Channels:** Webhook (for Telegram/Discord bots), Email (via Resend).
- **Config:** Min trade size (USDC), Category filter, Cooldown period.
- **Alert payload:** Trader name, market title, side, price, size, link to market.

---

## 8. UI & Design Direction

The interface takes direct inspiration from Robinhood's design language: a light, airy palette with bold data and minimal ornamentation. The goal is to make numbers feel approachable and scannable, not intimidating.

### 8.1 Design Principles

- **White-dominant background** with `#FFFFFF` surfaces and subtle `#F7F7F7` section breaks.
- **Typography:** One clean sans-serif family throughout. Large, bold numbers for PnL and key stats. Smaller, muted text for labels and metadata.
- **Colour is semantic, not decorative:** Green (`#00C805`) for profit/buys, red (`#FF5000`) for loss/sells. Everything else is greyscale.
- **No borders on cards** — use subtle shadows (`0 2px 8px rgba(0,0,0,0.04)`) and whitespace to separate content.
- **Generous padding and line height.** Nothing feels cramped.
- **Micro-interactions:** Number count-up animations on page load, smooth transitions on filter changes, hover states that reveal secondary info.
- **Mobile-responsive:** The trade feed and leaderboard should be fully usable on a phone-width viewport.

### 8.2 Key UI Components

| Component | Description |
|---|---|
| Stat Card | Large number (24–32px, bold), small muted label below. Green/red for PnL. Used in leaderboard rows and profile headers. |
| Trade Card | Full-width row. Left: avatar + trader name. Centre: market title + outcome badge. Right: price, size, time. Thin green/red left-border accent. |
| Leaderboard Row | Hover highlights row in `#F7F7F7`. Rank number left-aligned, PnL right-aligned. Sparkline inline. |
| Filter Bar | Horizontal pill buttons for time windows. Dropdown selects for category and trader. Sticky on scroll. |
| Profile Header | Avatar, name, wallet badge, stats row beneath. Full-bleed white card with bottom shadow. |
| Cross-Platform Price Bar | Two-column comparison: Polymarket price left, Kalshi right. Green/red delta indicator in the middle. |

---

## 9. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + API routes + Edge Functions. Vercel-native deployment. |
| UI | Tailwind CSS + shadcn/ui (Base UI) | Utility-first styling, composable headless components. |
| Database | Supabase (PostgreSQL + Realtime) | Managed Postgres, row-level security, Realtime for live feed. |
| Cache | Vercel KV (Redis) | Sub-10ms hot reads for leaderboard and recent trades. |
| Cron | Vercel Cron Jobs | Trigger ingestion on schedule, native to hosting. |
| Email | Resend | Transactional email for trade alerts. |
| Charts | Recharts / Lightweight Charts | Sparklines, category breakdowns, price history. |
| Hosting | Vercel | CI/CD from GitHub, edge network, path-based rewrites. |

---

## 10. Milestones

### Phase 1: Polymarket Leaderboard + Feed (Weeks 1–4)

- Supabase schema, seed with Polymarket leaderboard data across all windows.
- Ingestion cron: leaderboard every 15 min, activity for top 50 wallets every 5 min.
- Leaderboard UI with sorting, time-window filter, sparklines.
- Trade feed UI with basic filtering (category, size, trader).
- Deploy to Vercel.

### Phase 2: Trader Profiles + Kalshi Context (Weeks 5–7)

- Trader profile pages with stats, trade history, category breakdown.
- Win-rate and ROI calculations from resolved Polymarket markets.
- Kalshi market data ingestion for dual-listed event comparison.
- Cross-platform price comparison view.

### Phase 3: Alerts + Polish (Weeks 8–10)

- Alert subscription system with webhook and email channels.
- User auth (Supabase Auth) for saving preferences.
- Performance: caching layer, pagination, lazy loading.
- Responsive mobile pass on all views.

### Phase 4: Expansion (Post-Launch)

- Telegram/Discord bot for alert delivery.
- Historical accuracy tracking: did top traders' positions actually resolve profitably?
- Extended wallet tracking (community-submitted wallets beyond the leaderboard).
- Public API for third-party consumers.

---

## 11. Success Metrics

- **Trader coverage:** ≥200 unique Polymarket wallets tracked within 30 days.
- **Data freshness:** Trade feed latency ≤5 minutes from on-chain execution to display.
- **Engagement:** ≥30% of returning users interact with the trade feed or set up an alert.
- **Reliability:** ≥99.5% uptime for ingestion. Zero missed leaderboard syncs per week.
- **API compliance:** Zero rate-limit violations or API key revocations.

---

## 12. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Polymarket deprecates or changes Data API endpoints | High | Pin to known endpoints. Monitor changelog. Adapter layer decouples ingestion logic from API shape. |
| Rate-limit tightening reduces data freshness | Medium | Adaptive polling: increase interval on 429s. Prioritise top-N wallets. Use WebSocket where possible. |
| Leaderboard ceiling (~100 per window) limits trader universe | Medium | Cross-deduplicate across windows. Accept ~200–300 as v1 ceiling. Allow community wallet submissions in Phase 4. |
| Kalshi never exposes a public leaderboard API | Low (already scoped out) | Kalshi is positioned as market-stats-only from v1. No dependency on their leaderboard. |
| Low adoption due to niche audience | Medium | SEO for prediction-market keywords. Post insights to X/Twitter. Embed signals in a Telegram channel. |

---

## 13. Legal & Compliance

- All Polymarket data sourced from publicly documented, unauthenticated API endpoints. Blockchain data on Polygon is inherently public.
- Kalshi public market data endpoints require no authentication. No authenticated (portfolio/order) endpoints are called.
- No financial advice is provided. UI includes a standard disclaimer that past performance does not predict future results.
- No PII collected from end-users beyond email for alert delivery (with consent).
- The tool does not place orders or interact with trading endpoints on any platform.

---

## 14. Open Questions

1. **WebSocket vs. polling:** Polymarket offers WSS for real-time updates but Vercel's serverless model doesn't support long-lived connections. Do we add a lightweight persistent worker (Railway, Fly.io) or accept 1–5 min polling latency?
2. **Hosting budget:** Vercel free tier may suffice for Phase 1 but Supabase row growth and cron frequency may require paid plans by Phase 2. Confirm acceptable monthly spend.
3. **Monetisation intent:** Free tool (portfolio piece), freemium (free leaderboard, paid alerts), or feature within a broader platform?
4. **Dual-listed event matching:** Fuzzy title matching between Polymarket and Kalshi markets, or a manually curated mapping table?
5. **Community wallet submissions:** Should v1 include a mechanism for users to submit wallets they want tracked beyond the leaderboard, or defer to Phase 4?

---

*End of Document*
