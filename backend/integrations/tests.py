import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User
from .models import APIKey


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org", slug="test-org-keys")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="keys-admin@test.com", email="keys-admin@test.com",
        password="pass12345", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def employee_user(org):
    return User.objects.create_user(
        username="keys-employee@test.com", email="keys-employee@test.com",
        password="pass12345", organization=org, role=User.Role.EMPLOYEE,
    )


@pytest.fixture
def admin_client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.fixture
def employee_client(employee_user):
    c = APIClient()
    c.force_authenticate(user=employee_user)
    return c


@pytest.mark.django_db
class TestAPIKeys:
    def test_create_returns_raw_key_once(self, admin_client):
        resp = admin_client.post("/api/api-keys/", {"name": "CI Pipeline"})
        assert resp.status_code == 201
        assert resp.data["raw_key"].startswith("bzk_")

    def test_list_never_exposes_raw_key_or_hash(self, admin_client):
        admin_client.post("/api/api-keys/", {"name": "CI Pipeline"})
        resp = admin_client.get("/api/api-keys/")
        assert "raw_key" not in resp.data[0]
        assert "hashed_key" not in resp.data[0]

    def test_revoke_deactivates_but_keeps_record(self, admin_client):
        create_resp = admin_client.post("/api/api-keys/", {"name": "Old Key"})
        public_id = create_resp.data["public_id"]
        resp = admin_client.post(f"/api/api-keys/{public_id}/revoke/")
        assert resp.status_code == 200
        assert resp.data["is_active"] is False
        assert APIKey.objects.filter(public_id=public_id).exists()

    def test_employee_cannot_manage_keys(self, employee_client):
        resp = employee_client.post("/api/api-keys/", {"name": "Blocked"})
        assert resp.status_code == 403
