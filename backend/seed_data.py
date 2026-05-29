import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'credential_manager.settings')
django.setup()

from core.models import User, Project, Credential
from core.utils import encrypt_secret

def seed():
    # Admin User
    admin, _ = User.objects.get_or_create(username='admin')
    admin.role = 'SYSTEM_ADMIN'
    admin.slt_employee_id = 'SLT/EMP/001'
    admin.set_password('admin123')
    admin.is_active = True
    admin.is_staff = True
    admin.is_superuser = True
    admin.save()

    # Manager User
    manager, _ = User.objects.get_or_create(username='manager')
    manager.role = 'MANAGER'
    manager.slt_employee_id = 'SLT/EMP/432'
    manager.set_password('manager123')
    manager.save()

    # Projects
    p1, _ = Project.objects.get_or_create(
        name='Internal Cloud Infrastructure',
        department='IT Infrastructure',
        owner=admin,
        criticality_level='MISSION_CRITICAL'
    )

    p2, _ = Project.objects.get_or_create(
        name='Billing System Gateway',
        department='Finance Systems',
        owner=manager,
        criticality_level='HIGH'
    )

    p3, _ = Project.objects.get_or_create(
        name='Monad Validator Node',
        department='Blockchain Lab',
        owner=admin,
        criticality_level='MISSION_CRITICAL'
    )

    p4, _ = Project.objects.get_or_create(
        name='National Backbone Fiber',
        department='Core Network Operations',
        owner=admin,
        criticality_level='MISSION_CRITICAL',
        description='Management console for high-capacity national fiber backbone links.'
    )

    p5, _ = Project.objects.get_or_create(
        name='SLT-Mobitel IPTV Headend',
        department='Media Streaming',
        owner=manager,
        criticality_level='HIGH',
        description='Streaming infrastructure for 4K IPTV content distribution.'
    )

    p6, _ = Project.objects.get_or_create(
        name='Customer Portal AWS S3',
        department='Digital Experience',
        owner=manager,
        criticality_level='MEDIUM',
        description='Storage buckets for self-care portal assets and user documents.'
    )

    # Helper for creating encrypted credentials
    def create_encrypted_credential(project, service, utype, username, secret, target):
        enc, iv = encrypt_secret(secret)
        Credential.objects.get_or_create(
            project=project,
            service_name=service,
            credential_type=utype,
            username=username,
            defaults={
                'encrypted_secret': enc,
                'secret_iv': iv,
                'target_url_or_ip': target
            }
        )

    # Credentials for P1
    create_encrypted_credential(p1, 'Core Router Admin', 'PASSWORD', 'slt_admin', 'Slt@Router#2025', '10.0.0.1')
    create_encrypted_credential(p1, 'AWS Production Root', 'API_KEY', 'terraform_svc', 'AKIA-SLT-TEST-778899', 'aws.console.com')

    # Credentials for P2
    create_encrypted_credential(p2, 'Oracle DB Production', 'PASSWORD', 'billing_user', 'DB_Pass_SLT_99k', '10.150.2.45')

    # Credentials for P3 (Monad)
    create_encrypted_credential(p3, 'Monad Mainnet RPC', 'API_KEY', 'validator_01', 'MONAD-RPC-SECURE-772211', 'rpc.monad.slt.lk')
    create_encrypted_credential(p3, 'Validator Private Key', 'SSH_KEY', 'ubuntu', 'SLT_MONAD_KEY_ENCRYPTED_2025', '10.200.5.10')

    # New Mock Data for Enhanced Demo
    create_encrypted_credential(p4, 'Nokia Core Switch 01', 'SSH_KEY', 'root', 'FiberBackbone@SLT_2025', '172.16.0.45')
    create_encrypted_credential(p4, 'Cisco Nexus Admin', 'PASSWORD', 'nco_admin', 'Pass_Core_Nexus_SLT2', '172.16.0.46')

    create_encrypted_credential(p5, 'Nginx Streaming Master', 'PASSWORD', 'stream_svc', 'SLT_Streaming_99_Key', 'headend.iptv.slt.lk')
    create_encrypted_credential(p5, 'Transcoder API', 'API_KEY', 'harmonic_svc', 'HARM-API-9988-7766', 'api.harmonic.inc')

    create_encrypted_credential(p6, 'Assets Bucket Access', 'API_KEY', 's3_read_only', 'AKIA-MOCK-SLT-223344', 's3.amazonaws.com')

    print("Database seeded successfully with ENCRYPTED SLT and Monad demo data.")

if __name__ == '__main__':
    seed()
