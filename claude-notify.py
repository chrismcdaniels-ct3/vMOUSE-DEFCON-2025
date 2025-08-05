#!/usr/bin/env python3

import subprocess
import sys
import re
import time
import os
from threading import Thread, Lock
from queue import Queue, Empty

# Configuration
BELL_ENABLED = True
NOTIFICATION_ENABLED = True
DOCK_BOUNCE_ENABLED = True
SOUND_NAME = "Glass"  # macOS sound: "Basso", "Blow", "Bottle", "Frog", "Funk", "Glass", "Hero", "Morse", "Ping", "Pop", "Purr", "Sosumi", "Submarine", "Tink"

# ANSI colors
GREEN = '\033[0;32m'
YELLOW = '\033[0;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

class ClaudeMonitor:
    def __init__(self):
        self.waiting_patterns = [
            r'^>+\s*$',  # Simple prompt
            r'^❯+\s*$',  # Fancy prompt
            r'^\$\s*$',  # Shell prompt
            r'^(Human|User|You):\s*$',  # Conversation prompts
            r'waiting for (input|response|you)',  # Explicit waiting messages
            r'(Type|Enter|Input|Provide).*:?\s*$',  # Input requests
            r'^\s*\[\s*\]\s*$',  # Empty bracket prompt
            r'continue\?.*$',  # Continue prompts
        ]
        self.waiting_regex = re.compile('|'.join(self.waiting_patterns), re.IGNORECASE)
        
        self.not_waiting_patterns = [
            r'```',  # Code blocks
            r'^\s*#',  # Comments
            r'^\s*\/\/',  # Comments
            r'Error:|Warning:|Info:',  # Log messages
        ]
        self.not_waiting_regex = re.compile('|'.join(self.not_waiting_patterns), re.IGNORECASE)
        
        self.in_waiting_state = False
        self.last_notification_time = 0
        self.notification_cooldown = 3  # seconds
        self.output_buffer = []
        self.buffer_lock = Lock()
        
    def send_notification(self, message="Claude is waiting for your input"):
        """Send notifications through multiple channels"""
        current_time = time.time()
        
        # Check cooldown
        if current_time - self.last_notification_time < self.notification_cooldown:
            print(f"{YELLOW}[DEBUG: Notification skipped - cooldown]{NC}", file=sys.stderr)
            return
            
        self.last_notification_time = current_time
        print(f"{GREEN}[DEBUG: Sending notification]{NC}", file=sys.stderr)
        
        # Terminal bell / System sound
        if BELL_ENABLED:
            # Try both terminal bell and system sound
            sys.stdout.write('\a')
            sys.stdout.flush()
            # Also play system sound directly
            try:
                subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], capture_output=True)
            except:
                pass
        
        # macOS notification
        if NOTIFICATION_ENABLED:
            try:
                subprocess.run([
                    'osascript', '-e',
                    f'display notification "{message}" with title "Claude Code" sound name "{SOUND_NAME}"'
                ], capture_output=True)
            except:
                pass
        
        # Dock bounce
        if DOCK_BOUNCE_ENABLED:
            try:
                # Brief activation to trigger dock bounce
                subprocess.run(['osascript', '-e', 'tell application "Terminal" to activate'], capture_output=True)
                time.sleep(0.1)
                subprocess.run(['osascript', '-e', 'tell application "Terminal" to set frontmost to false'], capture_output=True)
            except:
                pass
        
        # Visual indicator
        print(f"{YELLOW}🔔 [Notification sent - Claude is waiting for input]{NC}", file=sys.stderr)
    
    def is_waiting_indicator(self, line):
        """Determine if a line indicates Claude is waiting"""
        stripped = line.strip()
        
        # Empty lines don't count
        if not stripped:
            return False
            
        # Check negative patterns first
        if self.not_waiting_regex.search(line):
            return False
            
        # Check positive patterns
        if self.waiting_regex.search(line):
            return True
            
        # Check for very short lines that might be prompts
        if len(stripped) <= 3 and any(c in stripped for c in ['>', '$', ':', '?', '❯']):
            return True
            
        return False
    
    def analyze_recent_output(self):
        """Analyze recent output to determine if Claude is waiting"""
        with self.buffer_lock:
            if len(self.output_buffer) < 2:
                return False
                
            # Look at the last few lines
            recent_lines = self.output_buffer[-5:]
            
            # If the last line looks like a prompt and previous lines were output
            if recent_lines:
                last_line = recent_lines[-1].strip()
                
                # Check if we have a prompt after some output
                if self.is_waiting_indicator(recent_lines[-1]):
                    # Make sure there was some content before the prompt
                    has_content = any(len(line.strip()) > 20 for line in recent_lines[:-1])
                    return has_content
                    
        return False
    
    def process_line(self, line):
        """Process a single line of output"""
        # Add to buffer
        with self.buffer_lock:
            self.output_buffer.append(line)
            # Keep buffer size manageable
            if len(self.output_buffer) > 100:
                self.output_buffer = self.output_buffer[-50:]
        
        # Print the line
        print(line, end='')
        
        # Debug output
        stripped = line.strip()
        if stripped and len(stripped) < 50:  # Only debug short lines
            print(f"{BLUE}[DEBUG: Line='{stripped}' len={len(stripped)}]{NC}", file=sys.stderr)
        
        # Check if this indicates waiting
        if self.is_waiting_indicator(line) or self.analyze_recent_output():
            print(f"{GREEN}[DEBUG: Waiting indicator detected]{NC}", file=sys.stderr)
            if not self.in_waiting_state:
                self.in_waiting_state = True
                print(f"{GREEN}[DEBUG: Setting waiting state and triggering notification]{NC}", file=sys.stderr)
                # Small delay to ensure we're really waiting
                Thread(target=lambda: (time.sleep(0.5), self.send_notification())).start()
        else:
            # Reset waiting state on substantial output
            if len(line.strip()) > 20:
                self.in_waiting_state = False

