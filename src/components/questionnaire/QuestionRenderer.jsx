import React from 'react';

const QuestionRenderer = ({ question, formData, handleInputChange, isPreview }) => {
  const value = formData[question.id]?.answer;
  const options = question.options || [];

  const inputElement = (() => {
    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label key={index} className={`flex items-start p-3 sm:p-4 border border-white/20 rounded-lg transition-colors ${isPreview ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-white/10'}`}>
                <input type="radio" name={question.id} value={option.value} checked={value === option.value} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} className="mt-1 h-4 w-4 text-brand-primary bg-transparent border-white/30 focus:ring-brand-primary" disabled={isPreview} />
                <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300 font-body">{option.description}</span>}</div>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <label key={index} className={`flex items-start p-3 border border-white/20 rounded-lg transition-colors ${isPreview ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-white/10'}`}>
                <input type="checkbox" value={option.value} checked={(value || []).includes(option.value)} onChange={(e) => { const currentValues = value || []; const newValues = e.target.checked ? [...currentValues, option.value] : currentValues.filter(v => v !== option.value); handleInputChange(question.id, 'answer', newValues); }} className="mt-1 h-4 w-4 text-brand-primary bg-transparent border-white/30 rounded focus:ring-brand-primary" disabled={isPreview} />
                <div className="ml-3"><span className="font-semibold block text-white">{option.label}</span>{option.description && <span className="text-sm text-gray-300 font-body">{option.description}</span>}</div>
              </label>
            ))}
          </div>
        );
      case 'select':
        return (
          <select value={value || ''} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} required={question.required} disabled={isPreview}>
            <option value="" disabled>-- Please select an option --</option>
            {options.map((option, index) => <option key={index} value={option.value}>{option.label}</option>)}
          </select>
        );
      case 'text':
        return <input type="text" value={value || ''} onChange={(e) => handleInputChange(question.id, 'answer', e.target.value)} placeholder={question.placeholder || 'Enter your response'} required={question.required} disabled={isPreview} />;
      default: return null;
    }
  })();

  return (
    <>
      {inputElement}
      <div className="mt-4">
        <label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-300 font-body">Additional Comments (Optional)</label>
        <textarea id={`comment-${question.id}`} value={formData[question.id]?.comment || ''} onChange={(e) => handleInputChange(question.id, 'comment', e.target.value)} className="mt-1 text-sm" placeholder="Add any extra information or context here..." rows="2" disabled={isPreview} />
      </div>
    </>
  );
};

export default QuestionRenderer;