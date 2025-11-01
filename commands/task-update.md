---
name: task-update
description: Update task properties (title, description, status, priority)
tags: [task, update, modify]
args:
  - name: id
    type: string
    required: true
    description: The task ID to update
  - name: title
    type: string
    required: false
    description: New title for the task
  - name: description
    type: string
    required: false
    description: New description
  - name: status
    type: string
    required: false
    description: New status (pending, in_progress, completed, cancelled)
  - name: priority
    type: string
    required: false
    description: New priority (low, medium, high, urgent)
author: Gower
---

# ✏️ Update Task

Updates one or more properties of an existing task.

## Usage

```bash
cctm update <id> [options]
```

### Arguments

- `id` - Task ID (full UUID or first 8 characters)

### Options

- `-t, --title <title>` - Update the task title
- `-d, --description <description>` - Update the task description
- `-s, --status <status>` - Update status: pending, in_progress, completed, cancelled
- `-p, --priority <priority>` - Update priority: low, medium, high, urgent
- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Update status
```bash
cctm update a1b2c3d4 -s in_progress
```

### Update priority
```bash
cctm update a1b2c3d4 -p urgent
```

### Update multiple properties
```bash
cctm update a1b2c3d4 -t "Implement OAuth2" -d "Use OAuth2 instead of JWT" -p high
```

### Update with JSON output
```bash
cctm update a1b2c3d4 -s completed --json
```

## Output

### Standard Output
```
✓ Task updated successfully!
Title: Implement authentication
Status: In Progress
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

## Status Workflow

Typical task lifecycle:
1. **pending** → Task created, not started
2. **in_progress** → Work has begun
3. **completed** → Task finished successfully
4. **cancelled** → Task abandoned or no longer needed

## Notes

- The `updatedAt` timestamp is automatically updated
- When status changes to `completed`, the `completedAt` timestamp is set
- All changes are immediately persisted to disk
- You can update multiple properties in a single command
