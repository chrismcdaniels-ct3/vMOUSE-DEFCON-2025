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
from flask import Flask, request, jsonify
import queue

# Configuration - You'll need to set these
TEAMS_WEBHOOK_URL = os.environ.get('TEAMS_WEBHOOK_URL', '')  # Get from Teams channel
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM_NUMBER = os.environ.get('TWILIO_FROM_NUMBER', '')  # Your Twilio number
TWILIO_TO_NUMBER = os.environ.get('TWILIO_TO_NUMBER', '')  # Your phone number

# Local config
CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"
WEBHOOK_PORT = 8888
NGROK_ENABLED = True  # Use ngrok for external access

# Global queue for remote commands
command_queue = queue.Queue()
app = Flask(__name__)

class RemoteNotifier:
    def __init__(self):
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.ngrok_url = None
        self.last_context = []
        
    def start_ngrok(self):
        """Start ngrok tunnel for receiving remote commands"""
        if not NGROK_ENABLED:
            return None
            
        try:
            # Check if ngrok is installed
            result = subprocess.run(['which', 'ngrok'], capture_output=True)
            if result.returncode != 0:
                print("⚠️  ngrok not found. Install with: brew install ngrok")
                return None
                
            # Kill any existing ngrok
            subprocess.run(['pkill', 'ngrok'], capture_output=True)
            time.sleep(1)
            
            # Start ngrok
            subprocess.Popen(['ngrok', 'http', str(WEBHOOK_PORT)], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            time.sleep(3)
            
            # Get ngrok URL
            try:
                response = requests.get('http://localhost:4040/api/tunnels', timeout=5)
                tunnels = response.json()['tunnels']
                for tunnel in tunnels:
                    if tunnel['proto'] == 'https':
                        self.ngrok_url = tunnel['public_url']
                        print(f"✅ Remote access URL: {self.ngrok_url}/command")
                        return self.ngrok_url
            except:
                print("⚠️  Could not get ngrok URL")
                
        except Exception as e:
            print(f"⚠️  ngrok error: {e}")
            
        return None
        
    def send_teams_notification(self, message, options=None):
        """Send notification to Microsoft Teams"""
        if not TEAMS_WEBHOOK_URL:
            print("⚠️  Teams webhook URL not configured")
            return
            
        try:
            # Create adaptive card
            card = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7",
                "summary": "Claude is waiting for input",
                "sections": [{
                    "activityTitle": "Claude Code Notification",
                    "activitySubtitle": f"Session: {self.session_id}",
                    "text": message,
                    "markdown": True
                }]
            }
            
            # Add action buttons if we have options
            if options and self.ngrok_url:
                actions = []
                for i, option in enumerate(options[:5]):  # Limit to 5 options
                    actions.append({
                        "@type": "HttpPOST",
                        "name": f"Option {i+1}: {option[:50]}",
                        "target": f"{self.ngrok_url}/command",
                        "body": json.dumps({"command": option, "source": "teams"})
                    })
                    
                # Add custom command option
                actions.append({
                    "@type": "HttpPOST", 
                    "name": "Send custom command...",
                    "target": f"{self.ngrok_url}/command",
                    "body": json.dumps({"command": "CUSTOM", "source": "teams"})
                })
                
                card["potentialAction"] = actions
                
            response = requests.post(TEAMS_WEBHOOK_URL, json=card, timeout=10)
            if response.status_code == 200:
                print("✅ Teams notification sent")
            else:
                print(f"⚠️  Teams error: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  Teams notification error: {e}")
            
    def send_sms_notification(self, message, options=None):
        """Send SMS notification via Twilio"""
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_TO_NUMBER]):
            print("⚠️  Twilio not configured")
            return
            
        try:
            from twilio.rest import Client
            
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            # Format message
            sms_body = f"Claude waiting:\n{message}\n"
            if options:
                sms_body += "\nReply with number:\n"
                for i, option in enumerate(options[:5]):
                    sms_body += f"{i+1}. {option[:30]}\n"
                    
            # Send SMS
            message = client.messages.create(
                body=sms_body[:1600],  # SMS limit
                from_=TWILIO_FROM_NUMBER,
                to=TWILIO_TO_NUMBER
            )
            
            print(f"✅ SMS sent: {message.sid}")
            
        except ImportError:
            print("⚠️  Twilio not installed. Run: pip install twilio")
        except Exception as e:
            print(f"⚠️  SMS error: {e}")
            
    def extract_options(self, output_buffer):
        """Extract numbered options from Claude's output"""
        options = []
        
        # Look for numbered lists
        lines = output_buffer.split('\n')
        for line in lines:
            # Match patterns like "1. ", "1) ", "[1]", etc.
            match = re.match(r'^\s*(?:\[?(\d+)\]?[\.)\s])\s*(.+)', line)
            if match:
                num = int(match.group(1))
                text = match.group(2).strip()
                if 1 <= num <= 10:  # Reasonable range
                    while len(options) < num:
                        options.append("")
                    options[num-1] = text
                    
        # Clean up empty options
        options = [opt for opt in options if opt]
        
        return options
        
    def notify(self, message, output_buffer):
        """Send notifications through all configured channels"""
        # Extract any numbered options
        options = self.extract_options(output_buffer)
        
        # Get last few lines for context
        lines = [l.strip() for l in output_buffer.split('\n') if l.strip()]
        context = '\n'.join(lines[-5:])  # Last 5 lines
        
        full_message = f"**Claude is waiting for input**\n\nContext:\n```\n{context}\n```"
        
        # Send notifications
        self.send_teams_notification(full_message, options)
        self.send_sms_notification(message, options)

