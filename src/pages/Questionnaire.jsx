import React from 'react';
import EnhancedQuestionnaire from '../components/questionnaire/EnhancedQuestionnaire';
import { useAuth } from '../context/AuthContext';

const Questionnaire = () => {
  const { user } = useAuth();

  return (
    <div>
      <EnhancedQuestionnaire user={user} />
    </div>
  );
};

export default Questionnaire;