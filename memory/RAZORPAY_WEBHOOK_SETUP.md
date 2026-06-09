# Razorpay Webhook Setup Guide

## What it does

The webhook handler at `POST /api/razorpay/webhook` lets your backend receive **async** payment events directly from Razorpay (independent of the client). This means:

- If a user closes the app right after paying, the deposit still gets credited (via `payment.captured`).
- Failed payments are recorded and the user gets a notification.
- Refunds processed from your Razorpay dashboard automatically debit the user's wallet and notify them.

The handler is **idempotent**: replaying the same event ID will not double-credit.

## How to enable

### 1. Open Razorpay Dashboard
- Go to https://dashboard.razorpay.com/app/webhooks
- Click **Add New Webhook**

### 2. Configure URL
- **Webhook URL**: `https://YOUR-DEPLOYED-DOMAIN/api/razorpay/webhook`
  - Replace with your production domain after deploying via the "Publish" button
  - Razorpay does **NOT** call localhost — your app must be publicly reachable
- **Active**: ✅ Yes

### 3. Pick a secret
- Razorpay will let you set a **Secret** (any random string).
- **Copy this secret value** — you'll paste it into the backend `.env`.
- Example: `whsec_aB3xY7zQ1nM8pL4kJ9tR0vW2`

### 4. Subscribe to events
At minimum, enable:
- `payment.captured` — Credits user wallet on successful payment
- `payment.failed` — Marks order failed + sends user notification
- `refund.processed` — Deducts refund from wallet + notifies user
- `refund.created` — Same as above (handled together)

### 5. Save secret to backend
Edit `/app/backend/.env`:
```
RAZORPAY_WEBHOOK_SECRET="whsec_aB3xY7zQ1nM8pL4kJ9tR0vW2"
```
Then restart backend:
```
sudo supervisorctl restart backend
```

### 6. Test from Razorpay dashboard
- Open your webhook in dashboard → **"Send Test Webhook"** button
- Backend should respond `200 OK` with `{"ok": true, ...}`
- If you see `503` → secret not set in `.env`
- If you see `400 Invalid webhook signature` → secret in `.env` doesn't match dashboard

## Security

- Without `RAZORPAY_WEBHOOK_SECRET` set, the endpoint returns `503` and refuses to process anything.
- Every request is verified using **HMAC-SHA256** of the raw body, compared against `X-Razorpay-Signature` header in constant time.
- Invalid signatures are logged to `razorpay_webhooks` collection with `status: "invalid_signature"` for audit.

## What gets stored
- `razorpay_webhooks` collection: every received event (processed / ignored / invalid_signature)
- `razorpay_orders` collection: order status updated to `paid` / `failed` with `credited_via` field (`webhook` vs `client_verify`)
- `transactions` collection: deposit / refund transactions
- `notifications` collection: in-app notifications to user

## Local testing (advanced)

If you want to test locally without deploying:
1. Use a tunnel like `ngrok http 8001` → get a public URL
2. Set the webhook URL in Razorpay dashboard to `https://YOUR-NGROK.ngrok.io/api/razorpay/webhook`
3. Set secret and trigger test webhook from dashboard
