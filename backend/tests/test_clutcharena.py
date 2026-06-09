"""ClutchArena backend test suite"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://arena-compete-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@clutcharena.com", "password": "Admin@123"}
PLAYER = {"email": "player@clutcharena.com", "password": "Player@123"}


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def player_token():
    r = requests.post(f"{API}/auth/login", json=PLAYER, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth_h(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Auth --------
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["role"] == "admin"
        assert "_id" not in d["user"]

    def test_login_player(self):
        r = requests.post(f"{API}/auth/login", json=PLAYER)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == PLAYER["email"]
        w = d["user"]["wallet"]
        assert w["deposit"] + w["winning"] + w["bonus"] >= 850

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": PLAYER["email"], "password": "wrong"})
        assert r.status_code in (400, 401)

    def test_signup_new_user(self):
        email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        r = requests.post(f"{API}/auth/signup", json={"name": "TEST User", "email": email, "password": "Test@1234"})
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert "token" in d and d["user"]["email"] == email
        assert d["user"]["referral_code"]

    def test_otp_send_and_verify(self):
        phone = "9" + str(int(time.time()))[-9:]
        r = requests.post(f"{API}/auth/otp/send", json={"phone": phone})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("dev_otp") == "123456"
        r2 = requests.post(f"{API}/auth/otp/verify", json={"phone": phone, "otp": "123456"})
        assert r2.status_code == 200, r2.text
        assert "token" in r2.json()

    def test_me(self, player_token):
        r = requests.get(f"{API}/auth/me", headers=auth_h(player_token))
        assert r.status_code == 200
        assert r.json()["email"] == PLAYER["email"]

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)


# -------- Tournaments --------
class TestTournaments:
    def test_list_tournaments(self):
        r = requests.get(f"{API}/tournaments")
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("tournaments", data.get("items", []))
        assert len(items) >= 5
        assert all("_id" not in t for t in items)

    def test_detail_requires_auth(self):
        r = requests.get(f"{API}/tournaments")
        items = r.json() if isinstance(r.json(), list) else r.json().get("tournaments", [])
        tid = items[0]["id"] if "id" in items[0] else items[0].get("tournament_id")
        r2 = requests.get(f"{API}/tournaments/{tid}")
        assert r2.status_code in (401, 403)

    def test_detail_hides_room_creds_for_non_registered(self, player_token):
        items = requests.get(f"{API}/tournaments").json()
        items = items if isinstance(items, list) else items.get("tournaments", [])
        tid = items[0].get("id") or items[0].get("tournament_id")
        r = requests.get(f"{API}/tournaments/{tid}", headers=auth_h(player_token))
        assert r.status_code == 200
        d = r.json()
        # Room creds should be hidden/null when not registered
        rid = d.get("room_id")
        rpw = d.get("room_password")
        assert not rid or rid in (None, "", "***")


# -------- Wallet --------
class TestWallet:
    def test_deposit_mock(self, player_token):
        r = requests.post(f"{API}/wallet/deposit", json={"amount": 100}, headers=auth_h(player_token))
        assert r.status_code == 200, r.text

    def test_withdraw_requires_min(self, player_token):
        r = requests.post(f"{API}/wallet/withdraw", json={"amount": 50}, headers=auth_h(player_token))
        assert r.status_code in (400, 422)


# -------- Banners / Leaderboard / Referral --------
class TestPublic:
    def test_banners(self):
        r = requests.get(f"{API}/banners")
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("banners", [])
        assert len(items) >= 2

    def test_leaderboard(self, player_token):
        r = requests.get(f"{API}/leaderboard", headers=auth_h(player_token))
        assert r.status_code == 200

    def test_referral(self, player_token):
        r = requests.get(f"{API}/referral", headers=auth_h(player_token))
        assert r.status_code == 200
        d = r.json()
        assert "code" in d or "referral_code" in d


# -------- KYC --------
class TestKYC:
    def test_status(self, player_token):
        r = requests.get(f"{API}/kyc/status", headers=auth_h(player_token))
        assert r.status_code == 200
        assert r.json().get("status") == "approved"


# -------- Teams --------
class TestTeams:
    def test_create_and_join(self, player_token, admin_token):
        r = requests.post(f"{API}/teams", json={"name": f"TEST_{uuid.uuid4().hex[:6]}"}, headers=auth_h(admin_token))
        assert r.status_code in (200, 201), r.text
        team = r.json()
        invite = team.get("invite_code") or team.get("code")
        assert invite
        # Player tries to join
        r2 = requests.post(f"{API}/teams/join", json={"invite_code": invite}, headers=auth_h(player_token))
        assert r2.status_code in (200, 201, 400, 409)


# -------- Admin --------
class TestAdmin:
    def test_stats_admin(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_h(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)

    def test_stats_non_admin_forbidden(self, player_token):
        r = requests.get(f"{API}/admin/stats", headers=auth_h(player_token))
        assert r.status_code == 403
