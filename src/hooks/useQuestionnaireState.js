import { useState, useEffect, useCallback } from 'react';

const getInitialState = () => ({
  currentStep: 1,
  formData: {},
  submissionId: null,
  sessionId: null,
  sessionState: 'initial', // 'initial', 'started', 'resumed', 'finished'
  userInfo: null,
  showResults: false,
  evaluationResults: null,
});

const useQuestionnaireState = () => {
  const [state, setState] = useState(() => {
    try {
      const storedValue = window.sessionStorage.getItem('questionnaireState');
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        // Merge with initial state to ensure all keys are present if the stored shape is old
        return { ...getInitialState(), ...parsed };
      }
    } catch (error) {
      console.error("Error reading questionnaire state from sessionStorage", error);
    }
    return getInitialState();
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem('questionnaireState', JSON.stringify(state));
    } catch (error) {
      console.error("Error writing questionnaire state to sessionStorage", error);
    }
  }, [state]);

  const resetState = useCallback(() => {
    setState(getInitialState());
    try {
        window.sessionStorage.removeItem('questionnaireState');
    } catch (error) {
        console.error("Error removing questionnaire state from sessionStorage", error);
    }
  }, []);

  return [state, setState, resetState];
};

export default useQuestionnaireState;