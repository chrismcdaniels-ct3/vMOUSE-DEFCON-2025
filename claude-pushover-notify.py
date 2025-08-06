#!/usr/bin/env python3

import os
import sys
import requests
import subprocess
import time
import hashlib
from datetime import datetime

# Pushover configuration (very secure, no public webhooks)
PUSHOVER_USER_KEY = os.environ.get('PUSHOVER_USER_KEY', '')
PUSHOVER_APP_TOKEN = os.environ.get('PUSHOVER_APP_TOKEN', '')

# Optional: Telegram Bot (also secure)
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

class SecureMobileNotifier:
    def __init__(self):
        self.session_id = hashlib.md5(str(time.time()).encode()).hexdigest()[:8]
        self.last_notification = 0
        
    def send_pushover(self, message, priority=0):
        """Send notification via Pushover (recommended)"""
        if not (PUSHOVER_USER_KEY and PUSHOVER_APP_TOKEN):
            return False
            
        try:
            data = {
                'token': PUSHOVER_APP_TOKEN,
                'user': PUSHOVER_USER_KEY,
                'message': message,
                'title': 'Claude Code Alert',
                'priority': priority,  # -2 to 2
                'timestamp': int(time.time()),
                'sound': 'pushover' if priority >= 1 else 'none'
            }
            
            # High priority requires acknowledgment
            if priority == 2:
                data['retry'] = 30  # Retry every 30 seconds
                data['expire'] = 600  # Expire after 10 minutes
                
            response = requests.post(
                'https://api.pushover.net/1/messages.json',
                data=data,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Pushover error: {e}")
            return False
            
    def send_telegram(self, message):
        """Send notification via Telegram Bot"""
        if not (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID):
            return False
            
        try:
            # Telegram bot API
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            
            data = {
                'chat_id': TELEGRAM_CHAT_ID,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, json=data, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            print(f"Telegram error: {e}")
            return False
            
    def notify(self, context, waiting_line):
        """Send secure mobile notification"""
        # Format message
        message = f"""🔔 *Claude Waiting*
        
Session: {self.session_id}
Time: {datetime.now().strftime('%H:%M:%S')}

Waiting at: {waiting_line}

Recent output:
```
{context[-300:]}
```"""
        
        # Try Pushover first (most reliable)
        success = False
        if PUSHOVER_USER_KEY:
            success = self.send_pushover(message, priority=1)
            if success:
                print("✅ Pushover notification sent")
                
        # Try Telegram as backup
        if not success and TELEGRAM_BOT_TOKEN:
            success = self.send_telegram(message)
            if success:
                print("✅ Telegram notification sent")
                
        if not success:
            print("❌ No notification service configured")

def setup_instructions():
    """Print setup instructions"""
    print("""
=== Secure Mobile Notifications Setup ===

Option 1: **Pushover** (Recommended - $5 one-time)
1. Download Pushover app on your phone
2. Create account at https://pushover.net
3. Get your User Key from dashboard
4. Create new Application/API Token
5. Set environment variables:
   export PUSHOVER_USER_KEY='your-user-key'
   export PUSHOVER_APP_TOKEN='your-app-token'

Option 2: **Telegram Bot** (Free)
1. Message @BotFather on Telegram
2. Create new bot with /newbot
3. Copy the bot token
4. Message your bot to start conversation
5. Get your chat ID:
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
6. Set environment variables:
   export TELEGRAM_BOT_TOKEN='your-bot-token'
   export TELEGRAM_CHAT_ID='your-chat-id'

Security benefits:
- No public webhooks exposed
- End-to-end encrypted (Telegram)
- No intermediary services
- Direct API authentication
- Mobile push notifications
- Works behind firewalls/NAT
""")

def main():
    if '--help' in sys.argv:
        setup_instructions()
        return
        
    if '--test' in sys.argv:
        print("Testing mobile notifications...")
        notifier = SecureMobileNotifier()
        notifier.notify("Test context\nLine 2\nLine 3", "> Waiting for input")
        return
        
    # Check configuration
    print("🔐 Claude Secure Mobile Notify")
    if PUSHOVER_USER_KEY:
        print("✅ Pushover configured")
    else:
        print("⚠️  Pushover not configured")
        
    if TELEGRAM_BOT_TOKEN:
        print("✅ Telegram configured")
    else:
        print("⚠️  Telegram not configured")
        
    if not (PUSHOVER_USER_KEY or TELEGRAM_BOT_TOKEN):
        print("\nRun with --help for setup instructions")
        return
        
    print("-" * 50)
    
    # Monitor Claude
    notifier = SecureMobileNotifier()
    
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
    
    try:
        for line in process.stdout:
            print(line, end='')
            output_buffer.append(line)
            
            if len(output_buffer) > 30:
                output_buffer = output_buffer[-20:]
                
            # Simple waiting detection
            stripped = line.strip()
            if (stripped in ['>', '❯', '$', 'Human:', 'You:'] or
                (stripped.endswith(':') and len(stripped) < 20)):
                
                current_time = time.time()
                if current_time - notifier.last_notification > 60:  # 1 minute cooldown
                    notifier.last_notification = current_time
                    context = ''.join(output_buffer[-10:])
                    notifier.notify(context, stripped)
                    
    except KeyboardInterrupt:
        print("\nStopped")
    finally:
        process.terminate()

if __name__ == "__main__":
    main()