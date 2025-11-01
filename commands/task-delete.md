---
name: task-delete
description: Delete a task permanently from the system
tags: [task, delete, remove]
args:
  - name: id
    type: string
    required: true
    description: The task ID to delete
author: Gower
---

# 🗑️ Delete Task

Permanently removes a task from the system.

## Usage

```bash
cctm delete <id> [options]
```

### Arguments

- `id` - Task ID (full UUID or first 8 characters)

### Options

- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Delete a task
```bash
cctm delete a1b2c3d4
```

### Delete with JSON output
```bash
cctm delete a1b2c3d4 --json
```

## Output

### Standard Output
```
✓ Task deleted successfully!
```

### JSON Output
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Important Notes

⚠️ **Warning**: This action is permanent and cannot be undone!

- The task will be completely removed from storage
- Task cannot be recovered after deletion
- Consider using `cctm update <id> -s cancelled` as an alternative
- Use `cctm export` before deletion if you need to keep a backup

## Alternatives

Instead of deleting, you can:
- **Cancel**: `cctm update <id> -s cancelled` - Marks as cancelled but keeps history
- **Archive**: Export tasks periodically for record-keeping
- **Filter**: Use `cctm list --status pending` to hide completed/cancelled tasks

## Use Cases

- Remove duplicate tasks
- Clean up test/temporary tasks
- Delete accidentally created tasks
- Maintain a clean task list

## Related Commands

- `cctm export <file>` - Backup tasks before deletion
- `cctm update <id> -s cancelled` - Soft delete alternative
