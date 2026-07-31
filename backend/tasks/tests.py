import pytest
from rest_framework.test import APIClient

from accounts.models import Organization, User
from projects.models import Project
from .models import Task


@pytest.fixture
def org():
    return Organization.objects.create(name="Acme Inc", slug="acme-tasks")


@pytest.fixture
def other_org():
    return Organization.objects.create(name="Other Co", slug="other-co-tasks")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        username="tasks-admin@test.com", email="tasks-admin@test.com",
        password="pass12345", organization=org, role=User.Role.ADMIN,
    )


@pytest.fixture
def client(admin_user):
    c = APIClient()
    c.force_authenticate(user=admin_user)
    return c


@pytest.fixture
def project(org):
    return Project.objects.create(organization=org, name="Website Redesign")


@pytest.mark.django_db
class TestTasks:
    def test_create_task_defaults_to_todo(self, client):
        resp = client.post("/api/tasks/", {"title": "Write API docs"})
        assert resp.status_code == 201
        assert resp.data["status"] == "todo"

    def test_list_is_not_paginated(self, client):
        client.post("/api/tasks/", {"title": "Task A"})
        client.post("/api/tasks/", {"title": "Task B"})
        resp = client.get("/api/tasks/")
        assert isinstance(resp.data, list)
        assert len(resp.data) == 2

    def test_dragging_to_new_status_logs_a_move_specific_audit_entry(self, client):
        create_resp = client.post("/api/tasks/", {"title": "Drag Me"})
        public_id = create_resp.data["public_id"]

        client.patch(f"/api/tasks/{public_id}/", {"status": "done"})
        audit_resp = client.get("/api/audit-logs/")
        descriptions = [entry["description"] for entry in audit_resp.data["results"]]
        assert "Moved task 'Drag Me' to Done" in descriptions

    def test_project_must_belong_to_same_organization(self, client, other_org):
        foreign_project = Project.objects.create(organization=other_org, name="Foreign Project")
        resp = client.post(
            "/api/tasks/", {"title": "Cross-org task", "project": str(foreign_project.public_id)}
        )
        assert resp.status_code == 400

    def test_list_only_shows_own_organization(self, client, org, other_org):
        Task.objects.create(organization=org, title="Mine")
        Task.objects.create(organization=other_org, title="Not mine")
        resp = client.get("/api/tasks/")
        titles = [t["title"] for t in resp.data]
        assert "Mine" in titles
        assert "Not mine" not in titles

    def test_delete_by_public_id(self, client):
        create_resp = client.post("/api/tasks/", {"title": "To Delete"})
        public_id = create_resp.data["public_id"]
        resp = client.delete(f"/api/tasks/{public_id}/")
        assert resp.status_code == 204
        assert not Task.objects.filter(public_id=public_id).exists()
