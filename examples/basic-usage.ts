/**
 * Example: Using Claude Code Task Manager programmatically
 * 
 * This example demonstrates how to use the task manager in your own code.
 */

import { TaskManager, TaskPriority, TaskStatus, initI18n } from '../src';

async function main() {
  // Initialize i18n with English
  await initI18n('en');

  // Create a new task manager instance
  const taskManager = new TaskManager({
    autoSave: true, // Automatically save tasks after modifications
  });

  // Initialize the task manager (loads existing tasks)
  await taskManager.init();

  console.log('=== Claude Code Task Manager Example ===\n');

  // 1. Create some tasks
  console.log('Creating tasks...');
  const task1 = await taskManager.createTask(
    'Implement user authentication',
    'Add JWT-based authentication system',
    TaskPriority.HIGH,
    ['backend', 'security']
  );
  console.log(`✓ Created task: ${task1.title} (${task1.id})`);

  const task2 = await taskManager.createTask(
    'Design landing page',
    'Create mockups for the new landing page',
    TaskPriority.MEDIUM,
    ['frontend', 'design']
  );
  console.log(`✓ Created task: ${task2.title} (${task2.id})`);

  const task3 = await taskManager.createTask(
    'Write API documentation',
    'Document all REST API endpoints',
    TaskPriority.LOW,
    ['documentation']
  );
  console.log(`✓ Created task: ${task3.title} (${task3.id})`);

  // 2. List all tasks
  console.log('\n=== All Tasks ===');
  const allTasks = taskManager.listTasks();
  allTasks.forEach(task => {
    console.log(`[${task.id.substring(0, 8)}] ${task.title}`);
    console.log(`  Status: ${task.status}, Priority: ${task.priority}`);
    console.log(`  Tags: ${task.tags?.join(', ') || 'none'}`);
  });

  // 3. Update a task status
  console.log('\n=== Updating Task ===');
  await taskManager.updateTask(task1.id, {
    status: TaskStatus.IN_PROGRESS
  });
  console.log(`✓ Updated ${task1.title} to IN_PROGRESS`);

  // 4. Complete a task
  console.log('\n=== Completing Task ===');
  await taskManager.completeTask(task2.id);
  console.log(`✓ Completed ${task2.title}`);

  // 5. Filter tasks by status
  console.log('\n=== Pending Tasks ===');
  const pendingTasks = taskManager.listTasks({ status: TaskStatus.PENDING });
  console.log(`Found ${pendingTasks.length} pending task(s)`);
  pendingTasks.forEach(task => {
    console.log(`  - ${task.title}`);
  });

  // 6. Filter tasks by priority
  console.log('\n=== High Priority Tasks ===');
  const highPriorityTasks = taskManager.listTasks({ priority: TaskPriority.HIGH });
  console.log(`Found ${highPriorityTasks.length} high priority task(s)`);
  highPriorityTasks.forEach(task => {
    console.log(`  - ${task.title} [${task.status}]`);
  });

  // 7. Get current session info
  console.log('\n=== Session Info ===');
  console.log(`Session ID: ${taskManager.getSessionId()}`);
  const sessionTasks = taskManager.listTasks({ 
    sessionId: taskManager.getSessionId() 
  });
  console.log(`Tasks in current session: ${sessionTasks.length}`);

  // 8. Export tasks
  console.log('\n=== Export ===');
  const exportPath = '/tmp/tasks-backup.json';
  await taskManager.exportTasks(exportPath);
  console.log(`✓ Tasks exported to ${exportPath}`);

  console.log('\n=== Example Complete ===');
}

// Run the example
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
