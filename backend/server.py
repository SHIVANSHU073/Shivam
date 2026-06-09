"""
ClutchArena Backend
Real-money esports tournament platform for BGMI and Free Fire MAX.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import string
import bcrypt
import jwt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'clutcharena-dev-secret-change-me')
JWT_ALGO = 'HS256'
JWT_EXPIRE_DAYS = 30
DEV_OTP = '123456'

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="ClutchArena API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("clutcharena")
logging.basicConfig(level=logging.INFO)


# ============== HELPERS ==============
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def new_id(prefix: str = "id") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": now_utc(),
        "exp": now_utc() + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_jwt(token: str) -> Optional[str]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return data.get("sub")
    except Exception:
        return None


async def get_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    # Try JWT first
    uid = decode_jwt(token)
    if uid:
        user = await db.users.find_one({"user_id": uid}, {"_id": 0, "password": 0})
        if user:
            return user
    # Try Emergent session token
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if sess:
        exp = sess.get("expires_at")
        if exp:
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > now_utc():
                user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password": 0})
                if user:
                    return user
    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_admin(user: Dict[str, Any] = Depends(get_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def gen_ref_code(name: str) -> str:
    base = ''.join(c for c in name.upper() if c.isalnum())[:4] or "CLUTCH"
    return base + ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))


def sanitize_user(u: Dict[str, Any]) -> Dict[str, Any]:
    if not u:
        return u
    u.pop("password", None)
    u.pop("_id", None)
    return u


# ============== MODELS ==============
class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    referral_code: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class OtpSendReq(BaseModel):
    phone: str


class OtpVerifyReq(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    referral_code: Optional[str] = None


class GoogleSessionReq(BaseModel):
    session_token: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_base64: Optional[str] = None
    bgmi_id: Optional[str] = None
    ff_id: Optional[str] = None


class KycReq(BaseModel):
    full_name: str
    pan: str
    aadhaar: str
    document_base64: str


class DepositReq(BaseModel):
    amount: float
    method: str = "razorpay"


class WithdrawReq(BaseModel):
    amount: float
    upi_id: str


class TournamentCreate(BaseModel):
    title: str
    game: str  # BGMI / FREEFIRE
    mode: str  # SOLO / DUO / SQUAD
    type: str = "public"  # public / private
    entry_fee: float
    prize_pool: float
    max_slots: int
    per_kill: float = 0
    map_name: Optional[str] = None
    start_time: str  # ISO
    rules: Optional[str] = None
    cover_image: Optional[str] = None
    room_id: Optional[str] = None
    room_password: Optional[str] = None


class TournamentUpdate(BaseModel):
    room_id: Optional[str] = None
    room_password: Optional[str] = None
    status: Optional[str] = None
    winners: Optional[List[Dict[str, Any]]] = None


class RegisterReq(BaseModel):
    tournament_id: str
    team_id: Optional[str] = None
    in_game_name: Optional[str] = None


class TeamCreate(BaseModel):
    name: str
    game: str
    mode: str


class TeamJoin(BaseModel):
    invite_code: str


class ResultUpload(BaseModel):
    tournament_id: str
    kills: int
    position: int
    screenshot_base64: str


class ApproveResultReq(BaseModel):
    result_id: str
    approve: bool
    payout_amount: Optional[float] = None
    kills: Optional[int] = None
    position: Optional[int] = None


class WithdrawalAction(BaseModel):
    withdraw_id: str
    approve: bool
    note: Optional[str] = None


class VipSubscribeReq(BaseModel):
    plan: str = "monthly"  # monthly only for now


    class Config:
        extra = "ignore"


class KycAction(BaseModel):
    user_id: str
    approve: bool
    note: Optional[str] = None


class TicketCreate(BaseModel):
    subject: str
    message: str
    category: str = "general"


class TicketReply(BaseModel):
    ticket_id: str
    message: str


class BannerCreate(BaseModel):
    title: str
    image_base64: str
    link: Optional[str] = None
    active: bool = True


class CouponCreate(BaseModel):
    code: str
    discount_percent: float
    max_amount: Optional[float] = None
    expires_at: Optional[str] = None
    active: bool = True


class NotificationCreate(BaseModel):
    title: str
    message: str
    target: str = "all"  # all / user_id
    user_id: Optional[str] = None


# ============== AUTH ==============
async def create_user(
    name: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    password_hash: Optional[str] = None,
    referral_code: Optional[str] = None,
    picture: Optional[str] = None,
    role: str = "user",
) -> Dict[str, Any]:
    uid = new_id("usr")
    ref_code = gen_ref_code(name)
    while await db.users.find_one({"referral_code": ref_code}):
        ref_code = gen_ref_code(name)
    user = {
        "user_id": uid,
        "name": name,
        "email": email,
        "phone": phone,
        "password": password_hash,
        "avatar_base64": picture,
        "role": role,
        "kyc_status": "not_submitted",  # not_submitted / pending / approved / rejected
        "wallet": {"deposit": 0.0, "winning": 0.0, "bonus": 0.0, "referral": 0.0},
        "referral_code": ref_code,
        "referred_by": None,
        "bgmi_id": None,
        "ff_id": None,
        "vip_active": False,
        "vip_expires_at": None,
        "created_at": now_utc(),
        "device_fingerprints": [],
    }
    # Apply referral bonus
    if referral_code:
        referrer = await db.users.find_one({"referral_code": referral_code})
        if referrer:
            user["referred_by"] = referrer["user_id"]
            user["wallet"]["bonus"] = 50.0
            # VIP referrers earn 2x
            ref_bonus = 50.0 if is_vip(referrer) else 25.0
            await db.users.update_one(
                {"user_id": referrer["user_id"]},
                {"$inc": {"wallet.referral": ref_bonus}},
            )
            await db.transactions.insert_one({
                "tx_id": new_id("tx"),
                "user_id": referrer["user_id"],
                "type": "referral_bonus",
                "amount": ref_bonus,
                "wallet": "referral",
                "status": "success",
                "note": f"Referral bonus from {name}" + (" (2× VIP)" if ref_bonus == 50.0 else ""),
                "created_at": now_utc(),
            })
    await db.users.insert_one(user)
    return sanitize_user(user.copy())


@api.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(
        name=req.name,
        email=req.email,
        phone=req.phone,
        password_hash=hash_pw(req.password),
        referral_code=req.referral_code,
    )
    token = make_jwt(user["user_id"])
    user["created_at"] = iso(user.get("created_at"))
    return {"token": token, "user": user}


@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not user.get("password"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not check_pw(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_jwt(user["user_id"])
    user = sanitize_user(user)
    user["created_at"] = iso(user.get("created_at"))
    return {"token": token, "user": user}


@api.post("/auth/otp/send")
async def otp_send(req: OtpSendReq):
    # MOCK OTP - in production, integrate with Twilio/MSG91
    return {"sent": True, "dev_otp": DEV_OTP, "phone": req.phone}


@api.post("/auth/otp/verify")
async def otp_verify(req: OtpVerifyReq):
    if req.otp != DEV_OTP:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    user = await db.users.find_one({"phone": req.phone}, {"_id": 0})
    if not user:
        name = req.name or f"Player_{req.phone[-4:]}"
        user = await create_user(
            name=name,
            phone=req.phone,
            referral_code=req.referral_code,
        )
    else:
        user = sanitize_user(user)
    token = make_jwt(user["user_id"])
    user["created_at"] = iso(user.get("created_at"))
    return {"token": token, "user": user}


@api.post("/auth/google/session")
async def google_session(req: GoogleSessionReq):
    # Verify session with Emergent
    async with httpx.AsyncClient(timeout=15) as hc:
        try:
            r = await hc.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": req.session_token},
            )
            if r.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google session")
            data = r.json()
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Auth provider error")
    email = data.get("email")
    name = data.get("name") or "Player"
    picture = data.get("picture")
    sess_token = data.get("session_token")
    if not email or not sess_token:
        raise HTTPException(status_code=400, detail="Incomplete session data")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user = await create_user(name=name, email=email, picture=picture)
    else:
        user = sanitize_user(user)
    await db.user_sessions.insert_one({
        "session_token": sess_token,
        "user_id": user["user_id"],
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
    })
    user["created_at"] = iso(user.get("created_at"))
    return {"token": sess_token, "user": user}


@api.get("/auth/me")
async def auth_me(user: Dict[str, Any] = Depends(get_user)):
    user["created_at"] = iso(user.get("created_at"))
    return {"user": user}


@api.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        tok = authorization.split(" ", 1)[1]
        await db.user_sessions.delete_one({"session_token": tok})
    return {"ok": True}


# ============== PROFILE / KYC ==============
@api.patch("/profile")
async def update_profile(req: ProfileUpdate, user=Depends(get_user)):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0})
    fresh["created_at"] = iso(fresh.get("created_at"))
    return fresh


@api.post("/kyc/submit")
async def kyc_submit(req: KycReq, user=Depends(get_user)):
    rec = {
        "kyc_id": new_id("kyc"),
        "user_id": user["user_id"],
        "full_name": req.full_name,
        "pan": req.pan,
        "aadhaar": req.aadhaar,
        "document_base64": req.document_base64,
        "status": "pending",
        "submitted_at": now_utc(),
        "reviewed_at": None,
        "note": None,
    }
    await db.kyc.insert_one(rec)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"kyc_status": "pending"}},
    )
    return {"ok": True, "status": "pending"}


@api.get("/kyc/status")
async def kyc_status(user=Depends(get_user)):
    rec = await db.kyc.find_one({"user_id": user["user_id"]}, {"_id": 0, "document_base64": 0})
    if rec:
        rec["submitted_at"] = iso(rec.get("submitted_at"))
        rec["reviewed_at"] = iso(rec.get("reviewed_at"))
    return {"kyc_status": user.get("kyc_status", "not_submitted"), "record": rec}


# ============== WALLET ==============
@api.get("/wallet")
async def get_wallet(user=Depends(get_user)):
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "wallet": 1})
    w = fresh.get("wallet", {})
    total = sum([w.get(k, 0) for k in ("deposit", "winning", "bonus", "referral")])
    return {"wallet": w, "total": total}


@api.post("/wallet/deposit")
async def deposit(req: DepositReq, user=Depends(get_user)):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    # MOCK Razorpay - in production, create order and verify signature
    tx = {
        "tx_id": new_id("tx"),
        "user_id": user["user_id"],
        "type": "deposit",
        "amount": req.amount,
        "wallet": "deposit",
        "status": "success",
        "method": req.method,
        "note": "Mock deposit (Razorpay placeholder)",
        "created_at": now_utc(),
    }
    await db.transactions.insert_one(tx)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"wallet.deposit": req.amount}},
    )
    return {"ok": True, "tx_id": tx["tx_id"], "amount": req.amount}


@api.post("/wallet/withdraw")
async def withdraw(req: WithdrawReq, user=Depends(get_user)):
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is ₹100")
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if fresh.get("kyc_status") != "approved":
        raise HTTPException(status_code=403, detail="KYC approval required to withdraw")
    winning = fresh["wallet"].get("winning", 0)
    if req.amount > winning:
        raise HTTPException(status_code=400, detail="Insufficient winning balance")
    wid = new_id("wd")
    await db.withdrawals.insert_one({
        "withdraw_id": wid,
        "user_id": user["user_id"],
        "amount": req.amount,
        "upi_id": req.upi_id,
        "status": "pending",
        "created_at": now_utc(),
        "processed_at": None,
        "note": None,
    })
    # Reserve funds
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"wallet.winning": -req.amount}},
    )
    await db.transactions.insert_one({
        "tx_id": new_id("tx"),
        "user_id": user["user_id"],
        "type": "withdraw_request",
        "amount": -req.amount,
        "wallet": "winning",
        "status": "pending",
        "note": f"Withdrawal to {req.upi_id}",
        "ref_id": wid,
        "created_at": now_utc(),
    })
    return {"ok": True, "withdraw_id": wid, "status": "pending"}


@api.get("/wallet/transactions")
async def transactions(user=Depends(get_user), limit: int = 50):
    docs = await db.transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
    return {"transactions": docs}


# ============== TOURNAMENTS ==============
@api.get("/tournaments")
async def list_tournaments(game: Optional[str] = None, mode: Optional[str] = None, status: Optional[str] = None):
    q: Dict[str, Any] = {}
    if game:
        q["game"] = game.upper()
    if mode:
        q["mode"] = mode.upper()
    if status:
        q["status"] = status
    docs = await db.tournaments.find(q, {"_id": 0, "room_id": 0, "room_password": 0}).sort("start_time", 1).to_list(200)
    for d in docs:
        d["start_time"] = iso(d.get("start_time"))
        d["created_at"] = iso(d.get("created_at"))
        d["registered"] = await db.registrations.count_documents({"tournament_id": d["tournament_id"]})
    return {"tournaments": docs}


@api.get("/tournaments/{tid}")
async def get_tournament(tid: str, user=Depends(get_user)):
    t = await db.tournaments.find_one({"tournament_id": tid}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    reg = await db.registrations.find_one(
        {"tournament_id": tid, "user_id": user["user_id"]}, {"_id": 0}
    )
    # Hide room creds unless registered AND tournament started
    if not reg or t.get("status") not in ("live", "completed"):
        t.pop("room_id", None)
        t.pop("room_password", None)
    t["start_time"] = iso(t.get("start_time"))
    t["created_at"] = iso(t.get("created_at"))
    t["registered_count"] = await db.registrations.count_documents({"tournament_id": tid})
    t["is_registered"] = bool(reg)
    if reg:
        reg["registered_at"] = iso(reg.get("registered_at"))
        t["my_registration"] = reg
    return t


@api.post("/tournaments/register")
async def register_tournament(req: RegisterReq, user=Depends(get_user)):
    t = await db.tournaments.find_one({"tournament_id": req.tournament_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if t.get("status") not in ("upcoming",):
        raise HTTPException(status_code=400, detail="Registration closed")
    existing = await db.registrations.find_one(
        {"tournament_id": req.tournament_id, "user_id": user["user_id"]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    count = await db.registrations.count_documents({"tournament_id": req.tournament_id})
    if count >= t["max_slots"]:
        raise HTTPException(status_code=400, detail="Tournament full")
    # Deduct entry fee from wallets (bonus -> deposit -> winning)
    raw_fee = float(t.get("entry_fee", 0))
    # VIP gets 10% off
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    vip = is_vip(fresh)
    fee = round(raw_fee * 0.9, 2) if vip else raw_fee
    w = fresh["wallet"]
    total = w["deposit"] + w["winning"] + w["bonus"]
    if fee > total:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    remaining = fee
    deductions = {"bonus": 0.0, "deposit": 0.0, "winning": 0.0}
    for key in ("bonus", "deposit", "winning"):
        if remaining <= 0:
            break
        avail = w.get(key, 0)
        take = min(avail, remaining)
        deductions[key] = take
        remaining -= take
    inc = {f"wallet.{k}": -v for k, v in deductions.items() if v > 0}
    if inc:
        await db.users.update_one({"user_id": user["user_id"]}, {"$inc": inc})
    slot = count + 1
    reg = {
        "registration_id": new_id("reg"),
        "tournament_id": req.tournament_id,
        "user_id": user["user_id"],
        "team_id": req.team_id,
        "in_game_name": req.in_game_name or user.get("name"),
        "slot": slot,
        "fee_paid": fee,
        "registered_at": now_utc(),
    }
    await db.registrations.insert_one(reg)
    if fee > 0:
        await db.transactions.insert_one({
            "tx_id": new_id("tx"),
            "user_id": user["user_id"],
            "type": "tournament_entry",
            "amount": -fee,
            "wallet": "mixed",
            "status": "success",
            "note": f"Joined {t['title']} (slot #{slot})",
            "ref_id": req.tournament_id,
            "created_at": now_utc(),
        })
    return {"ok": True, "slot": slot, "registration_id": reg["registration_id"]}


@api.post("/admin/tournaments")
async def admin_create_tournament(req: TournamentCreate, admin=Depends(require_admin)):
    try:
        start_dt = datetime.fromisoformat(req.start_time.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid start_time format")
    t = req.dict()
    t["tournament_id"] = new_id("tour")
    t["start_time"] = start_dt
    t["status"] = "upcoming"
    t["winners"] = []
    t["created_at"] = now_utc()
    t["created_by"] = admin["user_id"]
    t["game"] = t["game"].upper()
    t["mode"] = t["mode"].upper()
    await db.tournaments.insert_one(t)
    t["start_time"] = iso(t["start_time"])
    t["created_at"] = iso(t["created_at"])
    t.pop("_id", None)
    return t


@api.patch("/admin/tournaments/{tid}")
async def admin_update_tournament(tid: str, req: TournamentUpdate, admin=Depends(require_admin)):
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if updates:
        await db.tournaments.update_one({"tournament_id": tid}, {"$set": updates})
        # If marked live, notify all registered users
        if updates.get("status") == "live":
            regs = await db.registrations.find({"tournament_id": tid}, {"_id": 0, "user_id": 1}).to_list(1000)
            t = await db.tournaments.find_one({"tournament_id": tid}, {"_id": 0, "title": 1})
            for r in regs:
                await db.notifications.insert_one({
                    "notification_id": new_id("ntf"),
                    "user_id": r["user_id"],
                    "title": "Tournament is LIVE",
                    "message": f"{t['title']} room credentials are now available.",
                    "read": False,
                    "created_at": now_utc(),
                })
    return {"ok": True}


@api.get("/my/tournaments")
async def my_tournaments(user=Depends(get_user)):
    regs = await db.registrations.find({"user_id": user["user_id"]}, {"_id": 0}).sort("registered_at", -1).to_list(200)
    out = []
    for r in regs:
        t = await db.tournaments.find_one({"tournament_id": r["tournament_id"]}, {"_id": 0, "room_id": 0, "room_password": 0})
        if t:
            t["start_time"] = iso(t.get("start_time"))
            t["created_at"] = iso(t.get("created_at"))
            r["registered_at"] = iso(r.get("registered_at"))
            out.append({"tournament": t, "registration": r})
    return {"items": out}


# ============== TEAMS ==============
@api.post("/teams")
async def create_team(req: TeamCreate, user=Depends(get_user)):
    invite = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    team = {
        "team_id": new_id("tm"),
        "name": req.name,
        "game": req.game.upper(),
        "mode": req.mode.upper(),
        "captain_id": user["user_id"],
        "members": [user["user_id"]],
        "invite_code": invite,
        "created_at": now_utc(),
    }
    await db.teams.insert_one(team)
    team["created_at"] = iso(team["created_at"])
    team.pop("_id", None)
    return team


@api.post("/teams/join")
async def join_team(req: TeamJoin, user=Depends(get_user)):
    team = await db.teams.find_one({"invite_code": req.invite_code.upper()}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if user["user_id"] in team["members"]:
        return {"ok": True, "team_id": team["team_id"], "note": "Already member"}
    max_size = {"SOLO": 1, "DUO": 2, "SQUAD": 4}.get(team["mode"], 4)
    if len(team["members"]) >= max_size:
        raise HTTPException(status_code=400, detail="Team is full")
    await db.teams.update_one({"team_id": team["team_id"]}, {"$push": {"members": user["user_id"]}})
    return {"ok": True, "team_id": team["team_id"]}


@api.get("/teams")
async def my_teams(user=Depends(get_user)):
    teams = await db.teams.find({"members": user["user_id"]}, {"_id": 0}).to_list(50)
    for t in teams:
        t["created_at"] = iso(t.get("created_at"))
    return {"teams": teams}


# ============== RESULTS ==============
@api.post("/results")
async def upload_result(req: ResultUpload, user=Depends(get_user)):
    reg = await db.registrations.find_one(
        {"tournament_id": req.tournament_id, "user_id": user["user_id"]}
    )
    if not reg:
        raise HTTPException(status_code=400, detail="Not registered for this tournament")
    existing = await db.results.find_one(
        {"tournament_id": req.tournament_id, "user_id": user["user_id"]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Result already submitted")
    rec = {
        "result_id": new_id("res"),
        "tournament_id": req.tournament_id,
        "user_id": user["user_id"],
        "kills": req.kills,
        "position": req.position,
        "screenshot_base64": req.screenshot_base64,
        "status": "pending",
        "payout": 0.0,
        "submitted_at": now_utc(),
        "reviewed_at": None,
    }
    await db.results.insert_one(rec)
    return {"ok": True, "result_id": rec["result_id"]}


@api.get("/results/my")
async def my_results(user=Depends(get_user)):
    docs = await db.results.find({"user_id": user["user_id"]}, {"_id": 0, "screenshot_base64": 0}).sort("submitted_at", -1).to_list(200)
    for d in docs:
        d["submitted_at"] = iso(d.get("submitted_at"))
        d["reviewed_at"] = iso(d.get("reviewed_at"))
        t = await db.tournaments.find_one({"tournament_id": d["tournament_id"]}, {"_id": 0, "title": 1, "game": 1, "mode": 1})
        d["tournament"] = t
    return {"results": docs}


# ============== LEADERBOARD ==============
@api.get("/leaderboard")
async def leaderboard(period: str = "all"):
    # period: daily / weekly / monthly / all
    now = now_utc()
    since = None
    if period == "daily":
        since = now - timedelta(days=1)
    elif period == "weekly":
        since = now - timedelta(days=7)
    elif period == "monthly":
        since = now - timedelta(days=30)
    match: Dict[str, Any] = {"status": "approved"}
    if since:
        match["reviewed_at"] = {"$gte": since}
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$user_id",
            "total_kills": {"$sum": "$kills"},
            "total_winnings": {"$sum": "$payout"},
            "matches": {"$sum": 1},
            "best_position": {"$min": "$position"},
        }},
        {"$sort": {"total_winnings": -1, "total_kills": -1}},
        {"$limit": 50},
    ]
    rows = await db.results.aggregate(pipeline).to_list(50)
    out = []
    for i, r in enumerate(rows):
        u = await db.users.find_one({"user_id": r["_id"]}, {"_id": 0, "name": 1, "avatar_base64": 1})
        out.append({
            "rank": i + 1,
            "user_id": r["_id"],
            "name": u["name"] if u else "Player",
            "avatar_base64": u.get("avatar_base64") if u else None,
            "total_kills": r["total_kills"],
            "total_winnings": r["total_winnings"],
            "matches": r["matches"],
            "best_position": r["best_position"],
        })
    return {"period": period, "leaderboard": out}


# ============== REFERRAL ==============
@api.get("/referral")
async def referral_dashboard(user=Depends(get_user)):
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    refs = await db.users.find({"referred_by": user["user_id"]}, {"_id": 0, "name": 1, "created_at": 1}).to_list(200)
    for r in refs:
        r["created_at"] = iso(r.get("created_at"))
    total_earned = await db.transactions.aggregate([
        {"$match": {"user_id": user["user_id"], "type": "referral_bonus", "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    earned = total_earned[0]["total"] if total_earned else 0
    return {
        "referral_code": fresh["referral_code"],
        "referrals": refs,
        "count": len(refs),
        "total_earned": earned,
        "share_message": f"Join ClutchArena! Use my code {fresh['referral_code']} and get ₹50 bonus. Play BGMI & Free Fire tournaments for real cash!",
    }


# ============== SUPPORT TICKETS ==============
@api.post("/support/tickets")
async def create_ticket(req: TicketCreate, user=Depends(get_user)):
    tk = {
        "ticket_id": new_id("tkt"),
        "user_id": user["user_id"],
        "subject": req.subject,
        "category": req.category,
        "status": "open",
        "messages": [{"from": "user", "message": req.message, "at": now_utc()}],
        "created_at": now_utc(),
    }
    await db.tickets.insert_one(tk)
    tk["created_at"] = iso(tk["created_at"])
    for m in tk["messages"]:
        m["at"] = iso(m["at"])
    tk.pop("_id", None)
    return tk


@api.get("/support/tickets")
async def list_tickets(user=Depends(get_user)):
    docs = await db.tickets.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
        for m in d.get("messages", []):
            m["at"] = iso(m.get("at"))
    return {"tickets": docs}


@api.post("/support/reply")
async def reply_ticket(req: TicketReply, user=Depends(get_user)):
    tk = await db.tickets.find_one({"ticket_id": req.ticket_id})
    if not tk:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if user["role"] != "admin" and tk["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    msg = {"from": "admin" if user["role"] == "admin" else "user", "message": req.message, "at": now_utc()}
    await db.tickets.update_one(
        {"ticket_id": req.ticket_id},
        {"$push": {"messages": msg}, "$set": {"status": "replied" if user["role"] == "admin" else "open"}},
    )
    return {"ok": True}


# ============== NOTIFICATIONS ==============
@api.get("/notifications")
async def list_notifications(user=Depends(get_user)):
    docs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
    return {"notifications": docs}


@api.post("/notifications/read-all")
async def read_all(user=Depends(get_user)):
    await db.notifications.update_many({"user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ============== BANNERS ==============
@api.get("/banners")
async def list_banners():
    docs = await db.banners.find({"active": True}, {"_id": 0}).to_list(20)
    return {"banners": docs}


@api.post("/admin/banners")
async def admin_create_banner(req: BannerCreate, admin=Depends(require_admin)):
    b = req.dict()
    b["banner_id"] = new_id("bnr")
    b["created_at"] = now_utc()
    await db.banners.insert_one(b)
    b["created_at"] = iso(b["created_at"])
    b.pop("_id", None)
    return b


# ============== ADMIN ==============
@api.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_tournaments = await db.tournaments.count_documents({})
    live_tournaments = await db.tournaments.count_documents({"status": "live"})
    pending_kyc = await db.kyc.count_documents({"status": "pending"})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    pending_results = await db.results.count_documents({"status": "pending"})
    # Deposits total
    dep = await db.transactions.aggregate([
        {"$match": {"type": "deposit", "status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    deposits_total = dep[0]["total"] if dep else 0
    return {
        "total_users": total_users,
        "total_tournaments": total_tournaments,
        "live_tournaments": live_tournaments,
        "pending_kyc": pending_kyc,
        "pending_withdrawals": pending_withdrawals,
        "pending_results": pending_results,
        "deposits_total": deposits_total,
    }


@api.get("/admin/users")
async def admin_users(admin=Depends(require_admin), q: Optional[str] = None):
    query: Dict[str, Any] = {}
    if q:
        query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}, {"phone": {"$regex": q}}]}
    docs = await db.users.find(query, {"_id": 0, "password": 0, "avatar_base64": 0}).sort("created_at", -1).limit(200).to_list(200)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
    return {"users": docs}


@api.get("/admin/withdrawals")
async def admin_withdrawals(admin=Depends(require_admin), status: Optional[str] = "pending"):
    q = {"status": status} if status else {}
    docs = await db.withdrawals.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
        d["processed_at"] = iso(d.get("processed_at"))
        u = await db.users.find_one({"user_id": d["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        d["user"] = u
    return {"withdrawals": docs}


@api.post("/admin/withdrawals/action")
async def admin_withdrawal_action(req: WithdrawalAction, admin=Depends(require_admin)):
    wd = await db.withdrawals.find_one({"withdraw_id": req.withdraw_id})
    if not wd:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if wd["status"] != "pending":
        raise HTTPException(status_code=400, detail="Already processed")
    status = "approved" if req.approve else "rejected"
    await db.withdrawals.update_one(
        {"withdraw_id": req.withdraw_id},
        {"$set": {"status": status, "note": req.note, "processed_at": now_utc()}},
    )
    if not req.approve:
        # Refund to winning wallet
        await db.users.update_one(
            {"user_id": wd["user_id"]},
            {"$inc": {"wallet.winning": wd["amount"]}},
        )
    await db.transactions.insert_one({
        "tx_id": new_id("tx"),
        "user_id": wd["user_id"],
        "type": "withdraw_" + status,
        "amount": -wd["amount"] if req.approve else wd["amount"],
        "wallet": "winning",
        "status": "success",
        "note": req.note or f"Withdrawal {status}",
        "ref_id": wd["withdraw_id"],
        "created_at": now_utc(),
    })
    await db.notifications.insert_one({
        "notification_id": new_id("ntf"),
        "user_id": wd["user_id"],
        "title": f"Withdrawal {status.title()}",
        "message": f"Your ₹{wd['amount']} withdrawal has been {status}.",
        "read": False,
        "created_at": now_utc(),
    })
    return {"ok": True}


@api.get("/admin/kyc")
async def admin_kyc_list(admin=Depends(require_admin), status: str = "pending"):
    docs = await db.kyc.find({"status": status}, {"_id": 0}).sort("submitted_at", -1).to_list(200)
    for d in docs:
        d["submitted_at"] = iso(d.get("submitted_at"))
        d["reviewed_at"] = iso(d.get("reviewed_at"))
        u = await db.users.find_one({"user_id": d["user_id"]}, {"_id": 0, "name": 1, "email": 1, "phone": 1})
        d["user"] = u
    return {"kyc": docs}


@api.post("/admin/kyc/action")
async def admin_kyc_action(req: KycAction, admin=Depends(require_admin)):
    status = "approved" if req.approve else "rejected"
    await db.kyc.update_one(
        {"user_id": req.user_id, "status": "pending"},
        {"$set": {"status": status, "reviewed_at": now_utc(), "note": req.note}},
    )
    await db.users.update_one({"user_id": req.user_id}, {"$set": {"kyc_status": status}})
    await db.notifications.insert_one({
        "notification_id": new_id("ntf"),
        "user_id": req.user_id,
        "title": f"KYC {status.title()}",
        "message": f"Your KYC has been {status}.",
        "read": False,
        "created_at": now_utc(),
    })
    return {"ok": True}


@api.get("/admin/results")
async def admin_results_list(admin=Depends(require_admin), status: str = "pending"):
    docs = await db.results.find({"status": status}, {"_id": 0}).sort("submitted_at", -1).to_list(200)
    for d in docs:
        d["submitted_at"] = iso(d.get("submitted_at"))
        d["reviewed_at"] = iso(d.get("reviewed_at"))
        u = await db.users.find_one({"user_id": d["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        t = await db.tournaments.find_one({"tournament_id": d["tournament_id"]}, {"_id": 0, "title": 1, "per_kill": 1, "prize_pool": 1})
        d["user"] = u
        d["tournament"] = t
    return {"results": docs}


@api.post("/admin/results/action")
async def admin_results_action(req: ApproveResultReq, admin=Depends(require_admin)):
    rec = await db.results.find_one({"result_id": req.result_id})
    if not rec:
        raise HTTPException(status_code=404, detail="Result not found")
    if rec["status"] != "pending":
        raise HTTPException(status_code=400, detail="Already reviewed")
    status = "approved" if req.approve else "rejected"
    payout = float(req.payout_amount or 0)
    upd = {"status": status, "reviewed_at": now_utc(), "payout": payout}
    if req.kills is not None:
        upd["kills"] = req.kills
    if req.position is not None:
        upd["position"] = req.position
    await db.results.update_one({"result_id": req.result_id}, {"$set": upd})
    if req.approve and payout > 0:
        await db.users.update_one(
            {"user_id": rec["user_id"]},
            {"$inc": {"wallet.winning": payout}},
        )
        await db.transactions.insert_one({
            "tx_id": new_id("tx"),
            "user_id": rec["user_id"],
            "type": "tournament_prize",
            "amount": payout,
            "wallet": "winning",
            "status": "success",
            "note": f"Prize money credited",
            "ref_id": rec["tournament_id"],
            "created_at": now_utc(),
        })
    await db.notifications.insert_one({
        "notification_id": new_id("ntf"),
        "user_id": rec["user_id"],
        "title": f"Result {status.title()}",
        "message": f"Your match result was {status}." + (f" ₹{payout} credited to winning wallet." if payout > 0 else ""),
        "read": False,
        "created_at": now_utc(),
    })
    return {"ok": True}


@api.post("/admin/notify")
async def admin_notify(req: NotificationCreate, admin=Depends(require_admin)):
    if req.target == "all":
        users = await db.users.find({}, {"_id": 0, "user_id": 1}).to_list(10000)
        for u in users:
            await db.notifications.insert_one({
                "notification_id": new_id("ntf"),
                "user_id": u["user_id"],
                "title": req.title,
                "message": req.message,
                "read": False,
                "created_at": now_utc(),
            })
    elif req.user_id:
        await db.notifications.insert_one({
            "notification_id": new_id("ntf"),
            "user_id": req.user_id,
            "title": req.title,
            "message": req.message,
            "read": False,
            "created_at": now_utc(),
        })
    return {"ok": True}


@api.get("/admin/tickets")
async def admin_tickets(admin=Depends(require_admin)):
    docs = await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        d["created_at"] = iso(d.get("created_at"))
        for m in d.get("messages", []):
            m["at"] = iso(m.get("at"))
        u = await db.users.find_one({"user_id": d["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        d["user"] = u
    return {"tickets": docs}


# ============== VIP MEMBERSHIP ==============
VIP_PRICE = 99.0
VIP_DAYS = 30


def is_vip(user: Dict[str, Any]) -> bool:
    if not user.get("vip_active"):
        return False
    exp = user.get("vip_expires_at")
    if not exp:
        return False
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now_utc()


@api.post("/vip/subscribe")
async def vip_subscribe(user=Depends(get_user), req: Optional[VipSubscribeReq] = None):
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    w = fresh["wallet"]
    total = w["deposit"] + w["winning"] + w["bonus"]
    if total < VIP_PRICE:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Need ₹{VIP_PRICE}")
    # Deduct from wallets (bonus -> deposit -> winning)
    remaining = VIP_PRICE
    deductions = {"bonus": 0.0, "deposit": 0.0, "winning": 0.0}
    for key in ("bonus", "deposit", "winning"):
        if remaining <= 0:
            break
        avail = w.get(key, 0)
        take = min(avail, remaining)
        deductions[key] = take
        remaining -= take
    inc = {f"wallet.{k}": -v for k, v in deductions.items() if v > 0}
    # Extend if already active
    base = fresh.get("vip_expires_at")
    if base and base.tzinfo is None:
        base = base.replace(tzinfo=timezone.utc)
    start = base if base and base > now_utc() else now_utc()
    new_exp = start + timedelta(days=VIP_DAYS)
    upd = {"vip_active": True, "vip_expires_at": new_exp}
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": inc, "$set": upd},
    )
    await db.transactions.insert_one({
        "tx_id": new_id("tx"),
        "user_id": user["user_id"],
        "type": "vip_subscription",
        "amount": -VIP_PRICE,
        "wallet": "mixed",
        "status": "success",
        "note": "VIP Membership (30 days)",
        "created_at": now_utc(),
    })
    await db.notifications.insert_one({
        "notification_id": new_id("ntf"),
        "user_id": user["user_id"],
        "title": "Welcome to VIP! 🏆",
        "message": "You now get 10% off entry fees, 2x referral earnings, and access to exclusive private tournaments.",
        "read": False,
        "created_at": now_utc(),
    })
    return {"ok": True, "vip_expires_at": iso(new_exp), "perks": {
        "entry_fee_discount_percent": 10,
        "referral_multiplier": 2,
        "exclusive_tournaments": True,
    }}


@api.get("/vip/status")
async def vip_status(user=Depends(get_user)):
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    active = is_vip(fresh)
    return {
        "active": active,
        "expires_at": iso(fresh.get("vip_expires_at")) if active else None,
        "price": VIP_PRICE,
        "duration_days": VIP_DAYS,
        "perks": [
            "10% discount on tournament entry fees",
            "2× referral earnings (₹50 per friend instead of ₹25)",
            "Access to exclusive VIP-only private tournaments",
            "Priority customer support",
            "Animated VIP badge on profile & leaderboard",
        ],
    }


# ============== HEALTH ==============
@api.get("/")
async def root():
    return {"app": "ClutchArena", "status": "ok", "time": iso(now_utc())}


# ============== STARTUP ==============
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True, partialFilterExpression={"email": {"$type": "string"}})
    await db.users.create_index("phone", unique=True, partialFilterExpression={"phone": {"$type": "string"}})
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("referral_code", unique=True, partialFilterExpression={"referral_code": {"$type": "string"}})
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.tournaments.create_index("tournament_id", unique=True)
    await db.registrations.create_index([("tournament_id", 1), ("user_id", 1)], unique=True)
    await db.transactions.create_index("user_id")
    await db.notifications.create_index("user_id")

    # Seed admin
    admin = await db.users.find_one({"email": "admin@clutcharena.com"})
    if not admin:
        await create_user(
            name="Admin",
            email="admin@clutcharena.com",
            password_hash=hash_pw("Admin@123"),
            role="admin",
        )
        logger.info("Seeded admin user")

    # Seed test player
    player = await db.users.find_one({"email": "player@clutcharena.com"})
    if not player:
        p = await create_user(
            name="ProGamer",
            email="player@clutcharena.com",
            password_hash=hash_pw("Player@123"),
        )
        # Add some balance to test wallet
        await db.users.update_one(
            {"user_id": p["user_id"]},
            {"$set": {"wallet.deposit": 500.0, "wallet.winning": 250.0, "wallet.bonus": 100.0, "kyc_status": "approved"}},
        )
        logger.info("Seeded test player")

    # Seed sample tournaments
    count = await db.tournaments.count_documents({})
    if count == 0:
        admin_doc = await db.users.find_one({"email": "admin@clutcharena.com"})
        admin_id = admin_doc["user_id"] if admin_doc else "admin"
        samples = [
            {
                "title": "BGMI Daily Squad Showdown",
                "game": "BGMI",
                "mode": "SQUAD",
                "type": "public",
                "entry_fee": 50,
                "prize_pool": 5000,
                "max_slots": 100,
                "per_kill": 10,
                "map_name": "Erangel",
                "start_time": now_utc() + timedelta(hours=4),
                "rules": "1. No emulators\n2. No teaming\n3. Screenshot mandatory\n4. Decision of admins is final",
                "status": "upcoming",
                "room_id": "ROOM12345",
                "room_password": "clutch99",
            },
            {
                "title": "Free Fire MAX Solo Battle",
                "game": "FREEFIRE",
                "mode": "SOLO",
                "type": "public",
                "entry_fee": 25,
                "prize_pool": 2500,
                "max_slots": 48,
                "per_kill": 5,
                "map_name": "Bermuda",
                "start_time": now_utc() + timedelta(hours=2),
                "rules": "1. Headshots only mode disabled\n2. No glitches",
                "status": "upcoming",
            },
            {
                "title": "BGMI Duo Cash Cup",
                "game": "BGMI",
                "mode": "DUO",
                "type": "public",
                "entry_fee": 100,
                "prize_pool": 10000,
                "max_slots": 50,
                "per_kill": 15,
                "map_name": "Sanhok",
                "start_time": now_utc() + timedelta(days=1),
                "rules": "Premium duo cup with verified players only.",
                "status": "upcoming",
            },
            {
                "title": "Free Fire Mega Squad",
                "game": "FREEFIRE",
                "mode": "SQUAD",
                "type": "public",
                "entry_fee": 75,
                "prize_pool": 7500,
                "max_slots": 48,
                "per_kill": 8,
                "map_name": "Purgatory",
                "start_time": now_utc() + timedelta(hours=8),
                "rules": "Squad of 4 required. Use party invite.",
                "status": "upcoming",
            },
            {
                "title": "BGMI Pro League Finals",
                "game": "BGMI",
                "mode": "SQUAD",
                "type": "public",
                "entry_fee": 200,
                "prize_pool": 25000,
                "max_slots": 25,
                "per_kill": 25,
                "map_name": "Miramar",
                "start_time": now_utc() + timedelta(days=2),
                "rules": "Invitational pro league.",
                "status": "upcoming",
            },
        ]
        for s in samples:
            s["tournament_id"] = new_id("tour")
            s["created_by"] = admin_id
            s["created_at"] = now_utc()
            s["winners"] = []
            await db.tournaments.insert_one(s)
        logger.info(f"Seeded {len(samples)} tournaments")

    # Seed banners
    bcount = await db.banners.count_documents({})
    if bcount == 0:
        await db.banners.insert_many([
            {
                "banner_id": new_id("bnr"),
                "title": "Win Big in BGMI Pro League",
                "image_base64": None,
                "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
                "link": None,
                "active": True,
                "created_at": now_utc(),
            },
            {
                "banner_id": new_id("bnr"),
                "title": "Free Fire Daily Tournaments",
                "image_base64": None,
                "image_url": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800",
                "link": None,
                "active": True,
                "created_at": now_utc(),
            },
        ])
        logger.info("Seeded banners")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# Register routers & middleware
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