def test_notifications():
    """Test the notification system"""
    print(f"{GREEN}Testing Claude Notify notification system...{NC}")
    monitor = ClaudeMonitor()
    monitor.send_notification("Test notification from Claude wrapper")
    print(f"{GREEN}Test complete. You should have received notifications.{NC}")

def main():
    # Parse arguments
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        test_notifications()
        return
    
    # Show configuration
    print(f"{BLUE}Claude Notify Wrapper (Python){NC}")
    print(f"Bell: {BELL_ENABLED} | Notifications: {NOTIFICATION_ENABLED} | Dock Bounce: {DOCK_BOUNCE_ENABLED}")
    print(f"Starting Claude with args: {' '.join(sys.argv[1:])}")
    print("---")
    
    # Create monitor
    monitor = ClaudeMonitor()
    
    # Start Claude process
    # First try to find claude in common locations
    claude_paths = [
        '/Users/chrismcdaniels/.claude/local/claude',  # Your specific claude location
        os.path.expanduser('~/.claude/local/claude'),
        'claude',
        '/usr/local/bin/claude',
        '/opt/homebrew/bin/claude',
        os.path.expanduser('~/.local/bin/claude'),
        os.path.expanduser('~/bin/claude'),
    ]
    
    claude_cmd = None
    for path in claude_paths:
        expanded_path = os.path.expanduser(path)
        if os.path.isfile(expanded_path) and os.access(expanded_path, os.X_OK):
            claude_cmd = expanded_path
            break
    
    if not claude_cmd:
        # Try to find claude using which
        result = subprocess.run(['which', 'claude'], capture_output=True, text=True)
        if result.returncode == 0:
            claude_cmd = result.stdout.strip()
        else:
            print(f"{YELLOW}Error: 'claude' command not found in PATH{NC}", file=sys.stderr)
            print(f"Please ensure Claude CLI is installed and in your PATH", file=sys.stderr)
            sys.exit(1)
    
    cmd = [claude_cmd] + sys.argv[1:]
    
    # If running in interactive mode (no --print flag), we need to handle stdin
    is_interactive = '--print' not in sys.argv and '-p' not in sys.argv
    
    if is_interactive:
        # Interactive mode - pass through stdin
        process = subprocess.Popen(
            cmd,
            stdin=sys.stdin,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    else:
        # Non-interactive mode
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
    
    # Monitor output
    try:
        for line in process.stdout:
            monitor.process_line(line)
    except KeyboardInterrupt:
        process.terminate()
        sys.exit(0)
    except Exception as e:
        print(f"{YELLOW}Error: {e}{NC}", file=sys.stderr)
    finally:
        process.wait()
        sys.exit(process.returncode)

if __name__ == "__main__":
    main()