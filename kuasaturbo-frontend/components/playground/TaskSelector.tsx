import { CREATIVE_TASKS } from "@/lib/constants";

interface TaskSelectorProps {
  selectedTask: string;
  onSelectTask: (task: string) => void;
  disabled?: boolean;
}

export default function TaskSelector({ selectedTask, onSelectTask, disabled }: TaskSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CREATIVE_TASKS.map((task) => (
        <button
          key={task.id}
          onClick={() => onSelectTask(task.id)}
          disabled={disabled}
          className={`p-4 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedTask === task.id
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-medium">{task.label}</div>
        </button>
      ))}
    </div>
  );
}
