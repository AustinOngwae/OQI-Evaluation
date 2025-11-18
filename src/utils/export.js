import Papa from 'papaparse';

export const exportSubmissionsToCsv = (submissions, questions) => {
  if (!submissions || submissions.length === 0) {
    alert('No submissions to export.');
    return;
  }

  // Sort questions by step to have a logical column order
  const sortedQuestions = [...questions].sort((a, b) => a.step_id - b.step_id || a.title.localeCompare(b.title));

  const headers = [
    'Submission Date',
    'First Name',
    'Last Name',
    'Job Title',
    'Organization',
    'Qualifications',
    'Location',
    ...sortedQuestions.flatMap(q => [`${q.title} (Answer)`, `${q.title} (Comment)`])
  ];

  const data = submissions.map(submission => {
    const row = {
      'Submission Date': new Date(submission.created_at).toLocaleString(),
      'First Name': submission.user_context?.firstName || '',
      'Last Name': submission.user_context?.lastName || '',
      'Job Title': submission.user_context?.jobTitle || '',
      'Organization': submission.user_context?.organization || '',
      'Qualifications': submission.user_context?.qualifications || '',
      'Location': submission.user_context?.location || '',
    };

    sortedQuestions.forEach(question => {
      const answerData = submission.answers[question.id];
      let answerDisplay = '';

      if (answerData && answerData.answer) {
        let answerValue = answerData.answer;
        if (Array.isArray(answerValue)) { // Checkbox
          const labels = answerValue.map(val => {
            const option = question.options?.find(opt => opt.value === val);
            return option ? option.label : val;
          });
          answerDisplay = labels.join('; ');
        } else if (question.type === 'radio' || question.type === 'select') {
          const option = question.options?.find(opt => opt.value === answerValue);
          answerDisplay = option ? option.label : answerValue;
        } else { // Text or other types
          answerDisplay = String(answerValue);
        }
      }

      row[`${question.title} (Answer)`] = answerDisplay;
      row[`${question.title} (Comment)`] = answerData?.comment || '';
    });

    return row;
  });

  const csv = Papa.unparse({
    fields: headers,
    data: data,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `oqi-submissions-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};