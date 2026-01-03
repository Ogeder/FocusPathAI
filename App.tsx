
import React, { useState, useCallback, useMemo } from 'react';
import { analyzeTasks } from './services/geminiService';
import { FocusPlan, Quadrant, TaskAnalysis } from './types';
import QuadrantCard from './components/QuadrantCard';
import EditTaskModal from './components/EditTaskModal';

interface Filters {
  minUrgency: number;
  minImportance: number;
  search: string;
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<FocusPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const [filters, setFilters] = useState<Filters>({
    minUrgency: 1,
    minImportance: 1,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Editing state
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeTasks(input);
      setPlan(result);
      setFilters({ minUrgency: 1, minImportance: 1, search: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to analyze tasks. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (updatedTask: TaskAnalysis) => {
    if (plan && editingTaskIndex !== null) {
      const newTasks = [...plan.tasks];
      newTasks[editingTaskIndex] = updatedTask;
      setPlan({ ...plan, tasks: newTasks });
    }
    setEditingTaskIndex(null);
  };

  const moveTask = (taskIndex: number, targetQuadrant: Quadrant, targetGlobalIndex?: number) => {
    if (!plan) return;
    
    const newTasks = [...plan.tasks];
    const [movedTask] = newTasks.splice(taskIndex, 1);
    
    // Update quadrant
    movedTask.quadrant = targetQuadrant;
    
    if (targetGlobalIndex !== undefined) {
      // If targetGlobalIndex was provided, we need to adjust it if the source was before it
      const actualTargetIndex = targetGlobalIndex > taskIndex ? targetGlobalIndex : targetGlobalIndex;
      newTasks.splice(actualTargetIndex, 0, movedTask);
    } else {
      // Append to the end of the list (will appear at end of quadrant)
      newTasks.push(movedTask);
    }
    
    setPlan({ ...plan, tasks: newTasks });
  };

  // Compute filtered tasks
  const filteredTasksList = useMemo(() => {
    if (!plan) return [];
    return plan.tasks.filter(task => {
      const matchesUrgency = task.urgencyScore >= filters.minUrgency;
      const matchesImportance = task.importanceScore >= filters.minImportance;
      const matchesSearch = 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.estimatedTime.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.reasoning.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesUrgency && matchesImportance && matchesSearch;
    });
  }, [plan, filters]);

  const getTasksByQuadrant = useCallback((q: Quadrant) => {
    return filteredTasksList.filter(t => t.quadrant === q);
  }, [filteredTasksList]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Edit Modal */}
      {plan && editingTaskIndex !== null && (
        <EditTaskModal 
          task={plan.tasks[editingTaskIndex]} 
          onSave={updateTask} 
          onClose={() => setEditingTaskIndex(null)} 
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md text-center align-middle">F</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">FocusPath<span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="hidden sm:block text-sm text-slate-500 font-medium">
            Eisenhower Matrix Prioritization
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {/* Input Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Clear your mental clutter.</h2>
            <p className="text-lg text-slate-600">Dump your tasks, notes, and worries below. Our AI will organize your day for maximum impact.</p>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <textarea
              className="w-full h-40 p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 placeholder:text-slate-400 mb-4 transition-all text-lg leading-relaxed"
              placeholder="e.g., I need to finish the quarterly report by Friday, pick up groceries, fix the bug in the login flow, email the client about the new proposal..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className={`w-full py-5 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] text-lg ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mapping your Focus...
                </div>
              ) : 'Analyze & Prioritize'}
            </button>
            
            {error && <p className="mt-4 text-center text-red-500 text-sm font-medium animate-bounce">{error}</p>}
          </div>
        </div>

        {/* Results Section */}
        {plan && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Executive Summary */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 mb-8 shadow-sm">
               <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-3">AI Analysis Summary</h3>
                    <p className="text-2xl text-slate-700 leading-relaxed font-light">"{plan.executiveSummary}"</p>
                  </div>
                  <div className="bg-indigo-600 rounded-3xl p-7 min-w-[320px] shadow-lg shadow-indigo-200 text-white">
                    <h4 className="font-bold text-xs uppercase tracking-widest mb-3 opacity-80 flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Today's Critical Task
                    </h4>
                    <p className="font-extrabold text-xl leading-tight">{plan.topPriority}</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-xs font-medium opacity-90">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                       </svg>
                       Highest potential impact
                    </div>
                  </div>
               </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Prioritization Matrix</h3>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
                  </svg>
                  {showFilters ? 'Hide Filters' : 'Filter Results'}
                  {(filters.minUrgency > 1 || filters.minImportance > 1 || filters.search) && (
                    <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-top-4 duration-300 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Urgency Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Urgency: {filters.minUrgency}</label>
                        {filters.minUrgency > 1 && <button onClick={() => setFilters({...filters, minUrgency: 1})} className="text-[10px] text-indigo-500 hover:underline">Reset</button>}
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={filters.minUrgency}
                        onChange={(e) => setFilters({...filters, minUrgency: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    {/* Importance Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Importance: {filters.minImportance}</label>
                        {filters.minImportance > 1 && <button onClick={() => setFilters({...filters, minImportance: 1})} className="text-[10px] text-indigo-500 hover:underline">Reset</button>}
                      </div>
                      <input 
                        type="range" min="1" max="10" 
                        value={filters.minImportance}
                        onChange={(e) => setFilters({...filters, minImportance: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    {/* Search Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Title / Time / Notes</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. '30 mins' or 'client'..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {filters.search && (
                          <button 
                            onClick={() => setFilters({...filters, search: ''})}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Eisenhower Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <QuadrantCard
                type={Quadrant.DO_FIRST}
                tasks={getTasksByQuadrant(Quadrant.DO_FIRST)}
                allTasks={plan.tasks}
                onEditTask={(_, idx) => setEditingTaskIndex(idx)}
                onMoveTask={moveTask}
                title="Do First"
                subtitle="Urgent & Important"
                colorClass="bg-rose-50/50 border-rose-100 text-rose-900"
              />
              <QuadrantCard
                type={Quadrant.SCHEDULE}
                tasks={getTasksByQuadrant(Quadrant.SCHEDULE)}
                allTasks={plan.tasks}
                onEditTask={(_, idx) => setEditingTaskIndex(idx)}
                onMoveTask={moveTask}
                title="Schedule"
                subtitle="Not Urgent but Important"
                colorClass="bg-blue-50/50 border-blue-100 text-blue-900"
              />
              <QuadrantCard
                type={Quadrant.DELEGATE}
                tasks={getTasksByQuadrant(Quadrant.DELEGATE)}
                allTasks={plan.tasks}
                onEditTask={(_, idx) => setEditingTaskIndex(idx)}
                onMoveTask={moveTask}
                title="Delegate"
                subtitle="Urgent but Not Important"
                colorClass="bg-amber-50/50 border-amber-100 text-amber-900"
              />
              <QuadrantCard
                type={Quadrant.ELIMINATE}
                tasks={getTasksByQuadrant(Quadrant.ELIMINATE)}
                allTasks={plan.tasks}
                onEditTask={(_, idx) => setEditingTaskIndex(idx)}
                onMoveTask={moveTask}
                title="Eliminate"
                subtitle="Neither Urgent nor Important"
                colorClass="bg-slate-50 border-slate-200 text-slate-500"
              />
            </div>

            <div className="text-center">
              <button 
                onClick={() => { setPlan(null); setInput(''); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="px-8 py-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-indigo-600 hover:border-indigo-100 font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Start fresh with a new list
              </button>
            </div>
          </div>
        )}

        {/* Empty State / Hint */}
        {!plan && !loading && (
          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="text-3xl mb-3">🧠</div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">Stop worrying</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Free up working memory by getting it all on "paper" instantly.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="text-3xl mb-3">⚖️</div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">Fair evaluation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Let AI objectively weigh urgency vs long-term value for you.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="text-3xl mb-3">🚀</div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">Pure focus</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Focus your limited energy only on what moves the needle today.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="mt-20 py-8 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-sm font-medium tracking-wide">Powered by Gemini 3 Flash • Built for maximum cognitive efficiency</p>
      </footer>
    </div>
  );
};

export default App;
