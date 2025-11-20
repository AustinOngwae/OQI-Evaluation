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
        { name: 'questions', setter: setQuestions },
        { name: 'evaluation_items', setter: setEvaluationItems },
        { name: 'question_evaluation_mappings', setter: setQuestionEvaluationMappings }
      ];

      setProgress(25); // Indicate that we've started

      const promises = tablesToFetch.map(table => supabase.from(table.name).select('*'));
      
      const results = await Promise.all(promises);
      
      setProgress(75); // Indicate that data has been fetched

      results.forEach((response, index) => {
        const { data, error } = response;
        const tableName = tablesToFetch[index].name;
        if (error) {
          throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
        }
        tablesToFetch[index].setter(data);
      });
      
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