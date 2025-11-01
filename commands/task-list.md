---
name: task-list
description: List all tasks with optional filtering by status, priority, or session
tags: [task, list, view, productivity]
args:
  - name: status
    type: string
    required: false
    description: Filter by status (pending, in_progress, completed, cancelled)
  - name: priority
    type: string
    required: false
    description: Filter by priority (low, medium, high, urgent)
  - name: session
    type: boolean
    required: false
    description: Show only current session tasks
author: Gower
---

# 📋 List Tasks

Lists all tasks in the system with optional filtering capabilities.

## Usage

```bash
cctm list [options]
```

### Options

- `-s, --status <status>` - Filter by status: pending, in_progress, completed, cancelled
- `-p, --priority <priority>` - Filter by priority: low, medium, high, urgent
- `--session` - Show only tasks from the current session
- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### List all tasks
```bash
cctm list
```

### List pending tasks
```bash
cctm list --status pending
```

### List high priority tasks
```bash
cctm list --priority high
```

### List current session tasks
```bash
cctm list --session
```

### List with JSON output
```bash
cctm list --status in_progress --json
```

### List in Traditional Chinese
```bash
cctm list --lang=zh-TW
```

## Output

### Standard Output
```
📋 Task List
Total tasks: 5

[a1b2c3d4] Implement authentication
  Status: In Progress
  Priority: High
  Description: Add JWT-based authentication
  Tags: backend, security
  Created: 11/1/2025, 3:30:00 AM

[b2c3d4e5] Update documentation
  Status: Pending
  Priority: Medium
  Tags: docs
  Created: 11/1/2025, 4:00:00 AM

...
```

### JSON Output
```json
{
  "success": true,
  "tasks": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Implement authentication",
      "description": "Add JWT-based authentication",
      "status": "in_progress",
      "priority": "high",
      "tags": ["backend", "security"],
      "createdAt": "2025-11-01T03:30:00.000Z",
      "updatedAt": "2025-11-01T03:35:00.000Z",
      "sessionId": "session-abc123"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "title": "Update documentation",
      "status": "pending",
      "priority": "medium",
      "tags": ["docs"],
      "createdAt": "2025-11-01T04:00:00.000Z",
      "updatedAt": "2025-11-01T04:00:00.000Z",
      "sessionId": "session-abc123"
    }
  ],
  "count": 2
}
```

## Status Colors

- **Pending**: Yellow
- **In Progress**: Blue
- **Completed**: Green
- **Cancelled**: Red

## Use Cases

- Review all pending tasks before starting work
- Check progress on current session tasks
- Find high-priority items that need attention
- Export task data for reporting (use --json)
