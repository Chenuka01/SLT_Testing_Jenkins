from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('SYSTEM_ADMIN', 'System Admin'),
        ('SECOPS', 'SecOps'),
        ('MANAGER', 'Project Manager'),
        ('DEVELOPER', 'Developer'),
        ('READONLY', 'Read Only'),
    )
    slt_employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEVELOPER')
    status = models.CharField(max_length=20, default='Active')  # Active, Suspended, Inactive
    is_mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, null=True, blank=True)
    permissions = models.JSONField(default=dict, blank=True) # Role-based permissions JSON

class Project(models.Model):
    CRITICALITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('MISSION_CRITICAL', 'Mission Critical'),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    criticality_level = models.CharField(max_length=20, choices=CRITICALITY_CHOICES, default='MEDIUM')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Credential(models.Model):
    CREDENTIAL_TYPES = (
        ('PASSWORD', 'Password'),
        ('API_KEY', 'API Key'),
        ('SSH_KEY', 'SSH Key'),
        ('CERTIFICATE', 'Certificate'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='credentials')
    service_name = models.CharField(max_length=255)
    credential_type = models.CharField(max_length=50, choices=CREDENTIAL_TYPES, default='PASSWORD')
    username = models.CharField(max_length=255)
    encrypted_secret = models.TextField()  # Rename from encrypted_password
    secret_iv = models.TextField(null=True, blank=True) # Initialization Vector for AES-GCM
    target_url_or_ip = models.CharField(max_length=255, blank=True, null=True)
    rotation_period_days = models.IntegerField(default=90)
    last_rotated_at = models.DateTimeField(null=True, blank=True)
    next_rotation_due = models.DateTimeField(null=True, blank=True)
    is_approval_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.service_name} ({self.project.name})"

class AccessRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    )
    credential = models.ForeignKey(Credential, on_delete=models.CASCADE, related_name='access_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField()
    access_duration_minutes = models.IntegerField(default=30)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_requests')
    requested_at = models.DateTimeField(auto_now_add=True)
    actioned_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Request for {self.credential} by {self.user} - {self.status}"

class EnrollmentRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    ROLE_CHOICES = User.ROLE_CHOICES

    slt_employee_id = models.CharField(max_length=50)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    department = models.CharField(max_length=255)
    requested_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEVELOPER')
    reason_for_access = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_enrollments')
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.slt_employee_id} - {self.full_name} ({self.status})"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=50) # LOGIN, VIEW_SECRET, ROTATE_SECRET, etc.
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    target_credential = models.ForeignKey(Credential, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action_type} at {self.timestamp}"

class BreakGlassEvent(models.Model):
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='break_glass_requests')
    reason = models.TextField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Break-Glass by {self.requested_by.username} - Active: {self.is_active}"

class BreakGlassApproval(models.Model):
    event = models.ForeignKey(BreakGlassEvent, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE)
    approved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'approver')
