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
      const tablesToFetch = [
        { name: 'questions', setter: setQuestions, select: '*' },
        { name: 'evaluation_items', setter: setEvaluationItems, select: '*' },
        { name: 'question_evaluation_mappings', setter: setQuestionEvaluationMappings, select: '*' }
      ];

      for (let i = 0; i < tablesToFetch.length; i++) {
        const table = tablesToFetch[i];
        toast.loading(`Fetching ${table.name}...`, { id: toastId });
        const { data, error } = await supabase.from(table.name).select(table.select);
        if (error) throw new Error(`Failed to fetch ${table.name}: ${error.message}`);
        table.setter(data);
        setProgress(((i + 1) / tablesToFetch.length) * 100);
      }
      
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