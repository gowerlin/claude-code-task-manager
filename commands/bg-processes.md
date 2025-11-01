---
name: bg-processes
description: List and manage background processes, similar to /bashes command
tags: [background, process, monitoring, bashes]
args:
  - name: running
    type: boolean
    required: false
    description: Show only running processes
author: Gower
---

# 🔄 Background Processes (Bashes)

Lists and monitors background processes, inspired by the `/bashes` command concept from Claude Code issue #7069.

## Usage

```bash
cctm bashes [options]
# or
cctm background [options]
```

### Options

- `--running` - Show only running processes
- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### List all background processes
```bash
cctm bashes
```

### List only running processes
```bash
cctm bashes --running
```

### List with JSON output
```bash
cctm background --json
```

## Output

### Standard Output
```
Background Processes

[a1b2c3d4] PID: 12345
  Status: running
  Command: npm run dev
  Started: 11/1/2025, 3:30:00 AM

[b2c3d4e5] PID: 12346
  Status: completed
  Command: npm run build
  Started: 11/1/2025, 3:00:00 AM
  Exit Code: 0

[c3d4e5f6] PID: 12347
  Status: failed
  Command: npm test
  Started: 11/1/2025, 2:00:00 AM
  Exit Code: 1

Total: 3 | Running: 1 | Completed: 1 | Failed: 1
```

### JSON Output
```json
{
  "success": true,
  "processes": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "processId": 12345,
      "command": "npm run dev",
      "status": "running",
      "startedAt": "2025-11-01T03:30:00.000Z",
      "sessionId": "session-abc123"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "processId": 12346,
      "command": "npm run build",
      "status": "completed",
      "exitCode": 0,
      "startedAt": "2025-11-01T03:00:00.000Z",
      "endedAt": "2025-11-01T03:05:00.000Z",
      "sessionId": "session-abc123"
    }
  ],
  "statistics": {
    "total": 3,
    "running": 1,
    "completed": 1,
    "failed": 1
  }
}
```

## Process Status

- **running**: Process is currently executing
- **completed**: Process finished successfully (exit code 0)
- **failed**: Process terminated with error (non-zero exit code)

## Features

Based on [Claude Code issue #7069](https://github.com/anthropics/claude-code/issues/7069), this provides:

- **Task Discovery**: Find all background processes across sessions
- **Real-time Status**: Monitor process execution state
- **Unified Control**: Manage processes from a single interface
- **Session Persistence**: Track processes beyond current session
- **Output Viewing**: Access process logs and output

## Use Cases

- Monitor development servers (`npm run dev`)
- Track build processes
- Check test suite status
- Debug long-running operations
- Manage multiple concurrent tasks

## Related Commands

- `cctm bg-create <title> <command>` - Start a new background process
- `cctm bg-kill <id>` - Terminate a background process
- `cctm bg-logs <id>` - View process output/logs
