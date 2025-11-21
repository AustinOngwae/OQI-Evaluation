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
      // Step 1: Fetch critical 'questions' data first.
      setProgress(10);
      const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*');
      
      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }
      if (!questionsData || questionsData.length === 0) {
        throw new Error('Critical data missing: No questions found. The questionnaire cannot be displayed.');
      }
      setQuestions(questionsData);
      setProgress(50);

      // Step 2: Fetch other data in parallel now that critical data is loaded.
      const [itemsResponse, mappingsResponse] = await Promise.all([
        supabase.from('evaluation_items').select('*'),
        supabase.from('question_evaluation_mappings').select('*')
      ]);

      const { data: itemsData, error: itemsError } = itemsResponse;
      if (itemsError) {
        toast.error(`Could not load evaluation items: ${itemsError.message}`);
        setEvaluationItems([]);
      } else {
        setEvaluationItems(itemsData);
      }
      setProgress(75);

      const { data: mappingsData, error: mappingsError } = mappingsResponse;
      if (mappingsError) {
        toast.error(`Could not load evaluation mappings: ${mappingsError.message}`);
        setQuestionEvaluationMappings([]);
      } else {
        setQuestionEvaluationMappings(mappingsData);
      }
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