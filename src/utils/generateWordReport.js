import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export const generateWordReport = async (submissions, questions) => {
  if (!submissions || submissions.length === 0) {
    alert('No submissions to export.');
    return;
  }

  // Filter out potential "dummy" questions (e.g., empty titles) and sort
  const validQuestions = questions
    .filter(q => q.title && q.title.trim() !== '')
    .sort((a, b) => a.step_id - b.step_id || a.title.localeCompare(b.title));

  const totalSubmissions = submissions.length;
  const dateStr = new Date().toLocaleDateString();

  // 1. Title Section
  const titleSection = [
    new Paragraph({
      text: "OQI Questionnaire Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Generated on: ", bold: true }),
        new TextRun(dateStr),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total Submissions: ", bold: true }),
        new TextRun(String(totalSubmissions)),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: "This document provides an analysis of the responses collected via the Open Quantum Institute (OQI) questionnaire. The following sections detail the distribution of answers for each question along with qualitative feedback provided by respondents.",
      spacing: { after: 400 },
    }),
  ];

  // 2. Question Analysis Sections
  const questionSections = [];

  validQuestions.forEach((question, index) => {
    // Only analyze questions with options (radio, select, checkbox) or text
    // For this report, we focus on all, but provide stats for structured ones.
    
    questionSections.push(
      new Paragraph({
        text: `${index + 1}. ${question.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    if (question.description) {
      questionSections.push(
        new Paragraph({
          text: question.description,
          style: "Intense Quote", // Using a built-in style or italic
          italics: true,
          spacing: { after: 200 },
        })
      );
    }

    // Calculate Stats if applicable
    if (['radio', 'select', 'checkbox'].includes(question.type)) {
      const counts = {};
      const comments = [];
      
      // Initialize counts
      (question.options || []).forEach(opt => {
        counts[opt.value] = { label: opt.label, count: 0 };
      });

      // Aggregate data
      submissions.forEach(sub => {
        const answerData = sub.answers[question.id];
        if (answerData) {
          // Count answers
          if (answerData.answer) {
            const vals = Array.isArray(answerData.answer) ? answerData.answer : [answerData.answer];
            vals.forEach(val => {
              if (counts[val]) counts[val].count++;
              else {
                // Handle case where value might not be in options (though unlikely with strict schema)
                if (!counts[val]) counts[val] = { label: val, count: 1 };
                else counts[val].count++;
              }
            });
          }
          // Collect comments
          if (answerData.comment) {
            comments.push(answerData.comment);
          }
        }
      });

      // Create Data Table
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Option", bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Count", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Percentage", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          ],
          tableHeader: true,
        }),
      ];

      Object.values(counts).forEach(item => {
        const percentage = totalSubmissions > 0 ? ((item.count / totalSubmissions) * 100).toFixed(1) + '%' : '0%';
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.label || "Unknown")] }),
              new TableCell({ children: [new Paragraph(String(item.count))] }),
              new TableCell({ children: [new Paragraph(percentage)] }),
            ],
          })
        );
      });

      questionSections.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      // Comments Section
      if (comments.length > 0) {
        questionSections.push(
          new Paragraph({
            text: "Comments:",
            bold: true,
            spacing: { before: 200, after: 100 },
          })
        );
        comments.forEach(comment => {
          questionSections.push(
            new Paragraph({
              text: `• "${comment}"`,
              spacing: { after: 50 },
            })
          );
        });
      }

    } else {
      // Text questions or others
      questionSections.push(
        new Paragraph({
          text: "Free text responses are available in the CSV export.",
          italics: true,
        })
      );
      
      // Collect text answers
      const textAnswers = submissions
        .map(s => s.answers[question.id]?.answer)
        .filter(a => a);
        
      if (textAnswers.length > 0) {
         questionSections.push(
          new Paragraph({
            text: `Received ${textAnswers.length} responses. Sample:`,
            spacing: { before: 100 },
          })
        );
        // Show up to 5 samples
        textAnswers.slice(0, 5).forEach(ans => {
             questionSections.push(
            new Paragraph({
              text: `• "${ans}"`,
              spacing: { after: 50 },
            })
          );
        })
      }
    }
    
    // Add spacing after each question block
    questionSections.push(new Paragraph({ text: "", spacing: { after: 400 } }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...titleSection,
          ...questionSections,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `OQI_Analysis_Report_${new Date().toISOString().split('T')[0]}.docx`);
};