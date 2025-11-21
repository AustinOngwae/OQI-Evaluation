import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEditorAuth } from '../../context/EditorAuthContext';
import EditorPasswordPrompt from './EditorPasswordPrompt';

const EditorRoute = () => {
  const { isEditor } = useEditorAuth();
  const navigate = useNavigate();

  if (!isEditor) {
    return <EditorPasswordPrompt onClose={() => navigate('/')} />;
  }

  return <Outlet />;
};

export default EditorRoute;