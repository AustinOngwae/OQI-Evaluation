import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Eye, Plus, Edit3, Trash2, Send, MoreVertical, MessageSquare, BookPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestionForm from './QuestionForm';
import SuggestResourceForQuestionForm from '../suggestions/SuggestResourceForQuestionForm';
import QuestionComments from './QuestionComments';
import { STEP_TITLES } from '../../utils/constants';
import { useData } from '../../context/DataContext';

// A component for the suggestion modal
const SuggestionModal = ({ context, onClose, onSubmitted }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    const toastId = toast.loading('Submitting suggestion...');
    try {
      const { error } = await supabase.from('question_suggestions').insert({
        author_id: null,
        author_name_context: 'Anonymous',
        question_id: context.question?.id,
        question_title_context: context.question?.title || 'New Question',
        suggestion_type: context.type,
        payload: context.payload,
        comment: comment,
      });
      if (error) throw error;
      toast.success('Suggestion submitted for review.', { id: toastId });
      onSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error.message);
      toast.error(`Submission failed: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white font-sans">
          {context.type === 'add' && 'Suggest a New Evaluation Question'}
          {context.type === 'edit' && 'Suggest an Edit to Evaluation Question'}
          {context.type === 'delete' && 'Suggest Deleting Evaluation Question'}
        </h2>
        <p className="text-gray-300 mb-4 font-body">
          Your suggestion will be sent to an administrator for review. Please provide a brief justification.
        </p>
        {context.type === 'delete' && (
          <div className="bg-red-500/20 border border-red-400/50 p-3 rounded-md mb-4">
            <p className="font-semibold text-red-200 font-sans">You are suggesting to delete:</p>
            <p className="text-red-300">"{context.question.title}"</p>
          </div>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          placeholder="e.g., 'This question could be clearer...' or 'This option is missing...'"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!comment}
            className="btn-primary flex items-center"
          >
            <Send size={16} className="mr-2" /> Submit Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionnaireEditor = () => {
  const { questions, reload: loadQuestions } = useData();
  
  const [suggestionContext, setSuggestionContext] = useState(null);
  const [formModalState, setFormModalState] = useState({ isOpen: false, mode: null, question: null });
  const [resourceSuggestionState, setResourceSuggestionState] = useState({ isOpen: false, question: null });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = (formData) => {
    const type = formModalState.mode;
    const question = formModalState.question;
    if (type === 'add') {
      delete formData.id;
    }
    setSuggestionContext({ type, question, payload: formData });
    setFormModalState({ isOpen: false, mode: null, question: null });
  };

  const openAddModal = (stepId) => setFormModalState({ isOpen: true, mode: 'add', question: { step_id: stepId, type: 'text', options: [] } });
  const openEditModal = (question) => setFormModalState({ isOpen: true, mode: 'edit', question });
  const openDeleteSuggestionModal = (question) => setSuggestionContext({ type: 'delete', question, payload: { id: question.id } });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {suggestionContext && <SuggestionModal context={suggestionContext} onClose={() => setSuggestionContext(null)} onSubmitted={loadQuestions} />}
      {formModalState.isOpen && <QuestionForm question={formModalState.question} mode={formModalState.mode} onSubmit={handleFormSubmit} onCancel={() => setFormModalState({ isOpen: false, mode: null, question: null })} />}
      {resourceSuggestionState.isOpen && <SuggestResourceForQuestionForm question={resourceSuggestionState.question} onClose={() => setResourceSuggestionState({ isOpen: false, question: null })} onSubmitted={() => {}} />}
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-sans">OQI Evaluation Editor</h1>
          <p className="text-gray-300 mt-2 font-body">Review evaluation questions and suggest improvements for admin approval.</p>
        </div>
        <Link to="/questionnaire" className="btn-secondary flex items-center"><Eye size={18} className="mr-2" /> Preview Evaluation</Link>
      </div>
      <div className="space-y-8">
        {[1, 2, 3, 4].map(stepId => (
          <div key={stepId} className="bg-white/5 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white font-sans">Step {stepId}: {STEP_TITLES[stepId]}</h2>
              <button onClick={() => openAddModal(stepId)} className="flex items-center text-brand-primary hover:text-white"><Plus size={18} className="mr-1" /> Suggest New Question</button>
            </div>
            <div className="space-y-4">
              {questions.filter(q => q.step_id === stepId).map(question => (
                <div key={question.id} className="bg-white/5 p-4 rounded-lg border border-white/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white font-sans">{question.title}</h3>
                      {question.description && <p className="text-gray-300 text-sm mt-1 font-body">{question.description}</p>}
                      <p className="text-xs text-gray-400 mt-2 font-body">Type: {question.type} • {question.required ? 'Required' : 'Optional'}</p>
                    </div>
                    <div className="relative ml-4" ref={openMenuId === question.id ? menuRef : null}>
                      <button onClick={() => setOpenMenuId(openMenuId === question.id ? null : question.id)} className="p-2 text-gray-300 hover:bg-white/10 rounded-full" title="Actions"><MoreVertical size={18} /></button>
                      {openMenuId === question.id && (
                        <div className="absolute right-0 mt-2 w-56 glass-card p-1 z-10">
                          <ul className="py-1">
                            <li><button onClick={() => { openEditModal(question); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10"><Edit3 size={16} className="mr-2" />Suggest Edit</button></li>
                            <li><button onClick={() => { setResourceSuggestionState({ isOpen: true, question }); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10"><BookPlus size={16} className="mr-2" />Suggest Resource</button></li>
                            <li><button onClick={() => { setOpenCommentsId(openCommentsId === question.id ? null : question.id); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10"><MessageSquare size={16} className="mr-2" />Comments</button></li>
                            <li><button onClick={() => { openDeleteSuggestionModal(question); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20"><Trash2 size={16} className="mr-2" />Suggest Deletion</button></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {openCommentsId === question.id && <QuestionComments questionId={question.id} />}
                </div>
              ))}
              {questions.filter(q => q.step_id === stepId).length === 0 && <div className="text-center text-gray-400 py-4">No questions in this step.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireEditor;