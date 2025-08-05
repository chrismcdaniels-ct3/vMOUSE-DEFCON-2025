#!/usr/bin/env python3

import subprocess
import sys
import time

CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

def send_notification():
    """Send visual notifications only"""
    # macOS notification (visual popup)
    subprocess.run([
        'osascript', '-e',
        'display notification "Claude is waiting for your input" with title "Claude Code"'
    ], capture_output=True)
    
    # Dock bounce
    subprocess.run(['osascript', '-e', 'tell application "Terminal" to activate'], capture_output=True)
    time.sleep(0.1)
    subprocess.run(['osascript', '-e', 'tell application "Terminal" to set frontmost to false'], capture_output=True)
    
    # Flash the terminal bell visually (if enabled in Terminal settings)
    print('\a', end='', flush=True)
    
    # Print colored message
    print('\033[1;33;41m 🔔 CLAUDE IS WAITING FOR YOUR INPUT 🔔 \033[0m', file=sys.stderr)

def main():
    print("Claude Notify (Visual Only)")
    print(f"Running: {CLAUDE_PATH} {' '.join(sys.argv[1:])}")
    print("---")
    
    # Just pass through to claude and monitor output
    process = subprocess.Popen(
        [CLAUDE_PATH] + sys.argv[1:],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        bufsize=1
    )
    
    output_buffer = []
    last_notification = 0
    
    for line in process.stdout:
        print(line, end='')
        output_buffer.append(line)
        
        # Keep buffer small
        if len(output_buffer) > 20:
            output_buffer = output_buffer[-10:]
        
        # Check for waiting patterns
        stripped = line.strip()
        if stripped and len(stripped) < 10:
            waiting_patterns = ['>', '❯', '$', 'Human:', 'You:']
            if any(p in stripped for p in waiting_patterns):
                current_time = time.time()
                if current_time - last_notification > 3:
                    last_notification = current_time
                    send_notification()

if __name__ == "__main__":
    if '--test' in sys.argv:
        print("Testing visual notifications...")
        send_notification()
    else:
        main()