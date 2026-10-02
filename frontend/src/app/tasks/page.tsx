'use client';

import { useState } from 'react';
import { Panel } from '@/components/Panel';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Review YouTube Q2 revenue report', done: false, priority: 'high' },
  { id: '2', title: 'Schedule Instagram Reels for next week', done: false, priority: 'medium' },
  { id: '3', title: 'Respond to top TikTok comments', done: true, priority: 'low' },
  { id: '4', title: 'Draft sponsorship proposal', done: false, priority: 'high' },
];

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'text-neon-red border-neon-red/30 bg-neon-red/10',
  medium: 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10',
  low: 'text-neon-green border-neon-green/30 bg-neon-green/10',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [input, setInput] = useState('');

  function addTask() {
    if (!input.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: input.trim(), done: false, priority: 'medium' },
    ]);
    setInput('');
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow">Task Protocol</h1>
        <p className="text-gray-400 mt-1">Workflow tracking for your content and analytics tasks.</p>
      </header>

      <Panel>
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-neon-cyan/50 focus:outline-none"
          />
          <button
            onClick={addTask}
            className="flex items-center gap-1 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/20"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 py-3">
              <button onClick={() => toggleTask(task.id)} className="text-gray-400 hover:text-neon-cyan">
                {task.done ? <CheckCircle2 size={20} className="text-neon-green" /> : <Circle size={20} />}
              </button>
              <span className={cn('flex-1 text-sm', task.done && 'text-gray-500 line-through')}>{task.title}</span>
              <span className={cn('rounded-full border px-2 py-0.5 text-xs', PRIORITY_STYLES[task.priority])}>
                {task.priority}
              </span>
              <button onClick={() => removeTask(task.id)} className="text-gray-500 hover:text-neon-red">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No tasks yet.</p>}
        </div>
      </Panel>
    </div>
  );
}
