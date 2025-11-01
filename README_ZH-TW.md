# Claude Code Task Manager

> 🚀 跨 Session 的智能任務管理系統，讓 Claude Code 與 VSCode 能夠協同管理背景任務

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 目錄

- [設計理念](#設計理念)
- [核心功能](#核心功能)
- [系統架構](#系統架構)
- [安裝指南](#安裝指南)
- [快速開始](#快速開始)
- [完整使用說明](#完整使用說明)
- [實際應用場景](#實際應用場景)
- [故障排除](#故障排除)

---

## 🎯 設計理念

### 為什麼需要這個工具?

在使用 Claude Code CLI 或 VSCode 進行開發時，我們經常遇到以下問題：

1. **Session 斷開後背景任務失控**
   - Claude Code 啟動的背景任務在 session 結束後無法追蹤
   - 開發伺服器、監控腳本等持續運行，但無法管理
   - 需要手動 `ps` + `kill` 來清理進程

2. **任務衝突導致錯誤**
   - 重新建置時，開發伺服器佔用檔案造成鎖定
   - 多個任務同時寫入同一端口導致衝突
   - 缺乏自動化的衝突檢測與處理

3. **缺乏跨工具協作**
   - Claude Code 建立的任務與 VSCode Tasks 無法互通
   - Bash/PowerShell 腳本啟動的任務缺乏統一管理
   - 不同工具各自為政，難以協調

### 解決方案

**Claude Code Task Manager** 提供了一個統一的任務管理層：

```
┌─────────────────────────────────────────────────────┐
│          統一任務管理層 (Task Manager)              │
│  - 持久化儲存 (~/.claude-task-manager/tasks.json)  │
│  - 智能衝突檢測                                      │
│  - 跨 Session 狀態追蹤                              │
└─────────────────────────────────────────────────────┘
          ▲              ▲              ▲
          │              │              │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
    │  Claude   │  │  VSCode   │  │   Bash    │
    │   Code    │  │   Tasks   │  │  Scripts  │
    └───────────┘  └───────────┘  └───────────┘
```

### 核心設計原則

1. **持久化優先**: 所有任務狀態儲存在 JSON 檔案，跨 Session 可用
2. **智能化管理**: 自動處理衝突與依賴關係
3. **工具中立**: 支援任何工具或腳本建立的任務
4. **跨平台**: Windows、WSL、macOS、Linux 完整支援

---

## ✨ 核心功能

### 1. 跨 Session 持久化

```bash
# Session 1: 啟動開發伺服器
cctm add dev-server "開發伺服器" "npm run dev" --type serve
cctm start dev-server

# 關閉終端機，重新開啟...

# Session 2: 任務仍在管理中
cctm list
# ▶ [dev-server] 開發伺服器
#   狀態: running (PID: 12345)
```

### 2. 智能衝突處理

```bash
# 定義衝突關係
cctm add build "建置專案" "npm run build" \
  --type build \
  --conflicts dev-server

# 啟動時自動停止衝突任務
cctm start build
# ⚠ 檢測到衝突任務，準備停止...
#   → 停止衝突任務: dev-server
# ✓ 任務已停止: dev-server
# ▶ 啟動任務: build
```

### 3. 依賴管理

```bash
# 定義依賴關係
cctm add api-tests "API 測試" "npm test" \
  --deps api-server,database

# 啟動時自動啟動依賴
cctm start api-tests
# ⚠ 檢查依賴任務...
#   → 啟動依賴任務: api-server
#   → 啟動依賴任務: database
# ▶ 啟動任務: api-tests
```

### 4. 跨工具管理

```bash
# 用 PID 或命令查找
cctm find-cmd "npm"
# ✓ 找到 2 個匹配的任務

# 納入管理
cctm add from-external "外部服務" "npm run dev" --type serve
```

### 5. 批次操作

```bash
# 一次啟動多個服務
cctm batch start web-app,api-server,database

# 停止特定專案的所有任務
cctm stop-all --project MyApp

# 清理已停止的任務
cctm cleanup
```

---

## 🏗️ 系統架構

### 資料結構

```typescript
interface Task {
  id: string;                    // 任務唯一識別碼
  title: string;                 // 任務標題
  description?: string;          // 任務描述
  command?: string;              // 執行命令
  cwd?: string;                  // 工作目錄
  pid?: number;                  // 進程 ID
  status: TaskStatus;            // 狀態
  priority: TaskPriority;        // 優先級
  type: TaskType;                // 任務類型
  project?: string;              // 專案名稱
  conflicts?: string[];          // 衝突的任務 ID
  dependencies?: string[];       // 依賴的任務 ID
  logFile?: string;              // 日誌檔案路徑
  createdAt: Date;               // 建立時間
  updatedAt: Date;               // 更新時間
}
```

### 檔案結構

```
~/.claude-task-manager/
├── tasks.json              # 任務儲存 (持久化)
└── logs/                   # 任務日誌目錄
    ├── dev-server.log
    ├── build.log
    └── api-server.log
```

### 核心流程

```
啟動任務 (start)
    ↓
檢查衝突任務 → 是 → 停止衝突任務 → 等待 1 秒
    ↓                                    ↓
    否                                   ↓
    ↓ ←──────────────────────────────────┘
檢查依賴任務 → 是 → 啟動依賴任務
    ↓
    否
    ↓
spawn 進程 (detached)
    ↓
記錄 PID
    ↓
更新狀態為 running
    ↓
儲存到 tasks.json
```

---

## 📦 安裝指南

### 前置需求

- Node.js 18+ ([下載連結](https://nodejs.org/))
- TypeScript 5.0+ (會自動安裝)

### 安裝方式

#### 方式 1: 全域安裝 (推薦)

```bash
npm install -g claude-code-task-manager
```

#### 方式 2: 本地安裝

```bash
npm install claude-code-task-manager
```

### 驗證安裝

```bash
# 顯示幫助訊息
cctm --help

# 初始化 Session
cctm session-start
# 應輸出:
# 🚀 New session started
#    Session ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 🚀 快速開始

### 5 分鐘上手

```bash
# 1. 新增一個開發伺服器任務
cctm add dev-server "開發伺服器" "npm run dev" \
  --type serve \
  --project MyWebApp

# 2. 啟動任務
cctm start dev-server
# ▶ Started task: 開發伺服器
# ✓ PID: 12345
#   Log: ~/.claude-task-manager/logs/dev-server.log

# 3. 查看所有任務
cctm list
# [dev-server] 開發伺服器
#   Status: Running
#   Priority: Medium
#   ...

# 4. 查看日誌
cctm log dev-server --lines 20

# 5. 停止任務
cctm stop dev-server
# ■ Stopped task: 開發伺服器
```

### 基本工作流程

```bash
# 早上開始工作
cctm session-start
cctm start dev-server

# 中午需要重新建置
cctm add build "建置專案" "npm run build" \
  --type build \
  --conflicts dev-server
cctm start build  # 自動停止 dev-server

# 建置完成，重啟開發伺服器
cctm restart dev-server

# 下班前查看所有運行中的任務
cctm list --status running

# 停止所有任務
cctm stop-all

# 清理已停止的任務
cctm cleanup

# 結束 Session
cctm session-end
```

---

## 📚 完整使用說明

### 任務管理命令

#### 新增任務

```bash
# 基本語法
cctm add <id> <description> <command> [選項]

# 完整範例
cctm add api-server "後端 API 伺服器" "npm run dev" \
  --cwd /path/to/project \
  --type serve \
  --project MyApp \
  --conflicts build,test \
  --deps database

# 選項說明:
# --cwd <path>           工作目錄
# --type <type>          任務類型 (build/serve/watch/test/custom)
# --project <name>       專案名稱 (用於篩選)
# --conflicts <ids>      衝突任務 ID (逗號分隔)
# --deps <ids>           依賴任務 ID (逗號分隔)
# -p, --priority <pri>   優先級 (low/medium/high/urgent)
# -t, --tags <tags>      標籤 (逗號分隔)
```

#### 啟動/停止任務

```bash
# 啟動任務 (智能處理衝突與依賴)
cctm start <id>

# 停止任務
cctm stop <id>

# 重啟任務
cctm restart <id>

# 停止所有任務
cctm stop-all

# 停止特定專案的任務
cctm stop-all --project MyApp

# 停止特定類型的任務
cctm stop-all --type serve
```

#### 查詢任務

```bash
# 列出所有任務
cctm list

# 只顯示運行中的任務
cctm list --status running

# 篩選特定專案
cctm list --project MyApp

# 篩選特定類型
cctm list --type build

# 組合篩選
cctm list --project MyApp --type serve --status running

# 顯示任務詳細資訊
cctm info <id>
```

#### 查找任務

```bash
# 從 PID 查找任務
cctm find-pid 12345

# 從命令模式查找
cctm find-cmd "npm"          # 找出所有 npm 任務
cctm find-cmd "python.*server"  # 支援正則表達式
```

#### 更新與刪除

```bash
# 更新任務
cctm update <id> -s in_progress
cctm update <id> -d "新的描述"

# 刪除任務
cctm delete <id>

# 完成任務
cctm complete <id>
```

#### 日誌管理

```bash
# 查看任務日誌 (預設 50 行)
cctm log <id>

# 查看更多行數
cctm log <id> --lines 200
```

#### 批次操作

```bash
# 批次啟動
cctm batch start web-app,api-server,database

# 批次停止
cctm batch stop task1,task2,task3

# 批次重啟
cctm batch restart service1,service2

# 批次刪除
cctm batch remove old-task1,old-task2
```

#### 維護命令

```bash
# 清理已停止的任務
cctm cleanup

# 匯出任務 (JSON 格式)
cctm export ./tasks-backup.json

# 匯入任務
cctm import ./tasks-backup.json

# Session 管理
cctm session-start     # Session 初始化
cctm session-end       # Session 結束
cctm session           # 顯示當前 Session ID
```

#### 智能建議

```bash
# 取得上下文相關的建議
cctm suggest "npm run build"
# 💡 智能建議:
#   • 建議: 在建置前停止以下服務: dev-server
```

---

## 🎬 實際應用場景

### 場景 1: .NET 開發工作流程

```bash
# 早上開始工作
cctm add dev-server "ASP.NET Dev" "dotnet watch run" \
  --type serve --project MyWebApp

cctm add build "Build Release" "dotnet build -c Release" \
  --type build --conflicts dev-server

cctm add test "Run Tests" "dotnet test" \
  --type test --conflicts dev-server

cctm start dev-server

# 需要測試時
cctm start test  # 自動停止 dev-server

# 測試完成
cctm restart dev-server

# 準備發布
cctm start build  # 自動停止 dev-server
```

### 場景 2: 全端開發 (前端 + 後端 + 資料庫)

```bash
# 註冊所有服務
cctm add frontend "React Dev Server" "npm run dev" \
  --cwd ./frontend --type serve --project MyApp

cctm add backend "Express API" "npm run dev" \
  --cwd ./backend --type serve --project MyApp

cctm add db "PostgreSQL" "docker-compose up postgres" \
  --type serve --project MyApp

# 一次啟動所有服務
cctm batch start frontend,backend,db

# 或定義依賴關係
cctm add backend "Express API" "npm run dev" \
  --cwd ./backend --type serve --deps db
cctm start backend  # 自動啟動 db

# 停止所有專案相關的任務
cctm stop-all --project MyApp
```

### 場景 3: 微服務架構

```bash
# 註冊所有微服務
cctm add auth-service "Auth" "npm start" --cwd ./auth --type serve
cctm add user-service "User" "npm start" --cwd ./user --type serve
cctm add order-service "Order" "npm start" --cwd ./order --type serve
cctm add gateway "API Gateway" "npm start" --cwd ./gateway --type serve \
  --deps auth-service,user-service,order-service

# 啟動閘道器 (自動啟動所有依賴)
cctm start gateway

# 重啟特定服務
cctm restart user-service

# 查看特定服務的日誌
cctm log order-service --lines 100
```

---

## 🐛 故障排除

### 問題 1: 任務無法啟動

**症狀**: `cctm start <id>` 沒有反應或立即停止

**解決方案**:
```bash
# 1. 檢查命令是否正確
cctm info <id>

# 2. 手動執行命令測試
cd <task-cwd>
<task-command>

# 3. 查看日誌
cctm log <id> --lines 100
```

### 問題 2: 任務顯示 running 但實際已停止

**症狀**: `cctm list` 顯示任務在運行，但進程不存在

**解決方案**:
```bash
# 重新初始化
cctm session-start

# 或手動修正
cctm stop <id>  # 清除錯誤狀態
```

### 問題 3: 無法停止任務

**症狀**: `cctm stop <id>` 失敗

**解決方案**:
```bash
# 1. 強制刪除任務
cctm delete <id> --force

# 2. 手動 kill 進程
kill -9 <pid>

# 3. 清理殭屍進程
cctm cleanup
```

---

## 📊 效能最佳化

### 減少儲存操作

```bash
# 不建議: 頻繁的單個操作
cctm start task1
cctm start task2
cctm start task3

# 建議: 使用批次操作
cctm batch start task1,task2,task3
```

---

## 🔐 安全性考量

### 1. 權限管理

```bash
# 確保任務儲存檔案權限正確
chmod 600 ~/.claude-task-manager/tasks.json
chmod 700 ~/.claude-task-manager/logs
```

### 2. 敏感資訊處理

```bash
# 不要在任務命令中包含敏感資訊
# ✗ 不好的做法
cctm add api "API" "API_KEY=secret123 npm start"

# ✓ 好的做法: 使用環境變數檔案
cctm add api "API" "npm start" --cwd /path/to/project
# 然後在專案中使用 .env 檔案
```

---

## 📝 更新日誌

### v1.0.0 (2025-11-01)

**首次發布**

- ✨ 跨 Session 任務持久化
- ✨ 智能衝突與依賴管理
- ✨ 跨平台支援 (Windows/macOS/Linux/WSL)
- ✨ 批次操作
- ✨ 任務日誌管理
- ✨ PID/命令查找功能
- 📚 完整文件與範例

---

## 📄 授權條款

MIT License - 詳見 [LICENSE](LICENSE)

---

## 📞 聯絡與支援

### 問題回報

- **GitHub Issues**: [建立 Issue](https://github.com/gowerlin/claude-code-task-manager/issues)

### 常見問題 (FAQ)

**Q: 支援哪些作業系統？**
A: Windows 10+、macOS 10.15+、Linux (Ubuntu 20.04+)、WSL2

**Q: 可以管理 Docker 容器嗎？**
A: 可以，將 docker 命令加入任務即可
```bash
cctm add postgres "PostgreSQL" "docker run -d --name postgres postgres:15"
```

**Q: 任務資料會同步到雲端嗎？**
A: 目前不會，所有資料儲存在本地。可以手動備份 `~/.claude-task-manager/tasks.json`

---

<div align="center">

**⭐ 如果這個專案對你有幫助，請給我們一顆星！⭐**

Made with ❤️ by Claude Code Community

[Report Bug](https://github.com/gowerlin/claude-code-task-manager/issues) · [Request Feature](https://github.com/gowerlin/claude-code-task-manager/issues)

</div>
