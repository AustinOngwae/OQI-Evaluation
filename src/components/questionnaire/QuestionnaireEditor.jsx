import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Eye, Plus, Edit3, Trash2, Send, MoreVertical, MessageSquare, BookPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuestionForm from './QuestionForm';
import SuggestResourceForQuestionForm from '../suggestions/SuggestResourceForQuestionForm';
import QuestionComments from './QuestionComments';

// A component for the suggestion modal
const SuggestionModal = ({ user, context, onClose, onSubmitted }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    const toastId = toast.loading('Submitting suggestion...');
    try {
      const { error } = await supabase.from('question_suggestions').insert({
        author_id: user.id,
        author_name_context: user.first_name || user.email,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {context.type === 'add' && 'Suggest a New Evaluation Question'}
          {context.type === 'edit' && 'Suggest an Edit to Evaluation Question'}
          {context.type === 'delete' && 'Suggest Deleting Evaluation Question'}
        </h2>
        <p className="text-gray-600 mb-4">
          Your suggestion will be sent to an administrator for review. Please provide a brief justification.
        </p>
        {context.type === 'delete' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
            <p className="font-semibold text-red-800">You are suggesting to delete:</p>
            <p className="text-red-700">"{context.question.title}"</p>
          </div>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows="3"
          placeholder="e.g., 'This question could be clearer...' or 'This option is missing...'"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!comment}
            className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Send size={16} className="mr-2" /> Submit Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

const extractMappingsFromPayload = (payload) => {
  if (!payload.options || payload.options.length === 0) {
    return { questionData: payload, mappings: null };
  }
  const mappings = payload.options
    .filter(opt => opt.recommendations && opt.recommendations.length > 0)
    .map(opt => ({
      answer_value: opt.value,
      recommendations: opt.recommendations
    }));
  const questionData = JSON.parse(JSON.stringify(payload));
  if (questionData.options) {
    questionData.options.forEach(opt => delete opt.recommendations);
  }
  return { questionData, mappings };
};

const generateMappingData = (mappings, question_id) => {
  return mappings.flatMap(m =>
    m.recommendations.map(recId => ({
      question_id: question_id,
      answer_value: m.answer_value,
      recommendation_item_id: recId
    }))
  );
};

const QuestionnaireEditor = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [suggestionContext, setSuggestionContext] = useState(null);
  const [formModalState, setFormModalState] = useState({ isOpen: false, mode: null, question: null });
  const [resourceSuggestionState, setResourceSuggestionState] = useState({ isOpen: false, question: null });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const menuRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('questions').select('*').order('step_id', { ascending: true });
      if (error) throw error;
      setQuestions(data);
    } catch (err) {
      setError('Failed to load questions.');
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!isAdmin) {
      const type = formModalState.mode;
      const question = formModalState.question;
      if (type === 'add') delete formData.id;
      setSuggestionContext({ type, question, payload: formData });
      setFormModalState({ isOpen: false, mode: null, question: null });
    } else {
      const { mode, question } = formModalState;
      const toastId = toast.loading(mode === 'add' ? 'Adding question...' : 'Updating question...');
      try {
        const { questionData, mappings } = extractMappingsFromPayload(formData);
        const linked_resources = formData.linked_resources || [];
        delete questionData.linked_resources;

        let questionId;
        if (mode === 'add') {
          const { data: newQuestion, error: addError } = await supabase.from('questions').insert(questionData).select().single();
          if (addError) throw addError;
          questionId = newQuestion.id;
          if (mappings && newQuestion) {
            const mappingData = generateMappingData(mappings, newQuestion.id);
            if (mappingData.length > 0) {
              const { error: mappingError } = await supabase.from('question_evaluation_mappings').insert(mappingData);
              if (mappingError) throw mappingError;
            }
          }
        } else { // mode === 'edit'
          questionId = question.id;
          const { error: updateError } = await supabase.from('questions').update(questionData).eq('id', question.id);
          if (updateError) throw updateError;
          await supabase.from('question_evaluation_mappings').delete().eq('question_id', question.id);
          if (mappings) {
            const mappingData = generateMappingData(mappings, question.id);
            if (mappingData.length > 0) {
              const { error: mappingError } = await supabase.from('question_evaluation_mappings').insert(mappingData);
              if (mappingError) throw mappingError;
            }
          }
        }

        // Handle resource links
        await supabase.from('question_resources').delete().eq('question_id', questionId);
        if (linked_resources.length > 0) {
          const linkData = linked_resources.map(resource_id => ({ question_id: questionId, resource_id: resource_id }));
          const { error: linkError } = await supabase.from('question_resources').insert(linkData);
          if (linkError) throw linkError;
        }

        toast.success(mode === 'add' ? 'Question added.' : 'Question updated.', { id: toastId });
        setFormModalState({ isOpen: false, mode: null, question: null });
        loadQuestions();
      } catch (err) {
        toast.error(`Action failed: ${err.message}`, { id: toastId });
      }
    }
  };

  const openAddModal = (stepId) => setFormModalState({ isOpen: true, mode: 'add', question: { step_id: stepId, type: 'text', options: [] } });
  const openEditModal = (question) => setFormModalState({ isOpen: true, mode: 'edit', question });
  const openDeleteSuggestionModal = (question) => setSuggestionContext({ type: 'delete', question, payload: { id: question.id } });

  const handleDeleteQuestion = async (questionId) => {
    if (!isAdmin || !window.confirm('Are you sure you want to permanently delete this question?')) return;
    const toastId = toast.loading('Deleting question...');
    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      toast.success('Question deleted.', { id: toastId });
      loadQuestions();
    } catch (err) {
      toast.error(`Deletion failed: ${err.message}`, { id: toastId });
    }
  };

  if (loading) return <div className="p-6 text-center">Loading editor...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {suggestionContext && <SuggestionModal user={user} context={suggestionContext} onClose={() => setSuggestionContext(null)} onSubmitted={() => {}} />}
      {formModalState.isOpen && <QuestionForm question={formModalState.question} mode={formModalState.mode} onSubmit={handleFormSubmit} onCancel={() => setFormModalState({ isOpen: false, mode: null, question: null })} isAdmin={isAdmin} />}
      {resourceSuggestionState.isOpen && <SuggestResourceForQuestionForm user={user} question={resourceSuggestionState.question} onClose={() => setResourceSuggestionState({ isOpen: false, question: null })} onSubmitted={() => {}} />}
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">OQI Evaluation Editor</h1>
          <p className="text-gray-600 mt-2">{!isAdmin ? 'Review evaluation questions and suggest improvements for admin approval.' : 'Directly manage all evaluation questions in the system.'}</p>
        </div>
        <Link to="/questionnaire" className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"><Eye size={18} className="mr-2" /> Preview Evaluation</Link>
      </div>
      <div className="space-y-8">
        {[1, 2, 3, 4].map(stepId => (
          <div key={stepId} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Step {stepId}</h2>
              <button onClick={() => openAddModal(stepId)} className="flex items-center text-purple-600 hover:text-purple-700"><Plus size={18} className="mr-1" /> {!isAdmin ? 'Suggest New Question' : 'Add Question'}</button>
            </div>
            <div className="space-y-4">
              {questions.filter(q => q.step_id === stepId).map(question => (
                <div key={question.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{question.title}</h3>
                      {question.description && <p className="text-gray-600 text-sm mt-1">{question.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">Type: {question.type} • {question.required ? 'Required' : 'Optional'}</p>
                    </div>
                    <div className="relative ml-4" ref={openMenuId === question.id ? menuRef : null}>
                      <button onClick={() => setOpenMenuId(openMenuId === question.id ? null : question.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Actions"><MoreVertical size={18} /></button>
                      {openMenuId === question.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <ul className="py-1">
                            <li><button onClick={() => { openEditModal(question); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit3 size={16} className="mr-2" />{isAdmin ? 'Edit Question' : 'Suggest Edit'}</button></li>
                            <li><button onClick={() => { setResourceSuggestionState({ isOpen: true, question }); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><BookPlus size={16} className="mr-2" />Suggest Resource</button></li>
                            <li><button onClick={() => { setOpenCommentsId(openCommentsId === question.id ? null : question.id); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><MessageSquare size={16} className="mr-2" />Comments</button></li>
                            <li><button onClick={() => { !isAdmin ? openDeleteSuggestionModal(question) : handleDeleteQuestion(question.id); setOpenMenuId(null); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={16} className="mr-2" />{isAdmin ? 'Delete Question' : 'Suggest Deletion'}</button></li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {openCommentsId === question.id && <QuestionComments user={user} questionId={question.id} isAdmin={isAdmin} />}
                </div>
              ))}
              {questions.filter(q => q.step_id === stepId).length === 0 && <div className="text-center text-gray-500 py-4">No questions in this step.</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireEditor;