import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org", slug="test-org")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="admin@test.com", email="admin@test.com", password="pass12345",
        organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def other_org_user():
    org2 = Organization.objects.create(name="Other Org", slug="other-org")
    return User.objects.create_user(
        username="other@test.com", email="other@test.com", password="pass12345",
        organization=org2, role=User.Role.ADMIN,
    )


@pytest.fixture
def client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.mark.django_db
class TestCustomerCRUD:
    def test_create_customer(self, client):
        resp = client.post("/api/customers/", {
            "name": "Acme", "email": "a@acme.com", "status": "lead",
        })
        assert resp.status_code == 201
        assert resp.data["name"] == "Acme"

    def test_list_only_returns_own_org_customers(self, client, admin_user, other_org_user):
        from customers.models import Customer
        Customer.objects.create(organization=admin_user.organization, name="Mine", email="mine@x.com")
        Customer.objects.create(organization=other_org_user.organization, name="Theirs", email="theirs@x.com")

        resp = client.get("/api/customers/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["name"] == "Mine"

    def test_cannot_access_other_org_customer_detail(self, client, other_org_user):
        from customers.models import Customer
        theirs = Customer.objects.create(organization=other_org_user.organization, name="Theirs", email="t@x.com")

        resp = client.get(f"/api/customers/{theirs.pk}/")
        assert resp.status_code in (403, 404)

    def test_duplicate_email_in_same_org_rejected(self, client, admin_user):
        from customers.models import Customer
        Customer.objects.create(organization=admin_user.organization, name="A", email="dup@x.com")
        resp = client.post("/api/customers/", {"name": "B", "email": "dup@x.com"})
        assert resp.status_code == 400

    def test_unauthenticated_request_rejected(self):
        anon = APIClient()
        resp = anon.get("/api/customers/")
        assert resp.status_code == 401
