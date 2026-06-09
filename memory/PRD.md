# ClutchArena - Product Requirements Document

## Overview
ClutchArena is a real-money esports tournament Expo mobile app for **BGMI** and **Free Fire MAX** players in India.

## Tech Stack
- Frontend: Expo Router (React Native), TypeScript, expo-linear-gradient, expo-blur, expo-image-picker, @expo/vector-icons
- Backend: FastAPI + Motor (async MongoDB), bcrypt, PyJWT, httpx
- Storage: MongoDB. Avatars / KYC docs / match screenshots stored as base64 strings.
- Auth: JWT email/password + Mobile OTP (mocked dev_otp `123456`) + Emergent-managed Google session

## Implemented Features
### User
- Signup, login, mobile OTP login
- Profile with tappable avatar upload (expo-image-picker)
- KYC submission with document image upload
- 4-wallet system (deposit / winning / bonus / referral)
- Tournament browsing, filtering by game (BGMI/Free Fire) + mode (Solo/Duo/Squad)
- Tournament registration with multi-wallet fee deduction
- Match result upload with screenshot
- Match history & earnings
- Referral code, share, dashboard
- Support tickets
- Notifications
- Team create / join via invite code

### VIP Membership (₹99 / 30 days)
- 10% discount on tournament entry fees
- 2× referral earnings (₹50 vs ₹25)
- Access reserved for exclusive VIP-only private tournaments
- Animated VIP badge on profile
- Auto-deducted from wallet (bonus → deposit → winning)

### Tournament
- Solo / Duo / Squad
- Public / Private
- Entry fee + Prize pool + per-kill bonus
- Auto slot allocation
- Room ID + password revealed when tournament status = live (registered players only)
- Status tracking (upcoming / live / completed)

### Wallet
- Razorpay deposit — **MOCKED** (needs real Razorpay keys)
- UPI withdraw (KYC + min ₹100 required)
- Transaction history

### Leaderboard
- Daily / Weekly / Monthly / All-time aggregation by winnings & kills
- Top 3 podium + ranked list

### Admin Panel (in-app, admin role only) — EXPANDED
- **Dashboard**: total users, banned users, VIP users, tournaments (total/live/upcoming), pending counts (KYC/withdrawals/results), total revenue, deposits, payouts
- **Tournament Management**: Create with full form (game, mode, type, fee, prize, slots, per-kill, map, start time, registration close, rules, description, banner upload, room creds, publish toggle), Edit, Delete (with auto refund of registered users), Publish/Unpublish, Go LIVE (notifies all registrants)
- **Participants**: View registered players per tournament with details, Approve/Reject (rejection auto-refunds), CSV Export via native Share
- **User Management**: Search by name/email/phone, view full user detail with wallet + lifetime stats, Ban/Unban (admin role protected)
- **Withdrawal Approval**: Approve (pay out) or Reject (auto-refund to winning wallet)
- **KYC Approval**: View pending KYC requests with PAN/Aadhaar, approve/reject
- **Match Result Verification**: View submitted results with screenshots, auto-calculate payout from kills + position, manual override, approve & credit
- **Notifications**: Broadcast to all users or single user, quick presets
- **Analytics**: Revenue bar chart (last 30d), new users bar chart, top 10 tournaments by registrations
- **Activity Logs**: All admin actions logged with timestamp + meta (audit trail)
- **Admin lifetime VIP**: Auto-granted on seed/startup (vip_expires_at = now + 100 years)

## Razorpay (LIVE in test mode)
- Backend env: `RAZORPAY_KEY_ID=rzp_test_SzMvYTrbddV8fA`, `RAZORPAY_KEY_SECRET=...` (set in `/app/backend/.env`)
- Endpoints:
  - `POST /api/wallet/order` — creates Razorpay order, returns `order_id` + `key_id` for checkout
  - `POST /api/wallet/verify` — verifies HMAC-SHA256 signature, credits deposit wallet idempotently
  - `POST /api/wallet/deposit` — legacy mock, kept for backward compat
- Frontend: WebView modal loads `checkout.razorpay.com/v1/checkout.js`, posts result back via `ReactNativeWebView.postMessage`. Works in Expo Go (no native module required).
- Test payment methods:
  - UPI ID: `success@razorpay`
  - Card: `4111 1111 1111 1111`, any CVV, any future expiry


- 🟡 **Razorpay deposit MOCKED** — credits wallet without real payment. Need Razorpay test keys for real flow.
- 🟡 **Mobile OTP MOCKED** — returns dev_otp `123456` in response (integrate Twilio/MSG91 for prod)
- **Google Auth** wired with Emergent backend — works only on deployed builds (not Expo Go preview)
- **Push notifications** not yet integrated — requires Emergent FCM + deployed build

## Test Credentials
See `/app/memory/test_credentials.md`
- Admin: `admin@clutcharena.com` / `Admin@123`
- Player: `player@clutcharena.com` / `Player@123` (₹850 wallet, KYC approved)
- Mobile OTP: any 10-digit phone, OTP = `123456`

## Next Roadmap
1. Real Razorpay integration (user will provide test keys)
2. Push notifications via Emergent FCM (post-deploy)
3. Live tournament chat
4. Tournament brackets / playoffs
5. Anti-cheat detection (device fingerprinting, multi-account flag)
