import React from 'react';
import { X, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const renderValue = (value) => {
  if (value === null || value === undefined) return <span className="text-gray-500">null</span>;
  if (typeof value === 'object') {
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
};

const FieldChange = ({ field, oldValue, newValue }) => {
  const oldStr = JSON.stringify(oldValue);
  const newStr = JSON.stringify(newValue);

  if (oldStr === newStr) return null;

  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{field}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="p-2 bg-red-500/10 rounded-md border border-red-500/20">
          <p className="text-xs text-red-300/80 mb-1">Before</p>
          <div className="text-sm text-red-300">{renderValue(oldValue)}</div>
        </div>
        <div className="p-2 bg-green-500/10 rounded-md border border-green-500/20">
          <p className="text-xs text-green-300/80 mb-1">After</p>
          <div className="text-sm text-green-300">{renderValue(newValue)}</div>
        </div>
      </div>
    </div>
  );
};

const NewField = ({ field, value }) => {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{field}</p>
      <div className="p-2 bg-white/10 rounded-md text-sm text-white">
        {renderValue(value)}
      </div>
    </div>
  );
};

const SuggestionDetailsModal = ({ suggestion, questions, onClose }) => {
  const originalQuestion = (suggestion.suggestion_type === 'edit' && suggestion.payload?.id)
    ? questions.find(q => q.id === suggestion.payload.id)
    : null;

  const renderContent = () => {
    const { suggestion_type, payload, source } = suggestion;

    if (source === 'resource_suggestions' || suggestion_type === 'suggest_resource') {
      const resource = source === 'resource_suggestions' ? suggestion : payload;
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-lg text-white">Proposed Resource:</h4>
          <NewField field="Type" value={resource.type} />
          <NewField field="Title" value={resource.title} />
          <NewField field="Description" value={resource.description} />
          {resource.url && <NewField field="URL" value={resource.url} />}
        </div>
      );
    }

    if (suggestion_type === 'delete') {
      return (
        <div className="p-4 bg-red-500/20 rounded-lg text-center">
          <p className="font-bold text-red-200">This is a proposal to DELETE the following question:</p>
          <p className="mt-2 text-white">"{suggestion.question_title_context}"</p>
        </div>
      );
    }

    if (suggestion_type === 'add') {
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-lg text-white">Proposed New Question:</h4>
          <NewField field="Title" value={payload.title} />
          <NewField field="Description" value={payload.description} />
          <NewField field="Type" value={payload.type} />
          <NewField field="Step ID" value={payload.step_id} />
          <NewField field="Required" value={payload.required} />
          <NewField field="Options" value={payload.options} />
          <NewField field="Linked Resources" value={payload.linked_resources} />
          <NewField field="New Resources to Create" value={payload.new_resources} />
        </div>
      );
    }

    if (suggestion_type === 'edit') {
      if (!originalQuestion) {
        return <p className="text-yellow-300">Could not find the original question to compare edits.</p>;
      }
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-lg text-white">Proposed Edits:</h4>
          <FieldChange field="Title" oldValue={originalQuestion.title} newValue={payload.title} />
          <FieldChange field="Description" oldValue={originalQuestion.description} newValue={payload.description} />
          <FieldChange field="Type" oldValue={originalQuestion.type} newValue={payload.type} />
          <FieldChange field="Required" oldValue={originalQuestion.required} newValue={payload.required} />
          <FieldChange field="Step ID" oldValue={originalQuestion.step_id} newValue={payload.step_id} />
          <FieldChange field="Options" oldValue={originalQuestion.options} newValue={payload.options} />
          <NewField field="Proposed Linked Resources" value={payload.linked_resources} />
          <NewField field="Proposed New Resources to Create" value={payload.new_resources} />
        </div>
      );
    }

    return <p>Could not display details for this suggestion type.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center border-b border-white/20 pb-3 mb-4">
          <h2 className="text-xl font-bold text-white font-sans flex items-center"><GitPullRequest size={20} className="mr-3 text-brand-primary" /> Suggestion Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          <div className="p-3 bg-white/5 rounded-lg text-sm">
            <p><strong className="font-semibold text-gray-300 w-28 inline-block">Context:</strong> <span className="text-white">{suggestion.question_title_context}</span></p>
            <p><strong className="font-semibold text-gray-300 w-28 inline-block">Type:</strong> <span className="text-white capitalize">{suggestion.suggestion_type.replace(/_/g, ' ')}</span></p>
            <p><strong className="font-semibold text-gray-300 w-28 inline-block">Date:</strong> <span className="text-white">{format(new Date(suggestion.created_at), 'PPp')}</span></p>
            {suggestion.comment && <p className="mt-2"><strong className="font-semibold text-gray-300 block">Submitter's Comment:</strong> <span className="text-white italic">"{suggestion.comment}"</span></p>}
          </div>

          <div className="p-4 bg-black/20 rounded-lg">
            {renderContent()}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end mt-6 pt-4 border-t border-white/20">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionDetailsModal;