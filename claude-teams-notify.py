#!/usr/bin/env python3

import os
import sys
import json
import requests
import subprocess
import time
import re
import threading
from datetime import datetime

# Configuration
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL', '')
CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

class TeamsNotifier:
    def __init__(self):
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.last_notification = 0
        
    def send_notification(self, context, options=None):
        """Send rich notification to Teams"""
        if not TEAMS_WEBHOOK_URL:
            print("⚠️  Set TEAMS_WEBHOOK_URL environment variable")
            print("   Get it from: Teams Channel → Connectors → Incoming Webhook")
            return
            
        try:
            # Create message
            facts = [
                {"name": "Session", "value": self.session_id},
                {"name": "Time", "value": datetime.now().strftime("%H:%M:%S")},
                {"name": "Status", "value": "Waiting for input"}
            ]
            
            # Add options if found
            if options:
                for i, opt in enumerate(options[:5]):
                    facts.append({"name": f"Option {i+1}", "value": opt[:100]})
            
            card = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "FF6B6B",  # Red for attention
                "summary": "Claude is waiting for your input",
                "sections": [{
                    "activityTitle": "🔔 Claude Code Alert",
                    "activitySubtitle": "Claude is waiting for your input",
                    "facts": facts,
                    "markdown": True,
                    "text": f"**Recent output:**\n```\n{context[-500:]}\n```"
                }]
            }
            
            response = requests.post(TEAMS_WEBHOOK_URL, json=card, timeout=10)
            if response.status_code == 200:
                print("✅ Teams notification sent")
            else:
                print(f"⚠️  Teams error: {response.text}")
                
        except Exception as e:
            print(f"⚠️  Teams error: {e}")
            
    def extract_options(self, text):
        """Extract numbered options from output"""
        options = []
        for line in text.split('\n'):
            # Match: "1. option" or "1) option" or "[1] option"
            match = re.match(r'^\s*(?:\[?(\d+)\]?[\.)\s])\s*(.+)', line)
            if match and 1 <= int(match.group(1)) <= 10:
                options.append(match.group(2).strip())
        return options

def monitor_claude_output():
    """Simple output monitoring approach"""
    notifier = TeamsNotifier()
    
    # Start Claude
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
    waiting_count = 0
    
    try:
        for line in process.stdout:
            # Print line
            print(line, end='')
            
            # Add to buffer
            output_buffer.append(line)
            if len(output_buffer) > 50:
                output_buffer = output_buffer[-30:]
            
            # Check for waiting patterns
            stripped = line.strip()
            if stripped and len(stripped) < 20:
                waiting_patterns = [
                    stripped in ['>', '❯', '$', 'Human:', 'User:', 'You:'],
                    stripped.endswith(':') and 'Human' in stripped,
                    'waiting' in stripped.lower(),
                    bool(re.match(r'^(?:>+|❯+|\$)\s*$', stripped))
                ]
                
                if any(waiting_patterns):
                    waiting_count += 1
                    
                    # Need multiple indicators to be sure
                    if waiting_count >= 2:
                        current_time = time.time()
                        if current_time - notifier.last_notification > 10:
                            notifier.last_notification = current_time
                            
                            # Get context and options
                            context = ''.join(output_buffer[-20:])
                            options = notifier.extract_options(context)
                            
                            # Send notification in background
                            threading.Thread(
                                target=notifier.send_notification,
                                args=(context, options)
                            ).start()
                            
                            waiting_count = 0
                else:
                    # Reset on substantial output
                    if len(stripped) > 30:
                        waiting_count = 0
                        
    except KeyboardInterrupt:
        process.terminate()
    finally:
        process.wait()
        
def test_notification():
    """Test Teams notification"""
    notifier = TeamsNotifier()
    test_context = """Claude output example:

What would you like to do?
1. Create a new feature
2. Fix a bug
3. Review code
4. Exit