import React from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QuestionnaireNavigation = ({ onPrevious, onNext, onSubmit, isFirstStep, isLastStep, isNextDisabled, savingStatus }) => {
  return (
    <div className="flex justify-between items-center">
      <Button onClick={onPrevious} variant="secondary" disabled={isFirstStep}>
        <ChevronLeft size={20} className="mr-2" /> Previous
      </Button>
      <div className="text-sm text-gray-400 h-5 flex items-center transition-all duration-300">
        {savingStatus === 'saving' && <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50 mr-2"></div> Saving...</>}
        {savingStatus === 'saved' && 'All changes saved.'}
        {savingStatus === 'error' && <span className="text-red-400">Save failed.</span>}
      </div>
      {isLastStep ? (
        <Button onClick={onSubmit} size="lg">
          <Send size={18} className="mr-2" /> Generate Report
        </Button>
      ) : (
        <Button onClick={onNext} disabled={isNextDisabled}>
          Next <ChevronRight size={20} className="ml-2" />
        </Button>
      )}
    </div>
  );
};

export default QuestionnaireNavigation;