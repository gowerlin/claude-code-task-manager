#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { TaskManager } from '../core/TaskManager';
import { TaskStatus, TaskPriority } from '../types';
import { initI18n, t, changeLanguage } from '../i18n';

const program = new Command();

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
    .option('-l, --lang <language>', 'Language (en, zh-TW)', 'en');

  program
    .command('create')
    .description(t('actions.create'))
    .argument('<title>', t('fields.title'))
    .option('-d, --description <description>', t('fields.description'))
    .option('-p, --priority <priority>', t('fields.priority'), 'medium')
    .option('-t, --tags <tags>', t('fields.tags'), (val) => val.split(','))
    .action(async (title, options) => {
      try {
        const priority = options.priority as TaskPriority;
        const task = await taskManager.createTask(
          title,
          options.description,
          priority,
          options.tags
        );
        console.log(chalk.green(t('tasks.created')));
        console.log(chalk.blue(`${t('fields.id')}: ${task.id}`));
        console.log(`${t('fields.title')}: ${task.title}`);
        if (task.description) {
          console.log(`${t('fields.description')}: ${task.description}`);
        }
        console.log(`${t('fields.priority')}: ${t(`priority.${task.priority}`)}`);
        console.log(`${t('fields.status')}: ${t(`status.${task.status}`)}`);
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program
    .command('list')
    .description(t('actions.list'))
    .option('-s, --status <status>', t('fields.status'))
    .option('-p, --priority <priority>', t('fields.priority'))
    .option('--session', 'Show only current session tasks')
    .action(async (options) => {
      try {
        const filter: any = {};
        if (options.status) filter.status = options.status;
        if (options.priority) filter.priority = options.priority;
        if (options.session) filter.sessionId = taskManager.getSessionId();

        const tasks = taskManager.listTasks(filter);
        
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
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program
    .command('show')
    .description(t('actions.show'))
    .argument('<id>', t('fields.id'))
    .action(async (id) => {
      try {
        const task = taskManager.getTask(id);
        if (!task) {
          console.error(chalk.red(t('tasks.notFound')));
          return;
        }

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
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
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
    .action(async (id, options) => {
      try {
        const updates: any = {};
        if (options.title) updates.title = options.title;
        if (options.description) updates.description = options.description;
        if (options.status) updates.status = options.status;
        if (options.priority) updates.priority = options.priority;

        const task = await taskManager.updateTask(id, updates);
        console.log(chalk.green(t('tasks.updated')));
        console.log(`${t('fields.title')}: ${task.title}`);
        console.log(`${t('fields.status')}: ${t(`status.${task.status}`)}`);
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program
    .command('complete')
    .description(t('actions.complete'))
    .argument('<id>', t('fields.id'))
    .action(async (id) => {
      try {
        const task = await taskManager.completeTask(id);
        console.log(chalk.green(t('tasks.completed')));
        console.log(`${t('fields.title')}: ${task.title}`);
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
      }
    });

  program
    .command('delete')
    .description(t('actions.delete'))
    .argument('<id>', t('fields.id'))
    .action(async (id) => {
      try {
        await taskManager.deleteTask(id);
        console.log(chalk.green(t('tasks.deleted')));
      } catch (error) {
        console.error(chalk.red(t('errors.unknownError')), error);
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

  program.parse();
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
