import os
import base64
import pyotp
import qrcode
import io
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_encryption_key():
    # AES-GCM requires a 32-byte key for AES-256
    key_str = os.getenv('ENCRYPTION_KEY')
    if not key_str:
        raise ValueError("ENCRYPTION_KEY not found in environment variables!")
    
    # Ensure key is 32 bytes (256 bits)
    key = key_str.encode('utf-8')
    if len(key) < 32:
        key = key.ljust(32, b'\0')
    elif len(key) > 32:
        key = key[:32]
    return key

def encrypt_secret(plain_text):
    if not plain_text:
        return None, None
    
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Recommended 12 bytes for GCM
    ciphertext = aesgcm.encrypt(nonce, plain_text.encode('utf-8'), None)
    
    # Return base64 encoded strings
    return base64.b64encode(ciphertext).decode('utf-8'), base64.b64encode(nonce).decode('utf-8')

def decrypt_secret(encrypted_text, nonce_text):
    if not encrypted_text or not nonce_text:
        return None
    
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    
    try:
        ciphertext = base64.b64decode(encrypted_text)
        nonce = base64.b64decode(nonce_text)
        decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_data.decode('utf-8')
    except Exception as e:
        return f"DECRYPTION_ERROR: {str(e)}"

# --- MFA UTILS ---

def generate_mfa_secret():
    return pyotp.random_base32()

def get_totp_uri(username, secret):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name="SLT Enterprise Vault")

def verify_mfa_token(secret, token):
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

def generate_qr_code_base64(uri):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')
