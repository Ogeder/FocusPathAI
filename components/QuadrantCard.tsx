
import React from 'react';
import { TaskAnalysis, Quadrant } from '../types';

interface QuadrantCardProps {
  type: Quadrant;
  tasks: TaskAnalysis[];
  title: string;
  subtitle: string;
  colorClass: string;
  onEditTask: (task: TaskAnalysis, originalIndex: number) => void;
  onMoveTask: (taskIndex: number, targetQuadrant: Quadrant, targetPosition?: number) => void;
  allTasks: TaskAnalysis[]; 
}

const QuadrantCard: React.FC<QuadrantCardProps> = ({ 
  type, 
  tasks, 
  title, 
  subtitle, 
  colorClass, 
  onEditTask, 
  onMoveTask, 
  allTasks 
}) => {
  
  const handleDragStart = (e: React.DragEvent, globalIndex: number) => {
    e.dataTransfer.setData('taskIndex', globalIndex.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCard = (e: React.DragEvent) => {
    e.preventDefault();
    const taskIndex = parseInt(e.dataTransfer.getData('taskIndex'));
    if (!isNaN(taskIndex)) {
      onMoveTask(taskIndex, type);
    }
  };

  const handleDropOnTask = (e: React.DragEvent, targetGlobalIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const taskIndex = parseInt(e.dataTransfer.getData('taskIndex'));
    if (!isNaN(taskIndex) && taskIndex !== targetGlobalIndex) {
      onMoveTask(taskIndex, type, targetGlobalIndex);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full min-h-[300px] p-6 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl ${colorClass}`}
      onDragOver={handleDragOver}
      onDrop={handleDropOnCard}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-xs opacity-70 font-medium">{subtitle}</p>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-current border-opacity-10 rounded-2xl py-10">
            <p className="text-sm opacity-40 italic">Drop tasks here</p>
          </div>
        ) : (
          tasks.map((task) => {
            const globalIndex = allTasks.findIndex(t => t === task);
            
            return (
              <div 
                key={`${task.title}-${globalIndex}`} 
                draggable
                onDragStart={(e) => handleDragStart(e, globalIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnTask(e, globalIndex)}
                onClick={() => onEditTask(task, globalIndex)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-black border-opacity-5 group relative overflow-hidden cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all active:scale-[0.98]"
              >
                 <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight pr-4 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 whitespace-nowrap">
                      {task.estimatedTime}
                    </span>
                 </div>
                 <p className="text-[11px] text-slate-500 italic mb-2 line-clamp-2">{task.reasoning}</p>
                 <div className="flex gap-2">
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${task.urgencyScore * 10}%` }}
                        title="Urgency"
                      />
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${task.importanceScore * 10}%` }}
                        title="Importance"
                      />
                    </div>
                 </div>
                 {/* Reorder/Drag Handle Visual */}
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8h16M4 16h16" />
                    </svg>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuadrantCard;
