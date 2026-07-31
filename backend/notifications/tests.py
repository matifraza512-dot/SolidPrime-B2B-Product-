import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User
from pipeline.models import Deal
from tasks.models import Task
from .models import Notification


@pytest.fixture
def org():
    return Organization.objects.create(name="Acme Inc", slug="acme-notify")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="notify-admin@test.com", email="notify-admin@test.com",
        password="pass12345", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def teammate(org):
    return User.objects.create_user(
        username="notify-teammate@test.com", email="notify-teammate@test.com",
        password="pass12345", organization=org, role=User.Role.EMPLOYEE,
    )


@pytest.fixture
def client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.mark.django_db
class TestNotifications:
    def test_assigning_a_task_notifies_the_assignee(self, org, teammate):
        Task.objects.create(organization=org, title="Do the thing", assignee=teammate)
        assert Notification.objects.filter(recipient=teammate).exists()

    def test_reassigning_does_not_double_notify_same_person(self, org, teammate):
        task = Task.objects.create(organization=org, title="Do the thing", assignee=teammate)
        task.title = "Renamed but same assignee"
        task.save()
        assert Notification.objects.filter(recipient=teammate).count() == 1

    def test_deal_won_notifies_owner(self, org, teammate):
        deal = Deal.objects.create(organization=org, title="Acme Deal", owner=teammate, stage="proposal")
        deal.stage = "won"
        deal.save()
        assert Notification.objects.filter(recipient=teammate, verb__contains="Won").exists()

    def test_mark_read_endpoint(self, client, admin_user):
        n = Notification.objects.create(recipient=admin_user, verb="Test notification")
        resp = client.post(f"/api/notifications/{n.id}/mark_read/")
        assert resp.status_code == 200
        n.refresh_from_db()
        assert n.is_read is True

    def test_mark_all_read_endpoint(self, client, admin_user):
        Notification.objects.create(recipient=admin_user, verb="One")
        Notification.objects.create(recipient=admin_user, verb="Two")
        resp = client.post("/api/notifications/mark_all_read/")
        assert resp.status_code == 200
        assert Notification.objects.filter(recipient=admin_user, is_read=False).count() == 0

    def test_unread_count_endpoint(self, client, admin_user):
        Notification.objects.create(recipient=admin_user, verb="Unread one")
        resp = client.get("/api/notifications/unread_count/")
        assert resp.data["count"] == 1

    def test_user_only_sees_own_notifications(self, client, admin_user, teammate):
        Notification.objects.create(recipient=teammate, verb="Not yours")
        resp = client.get("/api/notifications/")
        assert len(resp.data) == 0
