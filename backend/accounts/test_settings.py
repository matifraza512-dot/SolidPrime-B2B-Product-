import pytest
from rest_framework.test import APIClient

from accounts.models import NotificationPreference, Organization, User


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org", slug="test-org-settings")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="settings-admin@test.com", email="settings-admin@test.com",
        password="OldPass123!", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def employee_user(org):
    return User.objects.create_user(
        username="settings-employee@test.com", email="settings-employee@test.com",
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
class TestSettings:
    def test_change_password_requires_correct_old_password(self, admin_client):
        resp = admin_client.post("/api/auth/change-password/", {
            "old_password": "WrongPass", "new_password": "NewPass456!",
        })
        assert resp.status_code == 400

    def test_change_password_succeeds_with_correct_old_password(self, admin_client, admin_user):
        resp = admin_client.post("/api/auth/change-password/", {
            "old_password": "OldPass123!", "new_password": "NewPass456!",
        })
        assert resp.status_code == 200
        admin_user.refresh_from_db()
        assert admin_user.check_password("NewPass456!")

    def test_employee_cannot_rename_organization(self, employee_client):
        resp = employee_client.patch("/api/organizations/current/", {"name": "Hacked Inc"})
        assert resp.status_code == 403

    def test_admin_can_rename_organization(self, admin_client, org):
        resp = admin_client.patch("/api/organizations/current/", {"name": "Renamed Corp"})
        assert resp.status_code == 200
        org.refresh_from_db()
        assert org.name == "Renamed Corp"

    def test_notification_preferences_created_lazily_with_defaults(self, admin_client, admin_user):
        resp = admin_client.get("/api/notification-preferences/")
        assert resp.status_code == 200
        assert resp.data["notify_task_assigned"] is True
        assert NotificationPreference.objects.filter(user=admin_user).exists()

    def test_user_cannot_deactivate_self_via_me_endpoint(self, admin_client, admin_user):
        resp = admin_client.patch("/api/auth/me/", {"is_active_member": False})
        assert resp.status_code == 200
        admin_user.refresh_from_db()
        assert admin_user.is_active_member is True
