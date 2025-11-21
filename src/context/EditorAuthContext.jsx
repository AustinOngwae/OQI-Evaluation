import React, { createContext, useState, useContext } from 'react';

const EditorAuthContext = createContext();

export const EditorAuthProvider = ({ children }) => {
  const [isEditor, setIsEditor] = useState(false);

  const login = (password) => {
    const correctPassword = '403040';
    if (password === correctPassword) {
      setIsEditor(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsEditor(false);
  };

  const value = { isEditor, login, logout };

  return (
    <EditorAuthContext.Provider value={value}>
      {children}
    </EditorAuthContext.Provider>
  );
};

export const useEditorAuth = () => {
  return useContext(EditorAuthContext);
};