import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org", slug="test-org-pipeline")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="pipeline-admin@test.com", email="pipeline-admin@test.com",
        password="pass12345", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.mark.django_db
class TestDealPipeline:
    def test_create_deal_defaults_to_lead_stage(self, client):
        resp = client.post("/api/deals/", {"title": "New Deal", "value": 5000})
        assert resp.status_code == 201
        assert resp.data["stage"] == "lead"

    def test_list_is_not_paginated(self, client):
        client.post("/api/deals/", {"title": "Deal A", "value": 1000})
        client.post("/api/deals/", {"title": "Deal B", "value": 2000})
        resp = client.get("/api/deals/")
        assert isinstance(resp.data, list)
        assert len(resp.data) == 2

    def test_dragging_to_new_stage_logs_a_move_specific_audit_entry(self, client):
        create_resp = client.post("/api/deals/", {"title": "Drag Me", "value": 3000})
        public_id = create_resp.data["public_id"]

        client.patch(f"/api/deals/{public_id}/", {"stage": "won"})

        audit_resp = client.get("/api/audit-logs/")
        descriptions = [entry["description"] for entry in audit_resp.data["results"]]
        assert "Moved deal 'Drag Me' to Won" in descriptions

    def test_lookup_uses_public_id_not_integer_pk(self, client):
        create_resp = client.post("/api/deals/", {"title": "Lookup Check", "value": 100})
        public_id = create_resp.data["public_id"]
        resp = client.patch(f"/api/deals/{public_id}/", {"stage": "contacted"})
        assert resp.status_code == 200
