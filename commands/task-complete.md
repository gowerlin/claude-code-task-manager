---
name: task-complete
description: Mark a task as completed
tags: [task, complete, done]
args:
  - name: id
    type: string
    required: true
    description: The task ID to mark as completed
author: Gower
---

# ✅ Complete Task

Marks a task as completed and sets the completion timestamp.

## Usage

```bash
cctm complete <id> [options]
```

### Arguments

- `id` - Task ID (full UUID or first 8 characters)

### Options

- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Complete a task
```bash
cctm complete a1b2c3d4
```

### Complete with JSON output
```bash
cctm complete a1b2c3d4 --json
```

## Output

### Standard Output
```
✓ Task completed successfully!
Title: Implement authentication
```

### JSON Output
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "status": "completed",
    "priority": "high",
    "tags": ["backend", "security"],
    "createdAt": "2025-11-01T03:30:00.000Z",
    "updatedAt": "2025-11-01T04:00:00.000Z",
    "completedAt": "2025-11-01T04:00:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

## What Happens

When you complete a task:
1. Status is set to `completed`
2. `completedAt` timestamp is recorded
3. `updatedAt` timestamp is updated
4. Changes are persisted to disk

## Use Cases

- Mark finished work as complete
- Track task completion times
- Clean up your pending task list
- Generate completion reports (use --json)

## Related Commands

- `cctm list --status completed` - View all completed tasks
- `cctm update <id> -s completed` - Alternative way to mark as complete
