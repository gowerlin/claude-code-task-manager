---
name: task-create
description: Create a new task with title, description, priority, and tags
tags: [task, create, productivity]
args:
  - name: title
    type: string
    required: true
    description: The title of the task
  - name: description
    type: string
    required: false
    description: Detailed description of the task
  - name: priority
    type: string
    required: false
    default: medium
    description: Priority level (low, medium, high, urgent)
  - name: tags
    type: string
    required: false
    description: Comma-separated tags for categorization
author: Gower
---

# 📝 Create Task

Creates a new task in the Claude Code Task Manager system with persistent storage across sessions.

## Usage

```bash
cctm create "<title>" [options]
```

### Options

- `-d, --description <description>` - Detailed description of the task
- `-p, --priority <priority>` - Priority level: low, medium (default), high, urgent
- `-t, --tags <tags>` - Comma-separated tags for categorization
- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Basic task creation
```bash
cctm create "Implement authentication"
```

### Task with description and priority
```bash
cctm create "Implement authentication" -d "Add JWT-based authentication" -p high
```

### Task with tags
```bash
cctm create "Fix login bug" -p urgent -t "backend,security,bug"
```

### JSON output
```bash
cctm create "Update documentation" --json
```

## Output

### Standard Output
```
✓ Task created successfully!
ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Title: Implement authentication
Description: Add JWT-based authentication
Priority: High
Status: Pending
```

### JSON Output
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "status": "pending",
    "priority": "high",
    "tags": ["backend", "security"],
    "createdAt": "2025-11-01T03:30:00.000Z",
    "updatedAt": "2025-11-01T03:30:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

## Task Properties

- **id**: Unique identifier (UUID)
- **title**: Task title
- **description**: Optional detailed description
- **status**: Always "pending" for new tasks
- **priority**: Priority level (low/medium/high/urgent)
- **tags**: Array of categorization tags
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp
- **sessionId**: Session ID where task was created

## Storage

Tasks are automatically saved to:
- Linux/macOS: `~/.claude-task-manager/tasks.json`
- Windows: `%USERPROFILE%\.claude-task-manager\tasks.json`
