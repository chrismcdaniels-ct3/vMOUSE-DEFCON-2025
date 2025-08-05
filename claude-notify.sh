#!/bin/bash

# Claude Code wrapper with notification support
# This script monitors Claude output and triggers notifications when waiting for input

# Configuration
CLAUDE_CMD="claude"
BELL_ENABLED=true
NOTIFICATION_ENABLED=true
DOCK_BOUNCE_ENABLED=true

# ANSI escape codes
BELL='\007'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to send notifications
send_notification() {
    local message="$1"
    
    # Terminal bell
    if [[ "$BELL_ENABLED" == true ]]; then
        printf "$BELL"
    fi
    
    # macOS notification
    if [[ "$NOTIFICATION_ENABLED" == true ]]; then
        osascript -e "display notification \"$message\" with title \"Claude Code\" sound name \"Glass\""
    fi
    
    # Dock bounce
    if [[ "$DOCK_BOUNCE_ENABLED" == true ]]; then
        osascript -e 'tell application "Terminal" to activate' &
        sleep 0.1
        osascript -e 'tell application "Terminal" to set frontmost to false' &
    fi
}

# Function to monitor Claude output
monitor_claude() {
    local waiting_pattern='(>|❯|$|assistant:.*waiting|Type.*to|Enter.*:|Input.*:)'
    local in_waiting_state=false
    
    while IFS= read -r line; do
        # Print the line as-is
        echo "$line"
        
        # Check if Claude is waiting for input
        if [[ "$line" =~ $waiting_pattern ]] || [[ "$line" == *">"* && ${#line} -lt 10 ]]; then
            if [[ "$in_waiting_state" == false ]]; then
                in_waiting_state=true
                send_notification "Claude is waiting for your input"
                
                # Visual indicator in terminal
                echo -e "${YELLOW}[🔔 Notification sent - Claude is waiting]${NC}" >&2
            fi
        else
            # Reset waiting state on substantial output
            if [[ ${#line} -gt 20 ]]; then
                in_waiting_state=false
            fi
        fi
    done
}

# Show configuration
echo -e "${GREEN}Claude Notify Wrapper${NC}"
echo "Bell: $BELL_ENABLED | Notifications: $NOTIFICATION_ENABLED | Dock Bounce: $DOCK_BOUNCE_ENABLED"
echo "Starting Claude with args: $@"
echo "---"

# Run Claude with monitoring
if [[ "$1" == "--test" ]]; then
    # Test mode
    echo "Testing notification system..."
    send_notification "Test notification from Claude wrapper"
    echo -e "${GREEN}Test complete. You should have received notifications.${NC}"
else
    # Run Claude with all arguments passed through
    $CLAUDE_CMD "$@" 2>&1 | monitor_claude
fi