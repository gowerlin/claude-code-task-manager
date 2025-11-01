#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { TaskManager } from '../core/TaskManager';
import { TaskStatus, TaskPriority, TaskType } from '../types';
import { initI18n, t, changeLanguage } from '../i18n';

const program = new Command();

// Helper function to output JSON
function outputJSON(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

// Helper function to check if JSON output is requested from options or parent command
function shouldOutputJSON(options: any, command?: any): boolean {
  return options.json || command?.parent?.opts().json || false;
}

async function main() {
  // Initialize with English by default, can be changed with --lang option
  const langArg = process.argv.find(arg => arg.startsWith('--lang='));
  const language = langArg ? langArg.split('=')[1] : 'en';
  await initI18n(language);

  const taskManager = new TaskManager();
  await taskManager.init();

  program
    .name('cctm')
    .description(t('messages.welcome'))
    .version('1.0.0')
    .option('-l, --lang <language>', 'Language (en, zh-TW)', 'en')
    .option('--json', 'Output in JSON format');

  program
    .command('create')
    .description(t('actions.create'))
    .argument('<title>', t('fields.title'))
    .option('-d, --description <description>', t('fields.description'))
    .option('-p, --priority <priority>', t('fields.priority'), 'medium')
    .option('-t, --tags <tags>', t('fields.tags'), (val) => val.split(','))
    .option('--json', 'Output in JSON format')
    .action(async (title, options, command) => {
      try {
        const priority = options.priority as TaskPriority;
        const task = await taskManager.createTask(
          title,
          options.description,
          priority,
          options.tags
        );
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.green(t('tasks.created')));
          console.log(chalk.blue(`${t('fields.id')}: ${task.id}`));
          console.log(`${t('fields.title')}: ${task.title}`);
          if (task.description) {
            console.log(`${t('fields.description')}: ${task.description}`);
          }
          console.log(`${t('fields.priority')}: ${t(`priority.${task.priority}`)}`);
          console.log(`${t('fields.status')}: ${t(`status.${task.status}`)}`);
        }
      } catch (error) {
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('list')
    .description(t('actions.list'))
    .option('-s, --status <status>', t('fields.status'))
    .option('-p, --priority <priority>', t('fields.priority'))
    .option('--project <name>', 'Filter by project')
    .option('--type <type>', 'Filter by type')
    .option('--session', 'Show only current session tasks')
    .option('--json', 'Output in JSON format')
    .action(async (options, command) => {
      try {
        const filter: any = {};
        if (options.status) filter.status = options.status;
        if (options.priority) filter.priority = options.priority;
        if (options.project) filter.project = options.project;
        if (options.type) filter.type = options.type;
        if (options.session) filter.sessionId = taskManager.getSessionId();

        const tasks = taskManager.listTasks(filter);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              sessionId: task.sessionId
            })),
            count: tasks.length
          });
        } else {
          if (tasks.length === 0) {
            console.log(chalk.yellow(t('tasks.listEmpty')));
            return;
          }

          console.log(chalk.bold(t('tasks.listTitle')));
          console.log(chalk.blue(t('messages.taskCount', { count: tasks.length })));
          console.log();

          tasks.forEach(task => {
            const statusColor = task.status === TaskStatus.COMPLETED ? chalk.green :
                               task.status === TaskStatus.IN_PROGRESS ? chalk.blue :
                               task.status === TaskStatus.CANCELLED ? chalk.red :
                               chalk.yellow;

            console.log(chalk.bold(`[${task.id.substring(0, 8)}]`) + ` ${task.title}`);
            console.log(`  ${t('fields.status')}: ${statusColor(t(`status.${task.status}`))}`);
            console.log(`  ${t('fields.priority')}: ${t(`priority.${task.priority}`)}`);
            if (task.description) {
              console.log(`  ${t('fields.description')}: ${task.description}`);
            }
            if (task.tags && task.tags.length > 0) {
              console.log(`  ${t('fields.tags')}: ${task.tags.join(', ')}`);
            }
            console.log(`  ${t('fields.createdAt')}: ${task.createdAt.toLocaleString()}`);
            console.log();
          });
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('show')
    .description(t('actions.show'))
    .argument('<id>', t('fields.id'))
    .option('--json', 'Output in JSON format')
    .action(async (id, options, command) => {
      try {
        const task = taskManager.getTask(id);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (!task) {
          if (shouldOutputJSON(options, command)) {
            outputJSON({
              success: false,
              error: 'Task not found'
            });
          } else {
            console.error(chalk.red(t('tasks.notFound')));
          }
          return;
        }

        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.bold(task.title));
          console.log(`${t('fields.id')}: ${task.id}`);
          console.log(`${t('fields.status')}: ${t(`status.${task.status}`)}`);
          console.log(`${t('fields.priority')}: ${t(`priority.${task.priority}`)}`);
          if (task.description) {
            console.log(`${t('fields.description')}: ${task.description}`);
          }
          if (task.tags && task.tags.length > 0) {
            console.log(`${t('fields.tags')}: ${task.tags.join(', ')}`);
          }
          console.log(`${t('fields.createdAt')}: ${task.createdAt.toLocaleString()}`);
          console.log(`${t('fields.updatedAt')}: ${task.updatedAt.toLocaleString()}`);
          if (task.completedAt) {
            console.log(`${t('fields.completedAt')}: ${task.completedAt.toLocaleString()}`);
          }
          if (task.sessionId) {
            console.log(`${t('fields.sessionId')}: ${task.sessionId}`);
          }
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('update')
    .description(t('actions.update'))
    .argument('<id>', t('fields.id'))
    .option('-t, --title <title>', t('fields.title'))
    .option('-d, --description <description>', t('fields.description'))
    .option('-s, --status <status>', t('fields.status'))
    .option('-p, --priority <priority>', t('fields.priority'))
    .option('--json', 'Output in JSON format')
    .action(async (id, options, command) => {
      try {
        const updates: any = {};
        if (options.title) updates.title = options.title;
        if (options.description) updates.description = options.description;
        if (options.status) updates.status = options.status;
        if (options.priority) updates.priority = options.priority;

        const task = await taskManager.updateTask(id, updates);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.green(t('tasks.updated')));
          console.log(`${t('fields.title')}: ${task.title}`);
          console.log(`${t('fields.status')}: ${t(`status.${task.status}`)}`);
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('complete')
    .description(t('actions.complete'))
    .argument('<id>', t('fields.id'))
    .option('--json', 'Output in JSON format')
    .action(async (id, options, command) => {
      try {
        const task = await taskManager.completeTask(id);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.green(t('tasks.completed')));
          console.log(`${t('fields.title')}: ${task.title}`);
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('delete')
    .description(t('actions.delete'))
    .argument('<id>', t('fields.id'))
    .option('--json', 'Output in JSON format')
    .action(async (id, options, command) => {
      try {
        await taskManager.deleteTask(id);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            message: 'Task deleted successfully'
          });
        } else {
          console.log(chalk.green(t('tasks.deleted')));
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('session')
    .description('Show current session ID')
    .action(() => {
      console.log(t('messages.sessionInfo', { sessionId: taskManager.getSessionId() }));
    });

  program
    .command('export')
    .description('Export tasks to a file')
    .argument('<file>', 'Export file path')
    .action(async (file) => {
      try {
        await taskManager.exportTasks(file);
        console.log(chalk.green(`Tasks exported to ${file}`));
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program
    .command('import')
    .description('Import tasks from a file')
    .argument('<file>', 'Import file path')
    .action(async (file) => {
      try {
        const imported = await taskManager.importTasks(file);
        console.log(chalk.green(`Imported ${imported} tasks from ${file}`));
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  // Enhanced task management commands
  program
    .command('add')
    .description('Add a new task with advanced options')
    .argument('<id>', 'Task ID')
    .argument('<description>', 'Task description')
    .argument('<command>', 'Command to execute')
    .option('--cwd <path>', 'Working directory')
    .option('--type <type>', 'Task type (build/serve/watch/test/custom)', 'custom')
    .option('--project <name>', 'Project name')
    .option('--conflicts <ids>', 'Conflicting task IDs (comma-separated)')
    .option('--deps <ids>', 'Dependency task IDs (comma-separated)')
    .option('-p, --priority <priority>', 'Priority level', 'medium')
    .option('-t, --tags <tags>', 'Tags (comma-separated)')
    .option('--json', 'Output in JSON format')
    .action(async (id, description, command, options, commandObj) => {
      try {
        const priority = options.priority as TaskPriority;
        const type = options.type as TaskType;
        const tags = options.tags ? options.tags.split(',') : undefined;
        const conflicts = options.conflicts ? options.conflicts.split(',') : undefined;
        const dependencies = options.deps ? options.deps.split(',') : undefined;

        const task = await taskManager.createTask(
          description,
          description,
          priority,
          tags,
          type,
          {
            command,
            cwd: options.cwd,
            project: options.project,
            conflicts,
            dependencies
          }
        );

        // Override the generated ID with the user-provided one
        taskManager['tasks'].delete(task.id);
        task.id = id;
        taskManager['tasks'].set(id, task);
        await taskManager['saveTasks']();

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              command: task.command,
              status: task.status,
              priority: task.priority,
              type: task.type,
              project: task.project,
              conflicts: task.conflicts,
              dependencies: task.dependencies
            }
          });
        } else {
          console.log(chalk.green('✓ Task added'));
          console.log(chalk.blue(`  ID: ${task.id}`));
          console.log(`  Description: ${task.description}`);
          console.log(`  Command: ${task.command}`);
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('start')
    .description('Start a task')
    .argument('<id>', 'Task ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options, commandObj) => {
      try {
        const task = await taskManager.startTask(id);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              processId: task.processId
            }
          });
        } else {
          console.log(chalk.green(`▶ Started task: ${task.title}`));
          if (task.processId) {
            console.log(chalk.blue(`  PID: ${task.processId}`));
          }
          if (task.logFile) {
            console.log(chalk.gray(`  Log: ${task.logFile}`));
          }
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('stop')
    .description('Stop a task')
    .argument('<id>', 'Task ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options, commandObj) => {
      try {
        const task = await taskManager.stopTask(id);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              status: task.status
            }
          });
        } else {
          console.log(chalk.green(`■ Stopped task: ${task.title}`));
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('restart')
    .description('Restart a task')
    .argument('<id>', 'Task ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options, commandObj) => {
      try {
        const task = await taskManager.restartTask(id);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              processId: task.processId
            }
          });
        } else {
          console.log(chalk.green(`⟳ Restarted task: ${task.title}`));
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('stop-all')
    .description('Stop all running tasks')
    .option('--project <name>', 'Filter by project')
    .option('--type <type>', 'Filter by type')
    .option('--json', 'Output in JSON format')
    .action(async (options, commandObj) => {
      try {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options.type) filter.type = options.type;

        const stopped = await taskManager.stopAllTasks(filter);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            stopped
          });
        } else {
          console.log(chalk.green(`■ Stopped ${stopped} task(s)`));
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('cleanup')
    .description('Remove completed and failed tasks')
    .option('--json', 'Output in JSON format')
    .action(async (options, commandObj) => {
      try {
        const cleaned = await taskManager.cleanupTasks();

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            cleaned
          });
        } else {
          console.log(chalk.green(`✓ Cleaned up ${cleaned} task(s)`));
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('find-pid')
    .description('Find task by process ID')
    .argument('<pid>', 'Process ID')
    .option('--json', 'Output in JSON format')
    .action(async (pidStr, options, commandObj) => {
      try {
        const pid = parseInt(pidStr, 10);
        const task = taskManager.findTaskByPid(pid);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: !!task,
            task: task ? {
              id: task.id,
              title: task.title,
              command: task.command,
              status: task.status,
              processId: task.processId
            } : null
          });
        } else {
          if (task) {
            console.log(chalk.green(`✓ Found task: ${task.title}`));
            console.log(`  ID: ${task.id}`);
            console.log(`  Command: ${task.command}`);
            console.log(`  Status: ${task.status}`);
          } else {
            console.log(chalk.yellow('No task found with that PID'));
          }
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('find-cmd')
    .description('Find tasks by command pattern')
    .argument('<pattern>', 'Command pattern (regex supported)')
    .option('--json', 'Output in JSON format')
    .action(async (pattern, options, commandObj) => {
      try {
        const tasks = taskManager.findTasksByCommand(pattern);

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              command: task.command,
              status: task.status,
              processId: task.processId
            })),
            count: tasks.length
          });
        } else {
          if (tasks.length === 0) {
            console.log(chalk.yellow('No tasks found matching that pattern'));
          } else {
            console.log(chalk.green(`✓ Found ${tasks.length} task(s):`));
            tasks.forEach(task => {
              console.log(`  [${task.id.substring(0, 8)}] ${task.title}`);
              console.log(`    Command: ${task.command}`);
              console.log(`    Status: ${task.status}`);
            });
          }
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('batch')
    .description('Batch operations on multiple tasks')
    .argument('<action>', 'Action: start, stop, restart, remove')
    .argument('<ids>', 'Task IDs (comma-separated)')
    .option('--json', 'Output in JSON format')
    .action(async (action, idsStr, options, commandObj) => {
      try {
        const ids = idsStr.split(',').map((id: string) => id.trim());
        let result;

        switch (action) {
          case 'start':
            result = await taskManager.batchStart(ids);
            break;
          case 'stop':
            result = await taskManager.batchStop(ids);
            break;
          case 'restart':
            result = await taskManager.batchRestart(ids);
            break;
          case 'remove':
            result = await taskManager.batchRemove(ids);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            action,
            result
          });
        } else {
          console.log(chalk.green(`✓ Batch ${action} completed`));
          console.log(`  Succeeded: ${result.succeeded.length}`);
          console.log(`  Failed: ${result.failed.length}`);
          if (result.failed.length > 0) {
            console.log(chalk.yellow(`  Failed IDs: ${result.failed.join(', ')}`));
          }
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('log')
    .description('View task logs')
    .argument('<id>', 'Task ID')
    .option('--lines <number>', 'Number of lines to show', '50')
    .action(async (id, options) => {
      try {
        const lines = parseInt(options.lines, 10);
        const logs = await taskManager.getTaskLogs(id, lines);
        console.log(logs);
      } catch (error) {
        console.error(chalk.red('✗ Error:'), error);
      }
    });

  program
    .command('info')
    .description('Show detailed task information')
    .argument('<id>', 'Task ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options, commandObj) => {
      try {
        const task = taskManager.getTask(id);

        if (!task) {
          if (shouldOutputJSON(options, commandObj)) {
            outputJSON({
              success: false,
              error: 'Task not found'
            });
          } else {
            console.error(chalk.red('✗ Task not found'));
          }
          return;
        }

        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              command: task.command,
              status: task.status,
              priority: task.priority,
              type: task.type,
              project: task.project,
              cwd: task.cwd,
              processId: task.processId,
              conflicts: task.conflicts,
              dependencies: task.dependencies,
              tags: task.tags,
              logFile: task.logFile,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              completedAt: task.completedAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.bold(task.title));
          console.log(`  ID: ${task.id}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Priority: ${task.priority}`);
          console.log(`  Type: ${task.type}`);
          if (task.description) console.log(`  Description: ${task.description}`);
          if (task.command) console.log(`  Command: ${task.command}`);
          if (task.project) console.log(`  Project: ${task.project}`);
          if (task.cwd) console.log(`  Working Dir: ${task.cwd}`);
          if (task.processId) console.log(`  PID: ${task.processId}`);
          if (task.conflicts && task.conflicts.length > 0) {
            console.log(`  Conflicts: ${task.conflicts.join(', ')}`);
          }
          if (task.dependencies && task.dependencies.length > 0) {
            console.log(`  Dependencies: ${task.dependencies.join(', ')}`);
          }
          if (task.tags && task.tags.length > 0) {
            console.log(`  Tags: ${task.tags.join(', ')}`);
          }
          if (task.logFile) console.log(`  Log File: ${task.logFile}`);
          console.log(`  Created: ${task.createdAt.toLocaleString()}`);
          console.log(`  Updated: ${task.updatedAt.toLocaleString()}`);
          if (task.completedAt) {
            console.log(`  Completed: ${task.completedAt.toLocaleString()}`);
          }
        }
      } catch (error) {
        if (shouldOutputJSON(options, commandObj)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red('✗ Error:'), error);
        }
      }
    });

  program
    .command('suggest')
    .description('Get intelligent suggestions for a command')
    .argument('[command]', 'Command to analyze')
    .action(async (command) => {
      try {
        const suggestions = await taskManager.suggestActions(command);

        if (suggestions.length === 0) {
          console.log(chalk.green('✓ No issues detected'));
        } else {
          console.log(chalk.yellow('💡 Intelligent suggestions:'));
          suggestions.forEach(suggestion => {
            console.log(`  • ${suggestion}`);
          });
        }
      } catch (error) {
        console.error(chalk.red('✗ Error:'), error);
      }
    });

  program
    .command('session-start')
    .description('Start a new session')
    .action(() => {
      const sessionId = taskManager.startSession();
      console.log(chalk.green('🚀 New session started'));
      console.log(`  Session ID: ${sessionId}`);
    });

  program
    .command('session-end')
    .description('End current session')
    .action(() => {
      taskManager.endSession();
      console.log(chalk.green('✓ Session ended'));
    });

  // Background process management commands (similar to /bashes)
  program
    .command('bashes')
    .alias('background')
    .description('List and manage background processes')
    .option('--running', 'Show only running processes')
    .option('--json', 'Output in JSON format')
    .action(async (options, command) => {
      try {
        const bgProcessManager = taskManager.getBackgroundProcessManager();
        const filter = options.running ? { status: 'running' as const } : undefined;
        const processes = bgProcessManager.listProcesses(filter);

        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);

        if (shouldOutputJSON(options, command)) {
          const stats = bgProcessManager.getStatistics();
          outputJSON({
            success: true,
            processes: processes.map(proc => ({
              id: proc.id,
              taskId: proc.taskId,
              processId: proc.processId,
              command: proc.command,
              status: proc.status,
              exitCode: proc.exitCode,
              startedAt: proc.startedAt
            })),
            statistics: {
              total: stats.total,
              running: stats.running,
              completed: stats.completed,
              failed: stats.failed
            }
          });
        } else {
          if (processes.length === 0) {
            console.log(chalk.yellow('No background processes found'));
            return;
          }

          console.log(chalk.bold('Background Processes'));
          console.log();

          processes.forEach(proc => {
            const statusColor = proc.status === 'running' ? chalk.blue :
                               proc.status === 'completed' ? chalk.green :
                               chalk.red;

            console.log(chalk.bold(`[${proc.id.substring(0, 8)}]`) + ` PID: ${proc.processId}`);
            console.log(`  Status: ${statusColor(proc.status)}`);
            console.log(`  Command: ${proc.command}`);
            console.log(`  Started: ${proc.startedAt.toLocaleString()}`);
            if (proc.exitCode !== undefined) {
              console.log(`  Exit Code: ${proc.exitCode}`);
            }
            console.log();
          });

          const stats = bgProcessManager.getStatistics();
          console.log(chalk.blue(`Total: ${stats.total} | Running: ${stats.running} | Completed: ${stats.completed} | Failed: ${stats.failed}`));
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('bg-create')
    .description('Create and start a background process task')
    .argument('<title>', 'Task title')
    .argument('<command>', 'Command to run in background')
    .option('-d, --description <description>', 'Task description')
    .option('-p, --priority <priority>', 'Priority level', 'medium')
    .option('-t, --tags <tags>', 'Tags (comma-separated)', (val) => val.split(','))
    .option('--json', 'Output in JSON format')
    .action(async (title, command, options, commandObj) => {
      try {
        const priority = options.priority as TaskPriority;
        const task = await taskManager.createBackgroundTask(
          title,
          command,
          options.description,
          priority,
          options.tags
        );
        
        // Check both command option and global option
        const jsonOutput = options.json || commandObj.parent?.opts().json;
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              command: task.command,
              processId: task.processId,
              status: task.status,
              priority: task.priority,
              tags: task.tags,
              createdAt: task.createdAt,
              sessionId: task.sessionId
            }
          });
        } else {
          console.log(chalk.green('Background task created and started'));
          console.log(chalk.blue(`Task ID: ${task.id}`));
          console.log(`Title: ${task.title}`);
          console.log(`Command: ${task.command}`);
          console.log(`PID: ${task.processId}`);
          console.log(`Status: ${t(`status.${task.status}`)}`);
        }
      } catch (error) {
        const jsonOutput = options.json || commandObj.parent?.opts().json;
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('bg-kill')
    .description('Kill a background process')
    .argument('<id>', 'Task ID or process ID')
    .option('--json', 'Output in JSON format')
    .action(async (id, options, command) => {
      try {
        await taskManager.killBackgroundProcess(id);
        
        // Check both command option and global option
        const jsonOutput = shouldOutputJSON(options, command);
        
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: true,
            message: 'Background process killed'
          });
        } else {
          console.log(chalk.green('Background process killed'));
        }
      } catch (error) {
        const jsonOutput = shouldOutputJSON(options, command);
        if (shouldOutputJSON(options, command)) {
          outputJSON({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        } else {
          console.error(chalk.red(t('errors.unknownError')), error);
        }
      }
    });

  program
    .command('bg-logs')
    .description('Show output/logs of a background process')
    .argument('<id>', 'Process ID')
    .action(async (id) => {
      try {
        const bgProcessManager = taskManager.getBackgroundProcessManager();
        const output = bgProcessManager.getProcessOutput(id);
        
        if (!output) {
          console.log(chalk.yellow('No output available or process not found'));
          return;
        }

        console.log(chalk.bold('Process Output:'));
        console.log(output);
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program.parse();
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
