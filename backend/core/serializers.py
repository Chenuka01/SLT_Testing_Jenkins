from rest_framework import serializers
from .models import User, Project, Credential, ActivityLog, AccessRequest, EnrollmentRequest, BreakGlassEvent
from .utils import encrypt_secret, decrypt_secret

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'slt_employee_id', 'status', 'is_mfa_enabled']

class ProjectSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'department', 'owner', 'owner_details', 'criticality_level', 'created_at']

class CredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credential
        fields = ['id', 'project', 'service_name', 'credential_type', 'username', 'encrypted_secret', 'secret_iv', 'target_url_or_ip', 'rotation_period_days', 'last_rotated_at', 'next_rotation_due', 'is_approval_required', 'created_at']
        extra_kwargs = {
            'encrypted_secret': {'write_only': True},
            'secret_iv': {'read_only': True}
        }

    def create(self, validated_data):
        raw_secret = validated_data.pop('encrypted_secret', None)
        if raw_secret:
            encrypted, iv = encrypt_secret(raw_secret)
            validated_data['encrypted_secret'] = encrypted
            validated_data['secret_iv'] = iv
        return super().create(validated_data)

class AccessRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    credential_name = serializers.ReadOnlyField(source='credential.service_name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = AccessRequest
        fields = ['id', 'credential', 'credential_name', 'user', 'user_name', 'status', 'reason', 'access_duration_minutes', 'approved_by', 'approved_by_name', 'requested_at', 'actioned_at']
        read_only_fields = ['status', 'approved_by', 'actioned_at']

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action_type', 'ip_address', 'user_agent', 'target_credential', 'description', 'timestamp']

class EnrollmentRequestSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.ReadOnlyField(source='reviewed_by.username')

    class Meta:
        model = EnrollmentRequest
        fields = [
            'id', 'slt_employee_id', 'full_name', 'email', 'department',
            'requested_role', 'reason_for_access', 'status', 'reviewed_by',
            'reviewed_by_name', 'requested_at', 'reviewed_at', 'reviewer_notes'
        ]
        read_only_fields = ['status', 'reviewed_by', 'reviewed_at', 'reviewer_notes']

    def validate_slt_employee_id(self, value):
        normalized = value.strip().upper()
        if User.objects.filter(slt_employee_id=normalized).exists():
            raise serializers.ValidationError('A user already exists for this SLT employee ID.')
        if EnrollmentRequest.objects.filter(slt_employee_id=normalized, status='PENDING').exists():
            raise serializers.ValidationError('A pending enrollment request already exists for this SLT employee ID.')
        return normalized

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user already exists for this email address.')
        if EnrollmentRequest.objects.filter(email__iexact=normalized, status='PENDING').exists():
            raise serializers.ValidationError('A pending enrollment request already exists for this email address.')
        return normalized

class BreakGlassEventSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.ReadOnlyField(source='requested_by.username')
    approval_count = serializers.SerializerMethodField()

    class Meta:
        model = BreakGlassEvent
        fields = ['id', 'requested_by', 'requested_by_name', 'reason', 'is_active', 'created_at', 'approved_at', 'approval_count']
        read_only_fields = ['is_active', 'approved_at']

    def get_approval_count(self, obj):
        return obj.approvals.count()
