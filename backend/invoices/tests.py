import pytest
from decimal import Decimal
from rest_framework.test import APIClient

from accounts.models import Organization, User
from customers.models import Customer
from .models import Invoice


@pytest.fixture
def org():
    return Organization.objects.create(name="Acme Inc", slug="acme-invoices")


@pytest.fixture
def other_org():
    return Organization.objects.create(name="Other Co", slug="other-co-invoices")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="invoices-admin@test.com", email="invoices-admin@test.com",
        password="pass12345", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.fixture
def customer(org):
    return Customer.objects.create(organization=org, name="Client Co", email="client@example.com")


def invoice_payload(customer_public_id, **overrides):
    payload = {
        "customer": str(customer_public_id),
        "issue_date": "2026-07-01",
        "due_date": "2026-07-31",
        "tax_rate": "10.00",
        "line_items": [
            {"description": "Consulting", "quantity": "10", "unit_price": "100.00"},
            {"description": "Setup fee", "quantity": "1", "unit_price": "50.00"},
        ],
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
class TestInvoices:
    def test_create_invoice_computes_totals_from_line_items(self, client, customer):
        resp = client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        assert resp.status_code == 201
        # subtotal = 10*100 + 1*50 = 1050, tax = 10% = 105, total = 1155
        assert Decimal(resp.data["subtotal"]) == Decimal("1050.00")
        assert Decimal(resp.data["tax_amount"]) == Decimal("105.00")
        assert Decimal(resp.data["total"]) == Decimal("1155.00")

    def test_invoice_numbers_are_sequential_per_organization(self, client, customer):
        first = client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        second = client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        assert first.data["invoice_number"] == "INV-0001"
        assert second.data["invoice_number"] == "INV-0002"

    def test_create_without_line_items_is_rejected(self, client, customer):
        resp = client.post(
            "/api/invoices/", invoice_payload(customer.public_id, line_items=[]), format="json"
        )
        assert resp.status_code == 400

    def test_updating_line_items_recalculates_total(self, client, customer):
        create_resp = client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        public_id = create_resp.data["public_id"]

        patch_resp = client.patch(
            f"/api/invoices/{public_id}/",
            {"line_items": [{"description": "Retainer", "quantity": "1", "unit_price": "500.00"}]},
            format="json",
        )
        assert patch_resp.status_code == 200
        assert Decimal(patch_resp.data["subtotal"]) == Decimal("500.00")
        assert Decimal(patch_resp.data["total"]) == Decimal("550.00")
        assert len(patch_resp.data["line_items"]) == 1

    def test_customer_must_belong_to_same_organization(self, client, other_org):
        foreign_customer = Customer.objects.create(
            organization=other_org, name="Foreign Co", email="foreign@example.com"
        )
        resp = client.post("/api/invoices/", invoice_payload(foreign_customer.public_id), format="json")
        assert resp.status_code == 400

    def test_list_only_shows_own_organization(self, client, customer, other_org):
        client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        other_customer = Customer.objects.create(
            organization=other_org, name="Other Client", email="other@example.com"
        )
        Invoice.objects.create(
            organization=other_org, customer=other_customer, invoice_number="INV-0001",
            issue_date="2026-07-01", due_date="2026-07-31",
        )
        resp = client.get("/api/invoices/")
        assert len(resp.data["results"]) == 1

    def test_delete_by_public_id(self, client, customer):
        create_resp = client.post("/api/invoices/", invoice_payload(customer.public_id), format="json")
        public_id = create_resp.data["public_id"]
        resp = client.delete(f"/api/invoices/{public_id}/")
        assert resp.status_code == 204
        assert not Invoice.objects.filter(public_id=public_id).exists()
