import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChevronDown } from 'lucide-react';

const AnalyticsDashboard = ({ submissions, questions }) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState('');

  const analysisData = useMemo(() => {
    if (!selectedQuestionId || submissions.length === 0) {
      return null;
    }

    const question = questions.find(q => q.id === selectedQuestionId);
    if (!question || !['radio', 'checkbox', 'select'].includes(question.type)) {
      return { type: 'unsupported' };
    }

    const answerCounts = {};
    (question.options || []).forEach(opt => {
      answerCounts[opt.value] = { label: opt.label, count: 0 };
    });

    submissions.forEach(submission => {
      const answer = submission.answers[selectedQuestionId]?.answer;
      if (answer) {
        if (Array.isArray(answer)) { // Checkbox
          answer.forEach(val => {
            if (answerCounts[val]) {
              answerCounts[val].count++;
            }
          });
        } else { // Radio or Select
          if (answerCounts[answer]) {
            answerCounts[answer].count++;
          }
        }
      }
    });

    const chartData = Object.values(answerCounts).map(data => ({
      name: data.label,
      value: data.count,
    }));

    return {
      type: question.type,
      title: question.title,
      data: chartData,
    };
  }, [selectedQuestionId, submissions, questions]);

  const getChartOption = () => {
    if (!analysisData || !analysisData.data) return {};

    return {
      title: {
        text: analysisData.title,
        subtext: `Based on ${submissions.length} submissions`,
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: '15%',
        data: analysisData.data.map(d => d.name),
      },
      series: [
        {
          name: 'Answers',
          type: 'pie',
          radius: '55%',
          center: ['50%', '60%'],
          data: analysisData.data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  const selectableQuestions = questions.filter(q => ['radio', 'checkbox', 'select'].includes(q.type));

  if (submissions.length === 0) {
    return <p className="text-gray-500 text-center py-8">No submissions yet to analyze.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="question-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select a question to analyze:
        </label>
        <div className="relative">
          <select
            id="question-select"
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
          >
            <option value="" disabled>-- Choose a question --</option>
            {selectableQuestions.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {selectedQuestionId ? (
        analysisData ? (
          analysisData.type === 'unsupported' ? (
            <p className="text-center text-gray-500 py-8">
              Analysis is not supported for this question type. Please select a multiple choice, checkbox, or dropdown question.
            </p>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <ReactECharts option={getChartOption()} style={{ height: 400 }} />
            </div>
          )
        ) : (
          <p className="text-center text-gray-500 py-8">Select a question to see the analysis.</p>
        )
      ) : (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border">
            <p>Select a question from the dropdown to begin analysis.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;