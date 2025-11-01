---
name: bg-create
description: Create and start a new background process task
tags: [background, process, create, start]
args:
  - name: title
    type: string
    required: true
    description: Descriptive title for the background task
  - name: command
    type: string
    required: true
    description: Shell command to execute in background
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

# 🚀 Create Background Process

Creates and immediately starts a new background process task.

## Usage

```bash
cctm bg-create "<title>" "<command>" [options]
```

### Arguments

- `title` - Descriptive title for the task
- `command` - Shell command to run in background

### Options

- `-d, --description <description>` - Detailed description
- `-p, --priority <priority>` - Priority level: low, medium (default), high, urgent
- `-t, --tags <tags>` - Comma-separated tags
- `--json` - Output result in JSON format
- `--lang <language>` - Language for output (en, zh-TW)

## Examples

### Start development server
```bash
cctm bg-create "Dev Server" "npm run dev" -d "Start development server" -p high
```

### Run tests in background
```bash
cctm bg-create "Test Suite" "npm test" -t "testing,ci"
```

### Build project
```bash
cctm bg-create "Production Build" "npm run build" -p urgent
```

### Start multiple processes
```bash
cctm bg-create "Backend API" "cd backend && npm start" -t "api,backend"
cctm bg-create "Frontend Dev" "cd frontend && npm run dev" -t "ui,frontend"
```

### With JSON output
```bash
cctm bg-create "Watch Mode" "npm run watch" --json
```

## Output

### Standard Output
```
✓ Background task created and started
Task ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Title: Dev Server
Command: npm run dev
PID: 12345
Status: In Progress
```

### JSON Output
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Dev Server",
    "description": "Start development server",
    "command": "npm run dev",
    "processId": 12345,
    "status": "in_progress",
    "priority": "high",
    "tags": ["dev", "server"],
    "createdAt": "2025-11-01T03:30:00.000Z",
    "startedAt": "2025-11-01T03:30:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

## Process Management

Once created, the background process:
1. Starts immediately
2. Runs independently of the terminal
3. Persists across Claude Code sessions
4. Captures output for later viewing
5. Tracks exit codes and status

## Common Use Cases

### Development
```bash
cctm bg-create "Hot Reload" "npm run dev" -t "development"
cctm bg-create "TypeScript Watch" "tsc --watch" -t "compilation"
```

### Testing
```bash
cctm bg-create "Unit Tests" "npm run test:watch" -t "testing"
cctm bg-create "E2E Tests" "npm run test:e2e" -t "testing,e2e"
```

### Building
```bash
cctm bg-create "Production Build" "npm run build:prod" -p urgent
cctm bg-create "Docker Build" "docker build -t myapp ." -t "docker"
```

### Servers
```bash
cctm bg-create "API Server" "node server.js" -p high -t "api"
cctm bg-create "Database" "docker-compose up db" -p high -t "database"
```

## Related Commands

- `cctm bashes` - List all background processes
- `cctm bg-kill <id>` - Stop a background process
- `cctm bg-logs <id>` - View process output
