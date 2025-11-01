---
name: bg-logs
description: View output and logs from a background process
tags: [background, process, logs, output, debug]
args:
  - name: id
    type: string
    required: true
    description: Process ID or task ID to view logs for
author: Gower
---

# 📋 View Background Process Logs

Displays the captured output and logs from a background process.

## Usage

```bash
cctm bg-logs <id> [options]
```

### Arguments

- `id` - Process ID or task ID (full UUID or first 8 characters)

### Options

- `--lang <language>` - Language for output messages (en, zh-TW)

## Examples

### View logs by task ID
```bash
cctm bg-logs a1b2c3d4
```

### View logs by full UUID
```bash
cctm bg-logs a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Output

### Process Running
```
Process Output:

> my-app@1.0.0 dev
> next dev

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
info  - Loaded env from .env.local
event - compiled client and server successfully in 2.5s
wait  - compiling / (client and server)...
event - compiled client and server successfully in 156 ms
```

### Process Completed
```
Process Output:

> my-app@1.0.0 build
> next build

info  - Linting and checking validity of types...
info  - Creating an optimized production build...
info  - Compiled successfully
info  - Collecting page data...
info  - Generating static pages (5/5)
info  - Finalizing page optimization...

Build completed successfully!
Exit Code: 0
```

### Process Failed
```
Process Output:

> my-app@1.0.0 test
> jest

FAIL src/components/Button.test.tsx
  ● Button › should render correctly

    expect(received).toBe(expected)

    Expected: "Click me"
    Received: "Click here"

Test Suites: 1 failed, 0 passed, 1 total
Tests:       1 failed, 0 passed, 1 total

Exit Code: 1
```

### No Output Available
```
⚠ No output available or process not found
```

## Output Capture

The system captures:
- **stdout**: Standard output
- **stderr**: Error output
- **Exit codes**: Process exit status
- **Timestamps**: When output was generated
- **Buffered**: Most recent output (configurable limit)

## Use Cases

### Debugging
- Check why a build failed
- Review test output
- Diagnose server errors
- Inspect compilation warnings

### Monitoring
- Track server startup messages
- Watch for errors during development
- Review deployment logs
- Monitor background jobs

### Verification
- Confirm successful builds
- Verify tests passed
- Check process completion
- Review exit codes

## Tips

1. **Check Status First**: Use `cctm bashes` to see process status
2. **Recent Output**: Logs show most recent output (may be truncated for long-running processes)
3. **Real-time Monitoring**: For live monitoring, consider `tail -f` on actual log files
4. **Exit Codes**: 0 = success, non-zero = error

## Examples by Scenario

### Check Build Status
```bash
cctm bashes
# Find build process ID: a1b2c3d4
cctm bg-logs a1b2c3d4
```

### Debug Failed Tests
```bash
cctm bashes --running
# Find test process: b2c3d4e5
cctm bg-logs b2c3d4e5
```

### Monitor Development Server
```bash
cctm bg-create "Dev Server" "npm run dev"
# Note the task ID from output: c3d4e5f6
cctm bg-logs c3d4e5f6
```

## Related Commands

- `cctm bashes` - List all background processes
- `cctm bg-create <title> <command>` - Start a new background process
- `cctm bg-kill <id>` - Terminate a background process
