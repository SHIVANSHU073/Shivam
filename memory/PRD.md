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

### Admin Panel (in-app, admin role only)
- Dashboard stats (users, tournaments, live, pending KYC/withdrawals/deposits)
- Withdrawal approval / rejection (auto-refund on reject)
- KYC approval / rejection
- Match result approval with auto prize credit to winning wallet
- Tournament create/update endpoints
- Notification broadcast

## Mocked / Limitations
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
