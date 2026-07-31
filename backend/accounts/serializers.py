from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import NotificationPreference, Organization, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["public_id", "name", "slug", "created_at"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    """Used for /me and team member listings - never exposes password/username internals."""
    organization = OrganizationSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "public_id", "email", "full_name", "first_name", "last_name",
            "role", "avatar", "phone", "job_title", "organization",
            "is_active_member", "date_joined",
        ]
        read_only_fields = ["public_id", "email", "role", "organization", "date_joined", "is_active_member"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email.split("@")[0]


class TeamMemberSerializer(serializers.ModelSerializer):
    """Admin-facing serializer that DOES allow role changes - separate from
    UserSerializer above so a regular user can never PATCH their own role
    through the /me endpoint (fields simply don't exist on that serializer)."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "public_id", "email", "full_name", "role", "job_title",
            "is_active_member", "date_joined",
        ]
        read_only_fields = ["public_id", "email", "date_joined"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email.split("@")[0]


class RegisterSerializer(serializers.Serializer):
    """
    Registration creates BOTH a new Organization and its first Admin user
    in one atomic transaction - this is the "sign up your company" flow,
    distinct from "accept an invite to an existing org" (future endpoint).
    """
    organization_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_organization_name(self, value):
        slug = slugify(value)
        if Organization.objects.filter(slug=slug).exists():
            raise serializers.ValidationError("An organization with a similar name already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        org = Organization.objects.create(
            name=validated_data["organization_name"],
            slug=slugify(validated_data["organization_name"]),
        )
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data.get("last_name", ""),
            organization=org,
            role=User.Role.ADMIN,
        )
        return user


class BizOpsTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embeds role + org into the JWT payload itself so the frontend can render
    role-gated UI instantly on load without an extra /me round trip, while the
    /me endpoint remains the source of truth for anything security-sensitive."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["org"] = user.organization.slug if user.organization else None
        token["full_name"] = user.get_full_name() or user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class OrganizationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["name"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "notify_deal_won_lost", "notify_task_assigned",
            "notify_customer_created", "email_weekly_digest",
        ]
