---
name: task-export
description: Export all tasks to a JSON file for backup or sharing
tags: [task, export, backup, share]
args:
  - name: file
    type: string
    required: true
    description: Output file path for exported tasks
author: Gower
---

# 📤 Export Tasks

Exports all tasks to a JSON file for backup, sharing, or migration purposes.

## Usage

```bash
cctm export <file> [options]
```

### Arguments

- `file` - Output file path (e.g., `./tasks-backup.json`)

### Options

- `--lang <language>` - Language for output messages (en, zh-TW)

## Examples

### Export to current directory
```bash
cctm export ./tasks-backup.json
```

### Export to specific location
```bash
cctm export /home/user/backups/tasks-2025-11-01.json
```

### Export with relative path
```bash
cctm export ../backups/tasks.json
```

## Output

### Success Message
```
✓ Tasks exported to ./tasks-backup.json
```

### Exported File Format
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-11-01T04:00:00.000Z",
  "tasks": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Implement authentication",
      "description": "Add JWT-based authentication",
      "status": "completed",
      "priority": "high",
      "tags": ["backend", "security"],
      "createdAt": "2025-11-01T03:30:00.000Z",
      "updatedAt": "2025-11-01T03:35:00.000Z",
      "completedAt": "2025-11-01T03:35:00.000Z",
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
  ]
}
```

## Use Cases

- **Regular Backups**: Schedule periodic exports for data safety
- **Team Sharing**: Share task lists with team members
- **Migration**: Move tasks between systems or machines
- **Reporting**: Generate reports from exported data
- **Version Control**: Track task history by committing exports
- **Archiving**: Save completed tasks before cleanup

## Best Practices

1. **Regular Backups**: Export daily or weekly
2. **Meaningful Names**: Use timestamps in filenames (e.g., `tasks-2025-11-01.json`)
3. **Version Control**: Store exports in git for history
4. **Before Cleanup**: Always export before deleting tasks

## Related Commands

- `cctm import <file>` - Import tasks from an exported file
- `cctm list --json` - View current tasks in JSON format
