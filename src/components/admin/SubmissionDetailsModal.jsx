import React from 'react';
import { X } from 'lucide-react';

const SubmissionDetailsModal = ({ submission, questions, onClose }) => {
  if (!submission) return null;

  const { user_context, answers, created_at } = submission;

  const getAnswerDisplay = (question) => {
    const answerData = answers[question.id];
    if (!answerData || !answerData.answer) {
      return <span className="text-gray-400 italic">No answer provided</span>;
    }

    let displayValue = answerData.answer;
    if (Array.isArray(displayValue)) {
      // Checkbox answers
      const labels = displayValue.map(val => {
        const option = question.options?.find(opt => opt.value === val);
        return option ? option.label : val;
      });
      return labels.join(', ');
    } else if (question.type === 'radio' || question.type === 'select') {
      // Radio or Select answers
      const option = question.options?.find(opt => opt.value === displayValue);
      displayValue = option ? option.label : displayValue;
    }

    return <span className="text-white">{String(displayValue)}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-3">
          <h2 className="text-xl font-bold text-white">Submission Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto pr-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-brand-purple-light mb-2">Submitter Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><strong className="text-gray-300">Name:</strong> {user_context?.firstName} {user_context?.lastName}</p>
              <p><strong className="text-gray-300">Job Title:</strong> {user_context?.jobTitle || 'N/A'}</p>
              <p><strong className="text-gray-300">Organization:</strong> {user_context?.organization || 'N/A'}</p>
              <p><strong className="text-gray-300">Location:</strong> {user_context?.location || 'N/A'}</p>
              <p className="md:col-span-2"><strong className="text-gray-300">Qualifications:</strong> {user_context?.qualifications || 'N/A'}</p>
              <p className="md:col-span-2"><strong className="text-gray-300">Submitted On:</strong> {new Date(created_at).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-purple-light mb-3">Evaluation Answers</h3>
            <div className="space-y-4">
              {questions.sort((a, b) => a.step_id - b.step_id).map(question => (
                <div key={question.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="font-semibold text-gray-200">{question.title}</p>
                  <div className="pl-4 mt-1">
                    <p className="text-sm"><strong className="text-gray-400">Answer:</strong> {getAnswerDisplay(question)}</p>
                    {answers[question.id]?.comment && (
                      <p className="text-sm mt-1"><strong className="text-gray-400">Comment:</strong> <span className="text-gray-300 italic">"{answers[question.id].comment}"</span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsModal;