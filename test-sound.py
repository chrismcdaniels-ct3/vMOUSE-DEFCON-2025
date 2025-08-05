#!/usr/bin/env python3
import subprocess
import time

print("Testing sound output methods...")

# Test 1: Direct afplay
print("\n1. Testing afplay directly:")
result = subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], capture_output=True)
print(f"   afplay exit code: {result.returncode}")
if result.stderr:
    print(f"   Error: {result.stderr.decode()}")
time.sleep(1)

# Test 2: osascript beep
print("\n2. Testing osascript beep:")
result = subprocess.run(['osascript', '-e', 'beep'], capture_output=True)
print(f"   osascript beep exit code: {result.returncode}")
time.sleep(1)

# Test 3: Terminal bell
print("\n3. Testing terminal bell:")
print('\a', end='', flush=True)
print("   Bell character sent")
time.sleep(1)

# Test 4: Volume check
print("\n4. Checking volume settings:")
result = subprocess.run(['osascript', '-e', 'get volume settings'], capture_output=True, text=True)
print(f"   {result.stdout.strip()}")

# Test 5: Different sound with max volume
print("\n5. Testing louder sound (Hero):")
subprocess.run(['osascript', '-e', 'set volume output volume 100'], capture_output=True)
result = subprocess.run(['afplay', '/System/Library/Sounds/Hero.aiff'], capture_output=True)
print(f"   Hero sound exit code: {result.returncode}")

print("\nDid you hear any sounds? (Glass, beep, bell, or Hero)")