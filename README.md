# Claude Code Task Manager

[English](#english) | [繁體中文](#繁體中文)

---
![CI](https://github.com/gowerlin/claude-code-task-manager/actions/workflows/release.yml/badge.svg)
![GitHub release](https://img.shields.io/github/v/release/gowerlin/claude-code-task-manager)
![License](https://img.shields.io/github/license/gowerlin/claude-code-task-manager)

---

## English

A cross-session intelligent task management system designed for Claude Code and VSCode, enabling collaborative background task management.

### Features

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

### Installation

#### As NPM Package

```bash
npm install -g claude-code-task-manager
```

Or install locally in your project:

```bash
npm install claude-code-task-manager
```

#### As Claude Code Plugin

This package can be used as a Claude Code CLI plugin. Add to your Claude Code plugin configuration:

```json
{
  "name": "claude-code-task-manager",
  "version": "1.0.0",
  "source": "https://github.com/gowerlin/claude-code-task-manager"
}
```

Or install via the Claude Code plugin marketplace (when available).

The plugin provides enhanced command documentation and integration with Claude Code's native features.

### CLI Usage

#### Basic Commands

**Create a task:**
```bash
cctm create "Implement authentication" -d "Add JWT-based authentication" -p high -t "backend,security"
```

**List all tasks:**
```bash
cctm list
```

**List tasks by status:**
```bash
cctm list --status pending
```

**Show task details:**
```bash
cctm show <task-id>
```

**Update a task:**
```bash
cctm update <task-id> -s in_progress
```

**Complete a task:**
```bash
cctm complete <task-id>
```

**Delete a task:**
```bash
cctm delete <task-id>
```

**Show current session:**
```bash
cctm session
```

**Export tasks:**
```bash
cctm export ./tasks-backup.json
```

**Import tasks:**
```bash
cctm import ./tasks-backup.json
```

#### JSON Output

All commands support structured JSON output using the `--json` flag, perfect for scripting and integration:

```bash
# Create task with JSON output
cctm create "Build API" -d "REST API implementation" -p high --json

# List tasks in JSON format
cctm list --status pending --json

# Show task details as JSON
cctm show <task-id> --json

# Update task and get JSON response
cctm update <task-id> -s in_progress --json
```

**Example JSON output:**
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Build API",
    "description": "REST API implementation",
    "status": "pending",
    "priority": "high",
    "tags": [],
    "createdAt": "2025-11-01T04:00:00.000Z",
    "updatedAt": "2025-11-01T04:00:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

#### Background Process Management (inspired by `/bashes`)

Based on [Claude Code issue #7069](https://github.com/anthropics/claude-code/issues/7069), this task manager includes integrated background process management similar to the `/bashes` command concept.

**Create and start a background process task:**
```bash
cctm bg-create "Dev Server" "npm run dev" -d "Start development server" -p high
```

**List all background processes:**
```bash
cctm bashes
# or
cctm background
```

**List only running processes:**
```bash
cctm bashes --running
```

**Kill a background process:**
```bash
cctm bg-kill <task-id>
```

**View process output/logs:**
```bash
cctm bg-logs <process-id>
```

This feature addresses the need for native background task management in Claude Code, providing:
- Task discovery and listing
- Real-time status monitoring
- Unified process control
- Session persistence
- Output/log viewing

#### Language Support

Use the `--lang` option to specify the language:

```bash
# English (default)
cctm list --lang=en

# Traditional Chinese
cctm list --lang=zh-TW
```

### Programmatic Usage

You can also use the task manager programmatically in your Node.js/TypeScript projects:

```typescript
import { TaskManager, TaskPriority, initI18n } from 'claude-code-task-manager';

async function example() {
  // Initialize i18n
  await initI18n('en');

  // Create task manager
  const taskManager = new TaskManager();
  await taskManager.init();

  // Create a task
  const task = await taskManager.createTask(
    'Build new feature',
    'Implement the new dashboard feature',
    TaskPriority.HIGH,
    ['frontend', 'ui']
  );

  console.log('Task created:', task.id);

  // List all tasks
  const tasks = taskManager.listTasks();
  console.log('Total tasks:', tasks.length);

  // Complete a task
  await taskManager.completeTask(task.id);

  // Filter tasks by status
  const pendingTasks = taskManager.listTasks({ status: 'pending' });
  console.log('Pending tasks:', pendingTasks.length);
}

example();
```

### Task Properties

Each task has the following properties:

- `id`: Unique identifier (UUID)
- `title`: Task title
- `description`: Optional detailed description
- `status`: Task status (`pending`, `in_progress`, `completed`, `cancelled`)
- `priority`: Priority level (`low`, `medium`, `high`, `urgent`)
- `tags`: Array of tags for categorization
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `completedAt`: Completion timestamp (if completed)
- `sessionId`: Session ID where the task was created

### Data Storage

Tasks are stored in JSON format at:
- Linux/macOS: `~/.claude-task-manager/tasks.json`
- Windows: `%USERPROFILE%\.claude-task-manager\tasks.json`

### Development

```bash
# Clone the repository
git clone https://github.com/gowerlin/claude-code-task-manager.git
cd claude-code-task-manager

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev -- list
```

### License

MIT License - see [LICENSE](LICENSE) for details

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 繁體中文

跨 Session 的智能任務管理系統，讓 Claude Code 與 VSCode 能夠協同管理背景任務。

### 功能特色

- 🌐 **多語言支援**：內建英文和繁體中文支援
- 💾 **持久化儲存**：任務自動儲存，跨 Session 保存
- 🔄 **跨 Session 管理**：追蹤不同 Claude Code 工作階段的任務
- 🎯 **優先級與狀態管理**：使用優先級和狀態追蹤組織任務
- 🏷️ **標籤系統**：使用自訂標籤分類任務
- 📤 **匯入/匯出**：輕鬆備份和還原任務
- 🖥️ **命令列介面**：強大的命令列介面進行任務管理
- 🔧 **背景程序管理**：整合類似 `/bashes` 的功能來管理背景程序（參見 [issue #7069](https://github.com/anthropics/claude-code/issues/7069)）
- 🔌 **Claude Code 插件**：可作為 Claude Code CLI 插件無縫整合
- 📊 **JSON 輸出**：所有命令均支援結構化 JSON 輸出

### 安裝

#### 作為 NPM 套件

```bash
npm install -g claude-code-task-manager
```

或在專案中本地安裝：

```bash
npm install claude-code-task-manager
```

#### 作為 Claude Code 插件

此套件可作為 Claude Code CLI 插件使用。新增至您的 Claude Code 插件配置：

```json
{
  "name": "claude-code-task-manager",
  "version": "1.0.0",
  "source": "https://github.com/gowerlin/claude-code-task-manager"
}
```

或透過 Claude Code 插件市集安裝（當可用時）。

該插件提供增強的命令文件和與 Claude Code 原生功能的整合。

### 命令列使用

#### 基本指令

**建立任務：**
```bash
cctm create "實作身份驗證" -d "新增基於 JWT 的身份驗證" -p high -t "後端,安全性"
```

**列出所有任務：**
```bash
cctm list
```

**依狀態列出任務：**
```bash
cctm list --status pending
```

**顯示任務詳情：**
```bash
cctm show <task-id>
```

**更新任務：**
```bash
cctm update <task-id> -s in_progress
```

**完成任務：**
```bash
cctm complete <task-id>
```

**刪除任務：**
```bash
cctm delete <task-id>
```

**顯示目前工作階段：**
```bash
cctm session
```

**匯出任務：**
```bash
cctm export ./tasks-backup.json
```

**匯入任務：**
```bash
cctm import ./tasks-backup.json
```

#### JSON 輸出

所有命令都支援使用 `--json` 標誌的結構化 JSON 輸出，非常適合腳本編寫和整合：

```bash
# 建立任務並輸出 JSON
cctm create "開發 API" -d "REST API 實作" -p high --json

# 以 JSON 格式列出任務
cctm list --status pending --json

# 以 JSON 顯示任務詳情
cctm show <task-id> --json

# 更新任務並取得 JSON 回應
cctm update <task-id> -s in_progress --json
```

**JSON 輸出範例：**
```json
{
  "success": true,
  "task": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "開發 API",
    "description": "REST API 實作",
    "status": "pending",
    "priority": "high",
    "tags": [],
    "createdAt": "2025-11-01T04:00:00.000Z",
    "updatedAt": "2025-11-01T04:00:00.000Z",
    "sessionId": "session-abc123"
  }
}
```

#### 背景程序管理（靈感來自 `/bashes`）

基於 [Claude Code issue #7069](https://github.com/anthropics/claude-code/issues/7069)，此任務管理器包含類似 `/bashes` 命令概念的整合背景程序管理功能。

**建立並啟動背景程序任務：**
```bash
cctm bg-create "開發伺服器" "npm run dev" -d "啟動開發伺服器" -p high
```

**列出所有背景程序：**
```bash
cctm bashes
# 或
cctm background
```

**僅列出執行中的程序：**
```bash
cctm bashes --running
```

**終止背景程序：**
```bash
cctm bg-kill <task-id>
```

**查看程序輸出/日誌：**
```bash
cctm bg-logs <process-id>
```

此功能滿足了 Claude Code 中原生背景任務管理的需求，提供：
- 任務探索和列表
- 即時狀態監控
- 統一的程序控制
- 工作階段持久化
- 輸出/日誌查看

#### 語言支援

使用 `--lang` 選項指定語言：

```bash
# 英文（預設）
cctm list --lang=en

# 繁體中文
cctm list --lang=zh-TW
```

### 程式化使用

您也可以在 Node.js/TypeScript 專案中以程式方式使用任務管理器：

```typescript
import { TaskManager, TaskPriority, initI18n } from 'claude-code-task-manager';

async function example() {
  // 初始化 i18n
  await initI18n('zh-TW');

  // 建立任務管理器
  const taskManager = new TaskManager();
  await taskManager.init();

  // 建立任務
  const task = await taskManager.createTask(
    '開發新功能',
    '實作新的儀表板功能',
    TaskPriority.HIGH,
    ['前端', 'UI']
  );

  console.log('任務已建立:', task.id);

  // 列出所有任務
  const tasks = taskManager.listTasks();
  console.log('任務總數:', tasks.length);

  // 完成任務
  await taskManager.completeTask(task.id);

  // 依狀態篩選任務
  const pendingTasks = taskManager.listTasks({ status: 'pending' });
  console.log('待處理任務:', pendingTasks.length);
}

example();
```

### 任務屬性

每個任務具有以下屬性：

- `id`：唯一識別碼（UUID）
- `title`：任務標題
- `description`：可選的詳細描述
- `status`：任務狀態（`pending`、`in_progress`、`completed`、`cancelled`）
- `priority`：優先級（`low`、`medium`、`high`、`urgent`）
- `tags`：用於分類的標籤陣列
- `createdAt`：建立時間戳記
- `updatedAt`：最後更新時間戳記
- `completedAt`：完成時間戳記（如果已完成）
- `sessionId`：任務建立時的工作階段 ID

### 資料儲存

任務以 JSON 格式儲存在：
- Linux/macOS：`~/.claude-task-manager/tasks.json`
- Windows：`%USERPROFILE%\.claude-task-manager\tasks.json`

### 開發

```bash
# 複製儲存庫
git clone https://github.com/gowerlin/claude-code-task-manager.git
cd claude-code-task-manager

# 安裝相依套件
npm install

# 建置專案
npm run build

# 以開發模式執行
npm run dev -- list
```

### 授權

MIT 授權 - 詳見 [LICENSE](LICENSE)

### 貢獻

歡迎貢獻！請隨時提交 Pull Request。

---

**Author**: Gower  
**Repository**: [github.com/gowerlin/claude-code-task-manager](https://github.com/gowerlin/claude-code-task-manager)
