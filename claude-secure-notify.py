#!/usr/bin/env python3

import os
import sys
import json
import requests
import subprocess
import time
import hmac
import hashlib
import uuid
from datetime import datetime
from cryptography.fernet import Fernet
import base64

# Secure cloud webhook services (choose one)
WEBHOOK_SERVICE = os.environ.get('WEBHOOK_SERVICE', 'pipedream')  # pipedream, webhook.site, requestbin

# Service-specific configuration
PIPEDREAM_WEBHOOK_URL = os.environ.get('PIPEDREAM_WEBHOOK_URL', '')
PIPEDREAM_API_KEY = os.environ.get('PIPEDREAM_API_KEY', '')

# Azure Logic Apps (most secure option)
AZURE_LOGIC_APP_URL = os.environ.get('AZURE_LOGIC_APP_URL', '')
AZURE_SHARED_KEY = os.environ.get('AZURE_SHARED_KEY', '')

# AWS API Gateway + Lambda (enterprise option)
AWS_API_GATEWAY_URL = os.environ.get('AWS_API_GATEWAY_URL', '')
AWS_API_KEY = os.environ.get('AWS_API_KEY', '')

# Encryption key for sensitive data
ENCRYPTION_KEY = os.environ.get('CLAUDE_ENCRYPTION_KEY', '')

# Teams webhook (for notifications)
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL', '')

CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

