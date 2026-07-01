from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import User, Project, Credential, ActivityLog, AccessRequest, EnrollmentRequest, BreakGlassEvent, BreakGlassApproval
from .serializers import (
    UserSerializer, ProjectSerializer, CredentialSerializer, 
    ActivityLogSerializer, AccessRequestSerializer, EnrollmentRequestSerializer, BreakGlassEventSerializer
)
from .utils import decrypt_secret, generate_mfa_secret, get_totp_uri, generate_qr_code_base64, verify_mfa_token

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], url_path='setup-mfa')
    def setup_mfa(self, request):
        username = request.data.get('username', 'admin')
        
        try:
            # Try finding user by username OR employee ID
            user = User.objects.filter(models.Q(username=username) | models.Q(slt_employee_id=username)).first()
            
            if not user:
                return Response({'error': f'User {username} not found'}, status=404)
                
            if not user.mfa_secret:
                user.mfa_secret = generate_mfa_secret()
                user.save()
            
            uri = get_totp_uri(user.username, user.mfa_secret)
            qr_code = generate_qr_code_base64(uri)
            
            return Response({
                'secret': user.mfa_secret,
                'qr_code': qr_code
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'], url_path='verify-mfa')
    def verify_mfa(self, request):
        token = request.data.get('token')
        username = request.data.get('username')
        
        try:
            user = User.objects.filter(models.Q(username=username) | models.Q(slt_employee_id=username)).first()
            
            if not user:
                return Response({'error': 'User not found'}, status=404)

            if not token:
                return Response({'error': 'Token is required'}, status=400)
            
            if verify_mfa_token(user.mfa_secret, token):
                user.is_mfa_enabled = True
                user.save()
                return Response({'status': 'MFA Enabled successfully'})
            else:
                return Response({'error': 'Invalid Token'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else User.objects.filter(username='admin').first()
        serializer.save(owner=user)

class CredentialViewSet(viewsets.ModelViewSet):
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        instance = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action_type="CREATE_CREDENTIAL",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
            target_credential=instance,
            description=f"Created credentials for {instance.service_name} in project {instance.project.name}"
        )

    @action(detail=True, methods=['get'])
    def reveal(self, request, pk=None):
        credential = self.get_object()
        
        # Check for active approved Break-Glass event
        active_break_glass = BreakGlassEvent.objects.filter(is_active=True).exists()

        # Check for approved access request or if user is owner/admin
        has_access = (
            request.user.role == 'SYSTEM_ADMIN' or 
            request.user == credential.project.owner or
            active_break_glass or
            AccessRequest.objects.filter(
                credential=credential, 
                user=request.user, 
                status='APPROVED'
            ).exists()
        )

        if not has_access:
            return Response({'error': 'Approval required to view this secret.'}, status=status.HTTP_403_FORBIDDEN)

        # Requirement: Check MFA if enabled
        if request.user.is_mfa_enabled:
            token = request.query_params.get('mfa_token')
            if not token or not verify_mfa_token(request.user.mfa_secret, token):
                return Response({'error': 'MFA token required or invalid.'}, status=status.HTTP_401_UNAUTHORIZED)

        decrypted = decrypt_secret(credential.encrypted_secret, credential.secret_iv)
        
        ActivityLog.objects.create(
            user=request.user,
            action_type="VIEW_SECRET",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            target_credential=credential,
            description=f"Viewed secret for {credential.service_name} {'(via Break-Glass)' if active_break_glass else ''}"
        )
        
        return Response({'secret': decrypted})

class AccessRequestViewSet(viewsets.ModelViewSet):
    queryset = AccessRequest.objects.all()
    serializer_class = AccessRequestSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Fallback for demo if user is not authenticated
        user = self.request.user if self.request.user.is_authenticated else User.objects.get(username='admin')
        serializer.save(user=user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        access_request = self.get_object()
        # For demo, allow anyone to approve
        
        access_request.status = 'APPROVED'
        # Fallback for demo
        access_request.approved_by = request.user if request.user.is_authenticated else User.objects.get(username='admin')
        access_request.actioned_at = timezone.now()
        access_request.save()
        
        ActivityLog.objects.create(
            user=access_request.approved_by,
            action_type="APPROVE_ACCESS",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            target_credential=access_request.credential,
            description=f"Approved access for {access_request.user} to {access_request.credential}"
        )
        return Response({'status': 'approved'})

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.AllowAny]

class EnrollmentRequestViewSet(viewsets.ModelViewSet):
    queryset = EnrollmentRequest.objects.all()
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        enrollment = serializer.save()
        ActivityLog.objects.create(
            user=None,
            action_type="ENROLLMENT_REQUEST",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
            description=f"Enrollment request submitted by {enrollment.full_name} ({enrollment.slt_employee_id}) for {enrollment.requested_role}"
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        enrollment = self.get_object()
        if enrollment.status != 'PENDING':
            return Response({'error': 'Only pending enrollment requests can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

        username = enrollment.slt_employee_id
        user = User.objects.create_user(
            username=username,
            email=enrollment.email,
            password=None,
            slt_employee_id=enrollment.slt_employee_id,
            first_name=enrollment.full_name,
            role=enrollment.requested_role,
            status='Active'
        )

        reviewer = request.user if request.user.is_authenticated else User.objects.filter(username='admin').first()
        enrollment.status = 'APPROVED'
        enrollment.reviewed_by = reviewer
        enrollment.reviewed_at = timezone.now()
        enrollment.reviewer_notes = request.data.get('reviewer_notes', '')
        enrollment.save()

        ActivityLog.objects.create(
            user=reviewer,
            action_type="APPROVE_ENROLLMENT",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
            description=f"Approved enrollment for {user.username} with role {user.role}"
        )
        return Response({'status': 'approved', 'user_id': user.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        if enrollment.status != 'PENDING':
            return Response({'error': 'Only pending enrollment requests can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        reviewer = request.user if request.user.is_authenticated else User.objects.filter(username='admin').first()
        enrollment.status = 'REJECTED'
        enrollment.reviewed_by = reviewer
        enrollment.reviewed_at = timezone.now()
        enrollment.reviewer_notes = request.data.get('reviewer_notes', '')
        enrollment.save()

        ActivityLog.objects.create(
            user=reviewer,
            action_type="REJECT_ENROLLMENT",
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
            description=f"Rejected enrollment for {enrollment.slt_employee_id}"
        )
        return Response({'status': 'rejected'})

class BreakGlassEventViewSet(viewsets.ModelViewSet):
    queryset = BreakGlassEvent.objects.all()
    serializer_class = BreakGlassEventSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        reason = request.data.get('reason')
        if not reason:
            return Response({'error': 'Reason is required'}, status=400)
        
        # Fallback for demo
        user = request.user if request.user.is_authenticated else User.objects.get(username='admin')
        event = BreakGlassEvent.objects.create(
            requested_by=user,
            reason=reason
        )
        
        ActivityLog.objects.create(
            user=user,
            action_type="BREAK_GLASS_INITIATED",
            description=f"Initiated Break-Glass event: {reason}"
        )
        return Response(BreakGlassEventSerializer(event).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        event = self.get_object()
        
        # For demo, allow multiple clicks by "admin" for simulation
        approver = request.user if request.user.is_authenticated else User.objects.get(username='admin')
        
        # Check if already approved by this user (disabled for demo to allow single user to approve 3 times)
        # if BreakGlassApproval.objects.filter(event=event, approver=approver).exists():
        #    return Response({'error': 'Already approved by you'}, status=400)

        BreakGlassApproval.objects.create(event=event, approver=approver)
        
        # If 3 approvals reached, activate the event
        if event.approvals.count() >= 3:
            event.is_active = True
            event.approved_at = timezone.now()
            event.save()
            ActivityLog.objects.create(
                user=request.user,
                action_type="BREAK_GLASS_ACTIVATED",
                description="Break-Glass event ACTIVATED after 3 approvals."
            )
        
        return Response({'status': 'Approved', 'current_approvals': event.approvals.count()})

