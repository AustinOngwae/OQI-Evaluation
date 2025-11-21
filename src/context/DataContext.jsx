import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [evaluationItems, setEvaluationItems] = useState([]);
  const [questionEvaluationMappings, setQuestionEvaluationMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    const toastId = toast.loading('Downloading evaluation data...');

    try {
      setProgress(10);
      // Invoke the edge function to get all public data
      const { data, error: invokeError } = await supabase.functions.invoke('get-public-data');

      if (invokeError) {
        throw new Error(`Network error fetching data: ${invokeError.message}`);
      }
      
      // The function itself might return an error object if something went wrong on the server
      if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      }

      setProgress(50);
      
      const { questions: questionsData, evaluationItems: itemsData, questionEvaluationMappings: mappingsData } = data;

      if (!questionsData || questionsData.length === 0) {
        throw new Error('Critical data missing: No questions found. The questionnaire cannot be displayed.');
      }
      
      setQuestions(questionsData);
      setProgress(75);
      
      setEvaluationItems(itemsData || []);
      setQuestionEvaluationMappings(mappingsData || []);
      setProgress(100);

      toast.success('Data loaded successfully!', { id: toastId });
      setLoading(false);
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError(err.message);
      toast.error(`Error: ${err.message}`, { id: toastId, duration: 10000 });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const value = {
    questions,
    evaluationItems,
    questionEvaluationMappings,
    loading,
    error,
    progress,
    reload: loadInitialData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);