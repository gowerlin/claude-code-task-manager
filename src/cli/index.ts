#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { TaskManager } from '../core/TaskManager';
import { TaskStatus, TaskPriority } from '../types';
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
    .option('--session', 'Show only current session tasks')
    .option('--json', 'Output in JSON format')
    .action(async (options, command) => {
      try {
        const filter: any = {};
        if (options.status) filter.status = options.status;
        if (options.priority) filter.priority = options.priority;
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
