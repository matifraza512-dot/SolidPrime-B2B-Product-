import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAuthFlow:
    def test_register_creates_org_and_admin(self):
        client = APIClient()
        resp = client.post("/api/auth/register/", {
            "organization_name": "New Co", "email": "founder@newco.com",
            "password": "SuperSecret123", "first_name": "Grace",
        })
        assert resp.status_code == 201
        assert resp.data["user"]["role"] == "admin"
        assert "access" in resp.data

    def test_duplicate_email_registration_rejected(self):
        client = APIClient()
        payload = {
            "organization_name": "A", "email": "dup@x.com",
            "password": "SuperSecret123", "first_name": "X",
        }
        client.post("/api/auth/register/", payload)
        resp = client.post("/api/auth/register/", {**payload, "organization_name": "B"})
        assert resp.status_code == 400

    def test_login_returns_role_in_token_claims(self):
        import jwt
        client = APIClient()
        client.post("/api/auth/register/", {
            "organization_name": "A", "email": "u@x.com",
            "password": "SuperSecret123", "first_name": "X",
        })
        resp = client.post("/api/auth/login/", {"email": "u@x.com", "password": "SuperSecret123"})
        assert resp.status_code == 200
        decoded = jwt.decode(resp.data["access"], options={"verify_signature": False})
        assert decoded["role"] == "admin"
