---
name: task-import
description: Import tasks from a JSON file (exported or compatible format)
tags: [task, import, restore, migrate]
args:
  - name: file
    type: string
    required: true
    description: Input file path containing tasks to import
author: Gower
---

# 📥 Import Tasks

Imports tasks from a JSON file, useful for restoring backups or migrating tasks.

## Usage

```bash
cctm import <file> [options]
```

### Arguments

- `file` - Input file path (e.g., `./tasks-backup.json`)

### Options

- `--lang <language>` - Language for output messages (en, zh-TW)

## Examples

### Import from backup file
```bash
cctm import ./tasks-backup.json
```

### Import from specific location
```bash
cctm import /home/user/backups/tasks-2025-11-01.json
```

### Import from relative path
```bash
cctm import ../shared/team-tasks.json
```

## Output

### Success Message
```
✓ Imported 15 tasks from ./tasks-backup.json
```

## Expected File Format

The import file should match the export format:

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
    }
  ]
}
```

## Behavior

- **Duplicate IDs**: If a task with the same ID exists, it will be updated
- **New Tasks**: Tasks with new IDs will be added
- **Preservation**: Existing tasks not in the import file are preserved
- **Merge**: Import merges with existing tasks rather than replacing

## Use Cases

- **Restore Backups**: Recover tasks after data loss
- **Team Collaboration**: Import tasks shared by team members
- **Migration**: Move tasks from another system or machine
- **Merge Projects**: Combine task lists from multiple sources
- **Testing**: Load test data for development

## Important Notes

⚠️ **Before Importing**:
- Back up your current tasks first: `cctm export ./backup.json`
- Verify the import file format is correct
- Check for ID conflicts if merging multiple sources

## Error Handling

Common errors:
- **File not found**: Verify the file path is correct
- **Invalid JSON**: Check the file format matches expected structure
- **Permission denied**: Ensure you have read access to the file

## Related Commands

- `cctm export <file>` - Export tasks to a file
- `cctm list --json` - View current tasks in JSON format
