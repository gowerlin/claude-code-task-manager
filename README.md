# Claude Code Task Manager

[English](#english) | [繁體中文](./README_ZH-TW.md)

---

![CI](https://github.com/gowerlin/claude-code-task-manager/actions/workflows/release.yml/badge.svg)
![GitHub release](https://img.shields.io/github/v/release/gowerlin/claude-code-task-manager)
![License](https://img.shields.io/github/license/gowerlin/claude-code-task-manager)

---

## English

> 🚀 A cross-session intelligent task management system designed for Claude Code and VSCode, enabling collaborative background task management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 Table of Contents

- [Features](#features)
- [Design Philosophy](#design-philosophy)
- [Core Capabilities](#core-capabilities)
- [System Architecture](#system-architecture)
- [Installation Guide](#installation-guide)
- [Quick Start](#quick-start)
- [Complete Usage Guide](#complete-usage-guide)
- [Real-World Use Cases](#real-world-use-cases)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

- 🌐 **Multi-language Support**: Built-in English and Traditional Chinese (zh-TW) support
- 💾 **Persistent Storage**: Tasks are automatically saved and persist across sessions
- 🔄 **Cross-Session Management**: Track tasks across different Claude Code sessions
- 🎯 **Priority & Status Management**: Organize tasks with priorities and status tracking
- 🏷️ **Tag System**: Categorize tasks with custom tags
- 📤 **Import/Export**: Backup and restore tasks easily
- 🖥️ **CLI Interface**: Powerful command-line interface for task management
- 🔧 **Background Process Management**: Integrated `/bashes`-like functionality for managing background processes (see [issue #7069](https://github.com/anthropics/claude-code/issues/7069))
- 🔌 **Claude Code Plugin**: Available as a Claude Code CLI plugin for seamless integration
- 📊 **JSON Output**: Support for structured JSON output for all commands
- 🔀 **Intelligent Conflict Resolution**: Automatically stops conflicting tasks before starting new ones
- 🔗 **Dependency Management**: Automatically starts dependent tasks when needed
- 🎯 **Advanced Task Types**: Support for build, serve, watch, test, and custom task types
- 📁 **Project Grouping**: Organize and filter tasks by project name
- 🔍 **Process Discovery**: Find tasks by PID or command pattern
- ⚡ **Batch Operations**: Perform operations on multiple tasks simultaneously

---

## 🎯 Design Philosophy

### Why do we need this tool?

When using Claude Code CLI or VSCode for development, we often encounter the following problems:

1. **Background tasks lose control after session disconnection**
   - Background tasks started by Claude Code cannot be tracked after session ends
   - Dev servers, monitoring scripts continue running but cannot be managed
   - Need to manually use `ps` + `kill` to clean up processes

2. **Task conflicts cause errors**
   - During rebuild, dev server locks files
   - Multiple tasks writing to the same port cause conflicts
   - Lack of automated conflict detection and handling

3. **Lack of cross-tool collaboration**
   - Tasks created by Claude Code and VSCode Tasks cannot interoperate
   - Tasks started by Bash/PowerShell scripts lack unified management
   - Different tools work independently, difficult to coordinate

### Solution

**Claude Code Task Manager** provides a unified task management layer:

```
┌─────────────────────────────────────────────────────┐
│       Unified Task Management Layer                  │
│  - Persistent storage (~/.claude-task-manager/)     │
│  - Intelligent conflict detection                    │
│  - Cross-session state tracking                      │
└─────────────────────────────────────────────────────┘
          ▲              ▲              ▲
          │              │              │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
    │  Claude   │  │  VSCode   │  │   Bash    │
    │   Code    │  │   Tasks   │  │  Scripts  │
    └───────────┘  └───────────┘  └───────────┘
```

### Core Design Principles

1. **Persistence First**: All task states stored in JSON files, available across sessions
2. **Intelligent Management**: Automatically handles conflicts and dependencies
3. **Tool Neutral**: Supports tasks created by any tool or script
4. **Cross-Platform**: Full support for Windows, WSL, macOS, Linux

---

## ✨ Core Capabilities

### 1. Cross-Session Persistence

```bash
# Session 1: Start dev server
cctm add dev-server "Dev Server" "npm run dev" --type serve
cctm start dev-server

# Close terminal, reopen...

# Session 2: Task still under management
cctm list
# ▶ [dev-server] Dev Server
#   Status: running (PID: 12345)
```

### 2. Intelligent Conflict Handling

```bash
# Define conflict relationship
cctm add build "Build Project" "npm run build" \
  --type build \
  --conflicts dev-server

# Automatically stops conflicting tasks on start
cctm start build
# ⚠ Detected conflicting task, preparing to stop...
#   → Stopping conflicting task: dev-server
# ✓ Task stopped: dev-server
# ▶ Starting task: build
```

### 3. Dependency Management

```bash
# Define dependency relationship
cctm add api-tests "API Tests" "npm test" \
  --deps api-server,database

# Automatically starts dependencies on start
cctm start api-tests
# ⚠ Checking dependency tasks...
#   → Starting dependency task: api-server
#   → Starting dependency task: database
# ▶ Starting task: api-tests
```

### 4. Cross-Tool Management

```bash
# Find by PID or command
cctm find-cmd "npm"
# ✓ Found 2 matching tasks

# Add to management
cctm add from-external "External Service" "npm run dev" --type serve
```

### 5. Batch Operations

```bash
# Start multiple services at once
cctm batch start web-app,api-server,database

# Stop all tasks for a specific project
cctm stop-all --project MyApp

# Clean up stopped tasks
cctm cleanup
```

---

## 🏗️ System Architecture

### Data Structure

```typescript
interface Task {
  id: string;                    // Unique task identifier
  title: string;                 // Task title
  description?: string;          // Task description
  command?: string;              // Command to execute
  cwd?: string;                  // Working directory
  pid?: number;                  // Process ID
  status: TaskStatus;            // Status
  priority: TaskPriority;        // Priority
  type: TaskType;                // Task type
  project?: string;              // Project name
  conflicts?: string[];          // Conflicting task IDs
  dependencies?: string[];       // Dependent task IDs
  logFile?: string;              // Log file path
  createdAt: Date;               // Creation time
  updatedAt: Date;               // Update time
}
```

### File Structure

```
~/.claude-task-manager/
├── tasks.json              # Task storage (persistent)
└── logs/                   # Task log directory
    ├── dev-server.log
    ├── build.log
    └── api-server.log
```

### Core Flow

```
Start Task (start)
    ↓
Check conflicting tasks → Yes → Stop conflicting tasks → Wait 1 sec
    ↓                                                     ↓
    No                                                    ↓
    ↓ ←───────────────────────────────────────────────────┘
Check dependency tasks → Yes → Start dependency tasks
    ↓
    No
    ↓
spawn process (detached)
    ↓
Record PID
    ↓
Update status to running
    ↓
Save to tasks.json
```

---

## 📦 Installation Guide

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- TypeScript 5.0+ (automatically installed)

### Installation Methods

#### Method 1: Global Installation (Recommended)

```bash
npm install -g claude-code-task-manager
```

#### Method 2: Local Installation

```bash
npm install claude-code-task-manager
```

### Verify Installation

```bash
# Show help message
cctm --help

# Initialize session
cctm session-start
# Should output:
# 🚀 New session started
#    Session ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 🚀 Quick Start

### 5-Minute Tutorial

```bash
# 1. Add a dev server task
cctm add dev-server "Dev Server" "npm run dev" \
  --type serve \
  --project MyWebApp

# 2. Start the task
cctm start dev-server
# ▶ Started task: Dev Server
# ✓ PID: 12345
#   Log: ~/.claude-task-manager/logs/dev-server.log

# 3. View all tasks
cctm list
# [dev-server] Dev Server
#   Status: Running
#   Priority: Medium
#   ...

# 4. View logs
cctm log dev-server --lines 20

# 5. Stop the task
cctm stop dev-server
# ■ Stopped task: Dev Server
```

### Basic Workflow

```bash
# Start work in the morning
cctm session-start
cctm start dev-server

# Need to rebuild at noon
cctm add build "Build Project" "npm run build" \
  --type build \
  --conflicts dev-server
cctm start build  # Automatically stops dev-server

# After build completes, restart dev server
cctm restart dev-server

# Check all running tasks before leaving work
cctm list --status running

# Stop all tasks
cctm stop-all

# Clean up stopped tasks
cctm cleanup

# End session
cctm session-end
```

---

## 📚 Complete Usage Guide

### Task Management Commands

#### Add Tasks

```bash
# Basic syntax
cctm add <id> <description> <command> [options]

# Complete example
cctm add api-server "Backend API Server" "npm run dev" \
  --cwd /path/to/project \
  --type serve \
  --project MyApp \
  --conflicts build,test \
  --deps database

# Options:
# --cwd <path>           Working directory
# --type <type>          Task type (build/serve/watch/test/custom)
# --project <name>       Project name (for filtering)
# --conflicts <ids>      Conflicting task IDs (comma-separated)
# --deps <ids>           Dependency task IDs (comma-separated)
# -p, --priority <pri>   Priority (low/medium/high/urgent)
# -t, --tags <tags>      Tags (comma-separated)
```

#### Start/Stop Tasks

```bash
# Start task (intelligently handles conflicts and dependencies)
cctm start <id>

# Stop task
cctm stop <id>

# Restart task
cctm restart <id>

# Stop all tasks
cctm stop-all

# Stop tasks for specific project
cctm stop-all --project MyApp

# Stop tasks of specific type
cctm stop-all --type serve
```

#### Query Tasks

```bash
# List all tasks
cctm list

# Show only running tasks
cctm list --status running

# Filter by specific project
cctm list --project MyApp

# Filter by specific type
cctm list --type build

# Combined filters
cctm list --project MyApp --type serve --status running

# Show detailed task information
cctm info <id>
```

#### Find Tasks

```bash
# Find task by PID
cctm find-pid 12345

# Find by command pattern
cctm find-cmd "npm"          # Find all npm tasks
cctm find-cmd "python.*server"  # Supports regex
```

#### Update & Delete

```bash
# Update task
cctm update <id> -s in_progress
cctm update <id> -d "New description"

# Delete task
cctm delete <id>

# Complete task
cctm complete <id>
```

#### Log Management

```bash
# View task logs (default 50 lines)
cctm log <id>

# View more lines
cctm log <id> --lines 200
```

#### Batch Operations

```bash
# Batch start
cctm batch start web-app,api-server,database

# Batch stop
cctm batch stop task1,task2,task3

# Batch restart
cctm batch restart service1,service2

# Batch remove
cctm batch remove old-task1,old-task2
```

#### Maintenance Commands

```bash
# Clean up stopped tasks
cctm cleanup

# Export tasks (JSON format)
cctm export ./tasks-backup.json

# Import tasks
cctm import ./tasks-backup.json

# Session management
cctm session-start     # Session initialization
cctm session-end       # Session end
cctm session           # Show current session ID
```

#### Intelligent Suggestions

```bash
# Get context-aware suggestions
cctm suggest "npm run build"
# 💡 Intelligent suggestions:
#   • Suggestion: Stop the following services before building: dev-server
```

---

## 🎬 Real-World Use Cases

### Use Case 1: .NET Development Workflow

```bash
# Start work in the morning
cctm add dev-server "ASP.NET Dev" "dotnet watch run" \
  --type serve --project MyWebApp

cctm add build "Build Release" "dotnet build -c Release" \
  --type build --conflicts dev-server

cctm add test "Run Tests" "dotnet test" \
  --type test --conflicts dev-server

cctm start dev-server

# When testing is needed
cctm start test  # Automatically stops dev-server

# After testing completes
cctm restart dev-server

# Prepare for release
cctm start build  # Automatically stops dev-server
```

### Use Case 2: Full-Stack Development (Frontend + Backend + Database)

```bash
# Register all services
cctm add frontend "React Dev Server" "npm run dev" \
  --cwd ./frontend --type serve --project MyApp

cctm add backend "Express API" "npm run dev" \
  --cwd ./backend --type serve --project MyApp

cctm add db "PostgreSQL" "docker-compose up postgres" \
  --type serve --project MyApp

# Start all services at once
cctm batch start frontend,backend,db

# Or define dependency relationships
cctm add backend "Express API" "npm run dev" \
  --cwd ./backend --type serve --deps db
cctm start backend  # Automatically starts db

# Stop all project-related tasks
cctm stop-all --project MyApp
```

### Use Case 3: Microservices Architecture

```bash
# Register all microservices
cctm add auth-service "Auth" "npm start" --cwd ./auth --type serve
cctm add user-service "User" "npm start" --cwd ./user --type serve
cctm add order-service "Order" "npm start" --cwd ./order --type serve
cctm add gateway "API Gateway" "npm start" --cwd ./gateway --type serve \
  --deps auth-service,user-service,order-service

# Start gateway (automatically starts all dependencies)
cctm start gateway

# Restart specific service
cctm restart user-service

# View logs for specific service
cctm log order-service --lines 100
```

---

## 🐛 Troubleshooting

### Issue 1: Task Won't Start

**Symptom**: `cctm start <id>` has no response or stops immediately

**Solution**:
```bash
# 1. Check if command is correct
cctm info <id>

# 2. Manually test command
cd <task-cwd>
<task-command>

# 3. View logs
cctm log <id> --lines 100
```

### Issue 2: Task Shows Running But Actually Stopped

**Symptom**: `cctm list` shows task is running, but process doesn't exist

**Solution**:
```bash
# Re-initialize
cctm session-start

# Or manually correct
cctm stop <id>  # Clear error state
```

### Issue 3: Cannot Stop Task

**Symptom**: `cctm stop <id>` fails

**Solution**:
```bash
# 1. Force delete task
cctm delete <id> --force

# 2. Manually kill process
kill -9 <pid>

# 3. Clean up zombie processes
cctm cleanup
```

---

## 📊 Performance Optimization

### Reduce Storage Operations

```bash
# Not recommended: Frequent single operations
cctm start task1
cctm start task2
cctm start task3

# Recommended: Use batch operations
cctm batch start task1,task2,task3
```

---

## 🔐 Security Considerations

### 1. Permission Management

```bash
# Ensure task storage file permissions are correct
chmod 600 ~/.claude-task-manager/tasks.json
chmod 700 ~/.claude-task-manager/logs
```

### 2. Sensitive Information Handling

```bash
# Don't include sensitive information in task commands
# ✗ Bad practice
cctm add api "API" "API_KEY=secret123 npm start"

# ✓ Good practice: Use environment variable files
cctm add api "API" "npm start" --cwd /path/to/project
# Then use .env file in the project
```

---

## 📝 Changelog

### v1.0.0 (2025-11-01)

**Initial Release**

- ✨ Cross-session task persistence
- ✨ Intelligent conflict and dependency management
- ✨ Cross-platform support (Windows/macOS/Linux/WSL)
- ✨ Batch operations
- ✨ Task log management
- ✨ PID/command search functionality
- 📚 Complete documentation and examples

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 📞 Contact & Support

### Issue Reporting

- **GitHub Issues**: [Create Issue](https://github.com/gowerlin/claude-code-task-manager/issues)

### FAQ

**Q: Which operating systems are supported?**
A: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+), WSL2

**Q: Can it manage Docker containers?**
A: Yes, simply add docker commands to tasks
```bash
cctm add postgres "PostgreSQL" "docker run -d --name postgres postgres:15"
```

**Q: Will task data sync to the cloud?**
A: Currently no, all data is stored locally. You can manually backup `~/.claude-task-manager/tasks.json`

---

<div align="center">

**⭐ If this project helps you, please give us a star! ⭐**

Made with ❤️ by Claude Code Community

[Report Bug](https://github.com/gowerlin/claude-code-task-manager/issues) · [Request Feature](https://github.com/gowerlin/claude-code-task-manager/issues)

</div>
