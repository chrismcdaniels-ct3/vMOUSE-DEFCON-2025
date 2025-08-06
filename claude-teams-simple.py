#!/usr/bin/env python3

import os
import sys
import json
import requests
import subprocess
import time
import re
from datetime import datetime

# Configuration
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL', '')
CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

def send_teams_alert(message, context=""):
    """Send a simple Teams notification"""
    if not TEAMS_WEBHOOK_URL:
        print("\n⚠️  To enable Teams notifications:")
        print("1. In Teams: Channel → ⋯ → Connectors → Incoming Webhook")
        print("2. Create webhook and copy URL")
        print("3. Run: export TEAMS_WEBHOOK_URL='your-webhook-url'")
        return False
        
    try:
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "FF0000",
            "summary": message,
            "sections": [{
                "activityTitle": "🔔 Claude Code Alert",
                "activitySubtitle": datetime.now().strftime("%H:%M:%S"),
                "text": message,
                "facts": [
                    {"name": "Status", "value": "Waiting for input"},
                    {"name": "Context", "value": context[-200:] if context else "Starting session"}
                ]
            }]
        }
        
        response = requests.post(TEAMS_WEBHOOK_URL, json=card, timeout=5)
        return response.status_code == 200
        
    except Exception as e:
        print(f"\n⚠️  Teams error: {e}")
        return False

def main():
    if '--test' in sys.argv:
        print("Testing Teams notification...")
        if send_teams_alert("Test: Claude is waiting for input", "This is a test notification"):
            print("✅ Teams notification sent successfully!")
        else:
            print("❌ Failed to send Teams notification")
        return
        
    print("Claude with Teams Notifications")
    if TEAMS_WEBHOOK_URL:
        print("✅ Teams notifications enabled")
    else:
        print("⚠️  Teams notifications disabled (see setup above)")
    print("-" * 40)
    
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
            
            # Keep buffer manageable
            if len(output_buffer) > 30:
                output_buffer = output_buffer[-20:]
            
            # Simple waiting detection
            stripped = line.strip()
            if (stripped in ['>', '❯', '$', 'Human:', 'You:'] or 
                (stripped.endswith(':') and len(stripped) < 20)):
                
                current_time = time.time()
                if current_time - last_notification > 30:  # 30 second cooldown
                    last_notification = current_time
                    context = ''.join(output_buffer[-10:])
                    send_teams_alert(
                        "Claude is waiting for your input",
                        context
                    )
                    
    except KeyboardInterrupt:
        print("\nInterrupted")
    finally:
        process.terminate()
        process.wait()

if __name__ == "__main__":
    main()