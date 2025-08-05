#!/usr/bin/env python3

import os
import sys
import select
import subprocess
import time

# Configuration
CLAUDE_PATH = "/Users/chrismcdaniels/.claude/local/claude"

def send_notification():
    """Send notification when Claude is waiting"""
    # Play sound
    subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], capture_output=True)
    
    # macOS notification
    subprocess.run([
        'osascript', '-e',
        'display notification "Claude is waiting for your input" with title "Claude Code" sound name "Glass"'
    ], capture_output=True)
    
    # Dock bounce
    subprocess.run(['osascript', '-e', 'tell application "Terminal" to activate'], capture_output=True)
    time.sleep(0.1)
    subprocess.run(['osascript', '-e', 'tell application "Terminal" to set frontmost to false'], capture_output=True)

def monitor_output(text):
    """Check if output indicates Claude is waiting"""
    lines = text.strip().split('\n')
    if not lines:
        return False
        
    last_line = lines[-1].strip()
    
    # Common waiting patterns
    waiting_indicators = [
        last_line == '>',
        last_line == '❯',
        last_line == '$',
        last_line.endswith(':'),
        last_line.endswith('?'),
        'waiting' in last_line.lower(),
        'enter' in last_line.lower() and ':' in last_line,
        len(last_line) < 5 and any(c in last_line for c in ['>', '$', ':', '?', '❯'])
    ]
    
    return any(waiting_indicators)

def main():
    print("Claude Notify Wrapper (Simple)")
    print("Starting Claude...")
    print("---")
    
    # Use pty to handle interactive mode properly
    import pty
    import termios
    import tty
    
    # Save terminal settings
    old_tty = termios.tcgetattr(sys.stdin)
    
    try:
        # Create a pseudo-terminal
        master_fd, slave_fd = pty.openpty()
        
        # Start Claude in the pty
        cmd = [CLAUDE_PATH] + sys.argv[1:]
        process = subprocess.Popen(
            cmd,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            close_fds=True
        )
        
        # Close slave fd in parent
        os.close(slave_fd)
        
        # Put terminal in raw mode
        tty.setraw(sys.stdin.fileno())
        
        # Monitor claude output
        last_notification = 0
        output_buffer = ""
        waiting_detected = False
        
        while True:
            # Check if process is still running
            if process.poll() is not None:
                break
                
            # Use select to check for available data
            r, w, e = select.select([sys.stdin, master_fd], [], [], 0.1)
            
            # Handle input from user
            if sys.stdin in r:
                data = os.read(sys.stdin.fileno(), 1024)
                if data:
                    os.write(master_fd, data)
                    waiting_detected = False  # Reset when user types
                    
            # Handle output from Claude
            if master_fd in r:
                try:
                    data = os.read(master_fd, 1024)
                    if data:
                        # Write to stdout
                        os.write(sys.stdout.fileno(), data)
                        
                        # Add to buffer for analysis
                        try:
                            output_buffer += data.decode('utf-8', errors='ignore')
                        except:
                            output_buffer = ""
                        
                        # Keep buffer reasonable size
                        if len(output_buffer) > 1000:
                            output_buffer = output_buffer[-500:]
                        
                        # Check if Claude is waiting
                        current_time = time.time()
                        if (not waiting_detected and 
                            current_time - last_notification > 3 and
                            monitor_output(output_buffer)):
                            waiting_detected = True
                            last_notification = current_time
                            # Send notification in background
                            subprocess.Popen(['python3', '-c', 
                                'import subprocess, time; time.sleep(0.5); ' +
                                'subprocess.run(["afplay", "/System/Library/Sounds/Glass.aiff"], capture_output=True); ' +
                                'subprocess.run(["osascript", "-e", \'display notification "Claude is waiting for your input" with title "Claude Code"\'], capture_output=True)'
                            ])
                except OSError:
                    break
                    
    except KeyboardInterrupt:
        pass
    finally:
        # Restore terminal settings
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_tty)
        
        # Clean up
        try:
            os.close(master_fd)
        except:
            pass
            
        # Wait for process to finish
        if process.poll() is None:
            process.terminate()
            process.wait()

if __name__ == "__main__":
    if '--test' in sys.argv:
        print("Testing notification system...")
        send_notification()
        print("Test complete.")
    else:
        main()