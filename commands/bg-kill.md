---
name: bg-kill
description: Terminate a running background process
tags: [background, process, kill, stop, terminate]
args:
  - name: id
    type: string
    required: true
    description: Task ID or process ID to terminate
author: Gower
---

# 🛑 Kill Background Process

Terminates a running background process.

## Usage

```bash
cctm bg-kill <id> [options]
```

### Arguments

- `id` - Task ID or process ID (full UUID or first 8 characters)

### Options

- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Kill by task ID
```bash
cctm bg-kill a1b2c3d4
```

### Kill by full UUID
```bash
cctm bg-kill a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Kill with JSON output
```bash
cctm bg-kill a1b2c3d4 --json
```

## Output

### Standard Output
```
✓ Background process killed
```

### JSON Output
```json
{
  "success": true,
  "message": "Background process killed",
  "processId": 12345
}
```

## What Happens

When you kill a background process:
1. SIGTERM signal sent to the process
2. Process status updated to "failed"
3. Exit code recorded (if available)
4. Final output captured
5. Task marked with termination timestamp

## Use Cases

- Stop development servers when switching tasks
- Terminate hung or frozen processes
- Cancel long-running builds
- Clean up test processes
- Free system resources

## Finding Process to Kill

First list processes to find the ID:
```bash
cctm bashes
```

Output:
```
[a1b2c3d4] PID: 12345
  Status: running
  Command: npm run dev
  Started: 11/1/2025, 3:30:00 AM
```

Then kill it:
```bash
cctm bg-kill a1b2c3d4
```

## Important Notes

⚠️ **Warning**:
- Process termination is immediate
- Unsaved data may be lost
- Some processes may require cleanup
- Child processes may continue running

## Graceful vs Forceful

This command sends SIGTERM (graceful):
- Allows process to cleanup
- Saves state if implemented
- Recommended for most cases

For stubborn processes, use system kill:
```bash
kill -9 <PID>
```

## Error Handling

Common errors:
- **Process not found**: ID doesn't exist or already terminated
- **Already stopped**: Process has already exited
- **Permission denied**: Insufficient permissions to kill process

## Related Commands

- `cctm bashes` - List all background processes
- `cctm bashes --running` - List only running processes
- `cctm bg-logs <id>` - View final output before killing
