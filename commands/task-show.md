---
name: task-show
description: Show detailed information about a specific task
tags: [task, show, view, details]
args:
  - name: id
    type: string
    required: true
    description: The task ID (full UUID or first 8 characters)
author: Gower
---

# 🔍 Show Task Details

Displays complete information about a specific task.

## Usage

```bash
cctm show <id> [options]
```

### Arguments

- `id` - Task ID (can use full UUID or just first 8 characters)

### Options

- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Show task with full ID
```bash
cctm show a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Show task with short ID
```bash
cctm show a1b2c3d4
```

### Show with JSON output
```bash
cctm show a1b2c3d4 --json
```

## Output

### Standard Output
```
Implement authentication
ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Status: In Progress
Priority: High
Description: Add JWT-based authentication
Tags: backend, security
Created: 11/1/2025, 3:30:00 AM
Updated: 11/1/2025, 3:35:00 AM
Session ID: session-abc123
```

### JSON Output
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "status": "in_progress",
    "priority": "high",
    "tags": ["backend", "security"],
    "createdAt": "2025-11-01T03:30:00.000Z",
    "updatedAt": "2025-11-01T03:35:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

### Completed Task Example
```
Fix login bug
ID: b2c3d4e5-f6a7-8901-bcde-f12345678901
Status: Completed
Priority: Urgent
Description: Fix authentication timeout issue
Tags: backend, bug, security
Created: 11/1/2025, 2:00:00 AM
Updated: 11/1/2025, 3:00:00 AM
Completed: 11/1/2025, 3:00:00 AM
Session ID: session-xyz789
```

## Error Handling

If the task is not found:
```
✗ Task not found
```

JSON error output:
```json
{
  "success": false,
  "error": "Task not found"
}
```
