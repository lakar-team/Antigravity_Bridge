# Implementation Plan: Automated Remote Task Polling

## Goal
Enable the Antigravity Agent to automatically detect and process tasks sent from the web dashboard/mobile phone without manual user intervention in the IDE terminal.

## Methodology: Long-Polling
Since the AI agent only "thinks" upon an event (user message or tool completion), we will create a continuous loop by starting a background process that waits for files and then checking its status with a high timeout (Long-Polling).

## Steps
1. **Create Wait Script (`check_inbox.ps1`)**:
   - Loops and waits until a file appears in `C:\antigravity-bridge\inbox`.
   - Exits when a file is found with a "FOUND" signal.
2. **Launch Background Process**:
   - Run the script in the background.
3. **Ghost Listen Mode**:
   - Agent calls `command_status` with `WaitDurationSeconds: 300` (5 minutes).
   - If a file is sent from the phone within 5 minutes, the command exits, the agent wakes up, processes the task, and restarts the loop.
   - If it times out, the agent simply restarts the wait.

## Debugging
- All polling activity will be logged to `C:\antigravity-bridge\poll_status.log`.