# Flask webhook endpoints
@app.route('/command', methods=['POST'])
def receive_command():
    """Receive commands from Teams/SMS"""
    try:
        data = request.json
        command = data.get('command', '')
        source = data.get('source', 'unknown')
        
        if command:
            command_queue.put(command)
            return jsonify({"status": "received", "command": command})
        else:
            return jsonify({"status": "error", "message": "No command provided"}), 400
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "queue_size": command_queue.qsize()})

def run_webhook_server():
    """Run Flask server in background thread"""
    app.run(host='0.0.0.0', port=WEBHOOK_PORT, debug=False, threaded=True)

def monitor_claude_with_remote(notifier):
    """Monitor Claude output and handle remote commands"""
    import select
    import pty
    import termios
    import tty
    
    # Save terminal settings
    old_tty = termios.tcgetattr(sys.stdin)
    
    try:
        # Create pseudo-terminal
        master_fd, slave_fd = pty.openpty()
        
        # Start Claude
        cmd = [CLAUDE_PATH] + sys.argv[1:]
        process = subprocess.Popen(
            cmd,
            stdin=slave_fd,
            stdout=slave_fd, 
            stderr=slave_fd,
            close_fds=True
        )
        
        os.close(slave_fd)
        tty.setraw(sys.stdin.fileno())
        
        output_buffer = ""
        waiting_detected = False
        last_notification = 0
        
        while True:
            if process.poll() is not None:
                break
                
            # Check for remote commands
            try:
                remote_command = command_queue.get_nowait()
                if remote_command:
                    print(f"\n💬 Remote command: {remote_command}\n")
                    os.write(master_fd, (remote_command + '\n').encode())
                    waiting_detected = False
            except queue.Empty:
                pass
                
            # Monitor I/O
            r, w, e = select.select([sys.stdin, master_fd], [], [], 0.1)
            
            if sys.stdin in r:
                data = os.read(sys.stdin.fileno(), 1024)
                if data:
                    os.write(master_fd, data)
                    waiting_detected = False
                    
            if master_fd in r:
                try:
                    data = os.read(master_fd, 1024)
                    if data:
                        os.write(sys.stdout.fileno(), data)
                        
                        # Add to buffer
                        try:
                            output_buffer += data.decode('utf-8', errors='ignore')
                        except:
                            output_buffer = ""
                            
                        if len(output_buffer) > 2000:
                            output_buffer = output_buffer[-1000:]
                            
                        # Check if waiting
                        lines = output_buffer.strip().split('\n')
                        if lines:
                            last_line = lines[-1].strip()
                            current_time = time.time()
                            
                            waiting_indicators = [
                                last_line in ['>', '❯', '$'],
                                last_line.endswith(':') and len(last_line) < 50,
                                'waiting' in last_line.lower(),
                                bool(re.match(r'^\s*(?:Human|You|User):\s*$', last_line))
                            ]
                            
                            if (any(waiting_indicators) and 
                                not waiting_detected and
                                current_time - last_notification > 5):
                                
                                waiting_detected = True
                                last_notification = current_time
                                
                                # Send notification in background
                                threading.Thread(
                                    target=notifier.notify,
                                    args=(last_line, output_buffer)
                                ).start()
                                
                except OSError:
                    break
                    
    finally:
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_tty)
        try:
            os.close(master_fd)
        except:
            pass
        if process.poll() is None:
            process.terminate()

def main():
    print("🚀 Claude Remote Notify")
    print("=" * 50)
    
    # Check configuration
    if TEAMS_WEBHOOK_URL:
        print("✅ Teams webhook configured")
    else:
        print("⚠️  Set TEAMS_WEBHOOK_URL environment variable")
        
    if all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN]):
        print("✅ Twilio SMS configured")
    else:
        print("⚠️  Set TWILIO_* environment variables for SMS")
        
    # Initialize notifier
    notifier = RemoteNotifier()
    
    # Start ngrok
    notifier.start_ngrok()
    
    # Start webhook server
    print(f"🌐 Starting webhook server on port {WEBHOOK_PORT}")
    server_thread = threading.Thread(target=run_webhook_server, daemon=True)
    server_thread.start()
    time.sleep(1)
    
    print("=" * 50)
    print("Starting Claude with remote notifications...")
    print()
    
    # Run Claude with monitoring
    monitor_claude_with_remote(notifier)

if __name__ == "__main__":
    if '--help' in sys.argv:
        print("""
Claude Remote Notify - Get notifications and control Claude remotely

Setup:
1. Teams Webhook:
   - In Teams, go to your channel → Connectors → Incoming Webhook
   - Create webhook and copy URL
   - export TEAMS_WEBHOOK_URL="your-webhook-url"

2. Twilio SMS (optional):
   - Sign up at twilio.com
   - export TWILIO_ACCOUNT_SID="your-sid"
   - export TWILIO_AUTH_TOKEN="your-token"
   - export TWILIO_FROM_NUMBER="+1234567890"
   - export TWILIO_TO_NUMBER="+0987654321"

3. Install requirements:
   - pip install flask requests
   - pip install twilio  (for SMS)
   - brew install ngrok  (for remote access)

Usage:
   ./claude-remote-notify.py [claude arguments]
        """)
    else:
        main()