class SecureNotifier:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key) if self.encryption_key else None
        
    def _get_or_create_key(self):
        """Get or create encryption key"""
        if ENCRYPTION_KEY:
            return ENCRYPTION_KEY.encode()
        else:
            # Generate new key
            key = Fernet.generate_key()
            print(f"⚠️  Generated new encryption key. Save this:")
            print(f"export CLAUDE_ENCRYPTION_KEY='{key.decode()}'")
            return key
            
    def _sign_request(self, payload, secret):
        """Create HMAC signature for request"""
        message = json.dumps(payload, sort_keys=True).encode()
        signature = hmac.new(
            secret.encode(),
            message,
            hashlib.sha256
        ).hexdigest()
        return signature
        
    def _encrypt_sensitive_data(self, data):
        """Encrypt sensitive information"""
        if self.cipher:
            return self.cipher.encrypt(json.dumps(data).encode()).decode()
        return data
        
    def send_to_pipedream(self, event_data):
        """Send to Pipedream (good balance of ease and security)"""
        if not PIPEDREAM_WEBHOOK_URL:
            return False
            
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-Session-ID': self.session_id,
                'X-Timestamp': str(int(time.time()))
            }
            
            if PIPEDREAM_API_KEY:
                headers['Authorization'] = f'Bearer {PIPEDREAM_API_KEY}'
                
            # Sign the request
            signature = self._sign_request(event_data, self.session_id)
            headers['X-Signature'] = signature
            
            response = requests.post(
                PIPEDREAM_WEBHOOK_URL,
                json=event_data,
                headers=headers,
                timeout=10
            )
            
            return response.status_code < 300
            
        except Exception as e:
            print(f"Pipedream error: {e}")
            return False
            
    def send_to_azure_logic_app(self, event_data):
        """Send to Azure Logic Apps (most secure)"""
        if not AZURE_LOGIC_APP_URL:
            return False
            
        try:
            # Azure expects specific format
            payload = {
                'sessionId': self.session_id,
                'timestamp': datetime.utcnow().isoformat(),
                'event': 'claude_waiting',
                'data': self._encrypt_sensitive_data(event_data)
            }
            
            headers = {'Content-Type': 'application/json'}
            
            # Add shared key authentication if configured
            if AZURE_SHARED_KEY:
                signature = self._sign_request(payload, AZURE_SHARED_KEY)
                headers['X-Signature'] = signature
                
            response = requests.post(
                AZURE_LOGIC_APP_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            return response.status_code < 300
            
        except Exception as e:
            print(f"Azure error: {e}")
            return False
            
    def send_to_aws(self, event_data):
        """Send to AWS API Gateway (enterprise option)"""
        if not AWS_API_GATEWAY_URL:
            return False
            
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': AWS_API_KEY
            }
            
            # AWS payload
            payload = {
                'sessionId': self.session_id,
                'timestamp': int(time.time()),
                'encryptedData': self._encrypt_sensitive_data(event_data)
            }
            
            response = requests.post(
                AWS_API_GATEWAY_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            return response.status_code < 300
            
        except Exception as e:
            print(f"AWS error: {e}")
            return False
            
    def send_teams_notification(self, message, webhook_url=None):
        """Send secure notification to Teams"""
        if not TEAMS_WEBHOOK_URL:
            return False
            
        try:
            # Include webhook URL for response
            facts = [
                {"name": "Session", "value": self.session_id[:8] + "..."},
                {"name": "Time", "value": datetime.now().strftime("%H:%M:%S")},
                {"name": "Status", "value": "Waiting for input"}
            ]
            
            if webhook_url:
                facts.append({"name": "Response URL", "value": webhook_url})
                
            card = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "FF6B6B",
                "summary": "Claude needs input",
                "sections": [{
                    "activityTitle": "🔔 Claude Secure Alert",
                    "activitySubtitle": "Secure notification via " + WEBHOOK_SERVICE,
                    "facts": facts,
                    "text": message
                }]
            }
            
            response = requests.post(TEAMS_WEBHOOK_URL, json=card, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            print(f"Teams error: {e}")
            return False
            
    def notify(self, context, options=None):
        """Send notification through configured service"""
        event_data = {
            'context': context[-500:],  # Limit context size
            'options': options or [],
            'timestamp': int(time.time())
        }
        
        # Try to send through configured service
        success = False
        webhook_url = None
        
        if WEBHOOK_SERVICE == 'pipedream':
            success = self.send_to_pipedream(event_data)
            webhook_url = PIPEDREAM_WEBHOOK_URL
        elif WEBHOOK_SERVICE == 'azure':
            success = self.send_to_azure_logic_app(event_data)
            webhook_url = AZURE_LOGIC_APP_URL
        elif WEBHOOK_SERVICE == 'aws':
            success = self.send_to_aws(event_data)
            webhook_url = AWS_API_GATEWAY_URL
            
        if success:
            print(f"✅ Sent to {WEBHOOK_SERVICE}")
            # Also send Teams notification with webhook info
            self.send_teams_notification(
                f"Claude is waiting. Check {WEBHOOK_SERVICE} for details.",
                webhook_url
            )
        else:
            print(f"❌ Failed to send to {WEBHOOK_SERVICE}")

def setup_instructions():
    """Print setup instructions"""
    print("""
=== Claude Secure Notify Setup ===

Choose a secure webhook service:

1. **Pipedream** (Recommended - Good balance)
   - Go to: https://pipedream.com
   - Create account and new workflow
   - Add HTTP trigger, copy URL
   - Set: export PIPEDREAM_WEBHOOK_URL='your-url'
   - Optional: Add API key for extra security

2. **Azure Logic Apps** (Most secure)
   - Create Logic App with HTTP trigger
   - Add authentication (shared key)
   - Set: export AZURE_LOGIC_APP_URL='your-url'
   - Set: export AZURE_SHARED_KEY='your-key'

3. **AWS API Gateway + Lambda** (Enterprise)
   - Create API Gateway with Lambda
   - Enable API key authentication
   - Set: export AWS_API_GATEWAY_URL='your-url'
   - Set: export AWS_API_KEY='your-key'

4. **Teams Webhook** (For notifications)
   - Channel → Connectors → Incoming Webhook
   - Set: export TEAMS_WEBHOOK_URL='your-url'

5. **Encryption** (Recommended)
   - Generate: export CLAUDE_ENCRYPTION_KEY='$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")'

Security features:
- Request signing (HMAC-SHA256)
- Optional encryption for sensitive data
- API key authentication
- Session tracking
- No direct internet exposure of your machine
""")

def monitor_claude():
    """Monitor Claude with secure notifications"""
    notifier = SecureNotifier()
    
    print(f"🔐 Claude Secure Notify")
    print(f"Service: {WEBHOOK_SERVICE}")
    print(f"Session: {notifier.session_id[:8]}...")
    print(f"Encryption: {'Enabled' if notifier.cipher else 'Disabled'}")
    print("-" * 50)
    
    # Run Claude
    cmd = [CLAUDE_PATH] + sys.argv[1:]
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=sys.stdin,
        universal_newlines=True,
        bufsize=1
    )
    
    output_buffer = []
    last_notification = 0
    
    try:
        for line in process.stdout:
            print(line, end='')
            output_buffer.append(line)
            
            if len(output_buffer) > 50:
                output_buffer = output_buffer[-30:]
                
            # Detect waiting
            stripped = line.strip()
            if (stripped in ['>', '❯', '$', 'Human:', 'You:'] or
                (stripped.endswith(':') and len(stripped) < 20)):
                
                current_time = time.time()
                if current_time - last_notification > 30:
                    last_notification = current_time
                    
                    # Extract options
                    context = ''.join(output_buffer[-20:])
                    options = []
                    for buf_line in output_buffer[-20:]:
                        import re
                        match = re.match(r'^\s*(\d+)[\.)\s]+(.+)', buf_line)
                        if match:
                            options.append(match.group(2).strip())
                            
                    # Send notification
                    notifier.notify(context, options)
                    
    except KeyboardInterrupt:
        print("\nStopped")
    finally:
        process.terminate()

def main():
    if '--help' in sys.argv:
        setup_instructions()
    elif '--test' in sys.argv:
        print("Testing secure notification...")
        notifier = SecureNotifier()
        notifier.notify("Test notification", ["Option 1", "Option 2"])
    else:
        # Check dependencies
        try:
            import cryptography
        except ImportError:
            print("Installing cryptography for encryption...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'cryptography'])
            
        monitor_claude()

if __name__ == "__main__":
    main()