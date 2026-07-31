import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User
from customers.models import Customer
from projects.models import Project


@pytest.fixture
def org():
    return Organization.objects.create(name="Acme Inc", slug="acme-inc")


@pytest.fixture
def other_org():
    return Organization.objects.create(name="Other Co", slug="other-co")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="admin@acme.com", email="admin@acme.com", password="testpass123",
        organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def client(admin_user):
    api_client = APIClient()
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.mark.django_db
class TestProjectCRUD:
    def test_create_project(self, client, org):
        response = client.post("/api/projects/", {"name": "Website Redesign", "status": "active"})
        assert response.status_code == 201
        assert Project.objects.filter(organization=org, name="Website Redesign").exists()

    def test_list_only_shows_own_organization(self, client, org, other_org):
        Project.objects.create(organization=org, name="Mine")
        Project.objects.create(organization=other_org, name="Not mine")
        response = client.get("/api/projects/")
        names = [p["name"] for p in response.data["results"]]
        assert "Mine" in names
        assert "Not mine" not in names

    def test_detail_lookup_uses_public_id_not_pk(self, client, org):
        """
        Regression test for the exact bug that broke the original Customer
        module and reappeared in the DeepSeek Projects stub: detail routes
        must resolve by public_id, not the internal integer pk. This test
        deliberately requests the URL by public_id and would fail with a
        404 if lookup_field ever silently reverts to the default.
        """
        project = Project.objects.create(organization=org, name="Q3 Migration")
        response = client.get(f"/api/projects/{project.public_id}/")
        assert response.status_code == 200
        assert response.data["name"] == "Q3 Migration"

    def test_update_by_public_id(self, client, org):
        project = Project.objects.create(organization=org, name="Old Name")
        response = client.patch(f"/api/projects/{project.public_id}/", {"name": "New Name"})
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.name == "New Name"

    def test_delete_by_public_id(self, client, org):
        project = Project.objects.create(organization=org, name="To Delete")
        response = client.delete(f"/api/projects/{project.public_id}/")
        assert response.status_code == 204
        assert not Project.objects.filter(pk=project.pk).exists()

    def test_customer_must_belong_to_same_organization(self, client, org, other_org):
        foreign_customer = Customer.objects.create(
            organization=other_org, name="Foreign Co", email="foreign@example.com"
        )
        response = client.post(
            "/api/projects/",
            {"name": "Cross-org project", "customer": str(foreign_customer.public_id)},
        )
        assert response.status_code == 400

    def test_status_filter(self, client, org):
        Project.objects.create(organization=org, name="Active One", status="active")
        Project.objects.create(organization=org, name="Done One", status="completed")
        response = client.get("/api/projects/?status=active")
        names = [p["name"] for p in response.data["results"]]
        assert names == ["Active One"]
