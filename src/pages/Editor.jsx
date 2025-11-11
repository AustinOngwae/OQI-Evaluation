import React from 'react';
import QuestionnaireEditor from '../components/questionnaire/QuestionnaireEditor';
import { useAuth } from '../context/AuthContext';

const Editor = () => {
  const { user } = useAuth();

  return (
    <div>
      <QuestionnaireEditor user={user} />
    </div>
  );
};

export default Editor;