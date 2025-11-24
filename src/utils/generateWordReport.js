import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  HeadingLevel, 
  AlignmentType, 
  ImageRun, 
  BorderStyle 
} from 'docx';
import { saveAs } from 'file-saver';

// --- Helpers ---

const getChartImage = async (labels, data) => {
  try {
    // simplified chart config to prevent URL length issues
    const shortLabels = labels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l);
    
    const chartConfig = {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          label: 'Count',
          data: data,
          backgroundColor: 'rgba(0, 90, 156, 0.6)',
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { yAxes: [{ ticks: { beginAtZero: true, precision: 0 } }] }
      }
    };
    
    const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300&bkg=white`;
    
    // Add a timeout to the fetch to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.warn("Chart generation failed or timed out", error);
    return null;
  }
};

const generateNarrative = (questionTitle, counts, total) => {
  if (total === 0) return "No data collected for this question.";
  
  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  const top = sorted[0];
  const topPct = ((top.count / total) * 100).toFixed(1);
  
  let text = `For the question "${questionTitle}", we received ${total} responses. `;
  
  if (parseFloat(topPct) > 50) {
    text += `The majority of respondents (${topPct}%) selected "${top.label}". This indicates a clear consensus. `;
  } else {
    text += `Opinions were mixed, with the most common choice being "${top.label}" (${topPct}%). `;
  }
  
  if (sorted.length > 1) {
    const second = sorted[1];
    const secondPct = ((second.count / total) * 100).toFixed(1);
    text += `The second most frequent response was "${second.label}" at ${secondPct}%. `;
  }
  
  text += "This distribution highlights the current trends within the ecosystem.";
  return text;
};

// --- Main Function ---

export const generateWordReport = async (submissions, questions) => {
  if (!submissions || submissions.length === 0) {
    alert("No submissions to export.");
    return;
  }

  const docChildren = [];

  // 1. Header / Title
  docChildren.push(
    new Paragraph({
      text: "OQI Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 }
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `This document contains a comprehensive analysis of ${submissions.length} submissions. It includes statistical breakdowns and qualitative feedback for each question evaluated.`,
      spacing: { after: 400 }
    })
  );

  // 2. Iterate Questions
  // Filter valid questions first
  const validQuestions = questions.filter(q => q && q.title);

  for (let i = 0; i < validQuestions.length; i++) {
    const q = validQuestions[i];
    
    // Section Title
    docChildren.push(
      new Paragraph({
        text: `${i + 1}. ${q.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    // Description
    if (q.description) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Context: ", bold: true }),
            new TextRun({ text: q.description, italics: true })
          ],
          spacing: { after: 200 }
        })
      );
    }

    // Process Data
    if (['radio', 'select', 'checkbox'].includes(q.type)) {
      const counts = {};
      const comments = [];
      let qTotal = 0;

      // Init counts
      (q.options || []).forEach(opt => { counts[opt.value] = { label: opt.label, count: 0 }; });

      // Tally
      submissions.forEach(sub => {
        const ansObj = sub.answers[q.id];
        if (ansObj) {
          if (ansObj.answer) {
            const vals = Array.isArray(ansObj.answer) ? ansObj.answer : [ansObj.answer];
            vals.forEach(v => {
              if (counts[v]) {
                counts[v].count++;
                qTotal++;
              } else {
                // Handle ad-hoc values
                 if (!counts[v]) counts[v] = { label: v, count: 1 };
                 else counts[v].count++;
                 qTotal++;
              }
            });
          }
          if (ansObj.comment) comments.push(ansObj.comment);
        }
      });

      // Narrative
      docChildren.push(
        new Paragraph({
          text: generateNarrative(q.title, counts, qTotal),
          spacing: { after: 200 }
        })
      );

      // Chart
      const labels = Object.values(counts).map(c => c.label || "?");
      const data = Object.values(counts).map(c => c.count);
      
      // Only try chart if we have data
      if (qTotal > 0) {
        const imgBuffer = await getChartImage(labels, data);
        if (imgBuffer) {
          docChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: 400, height: 250 }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            })
          );
        }
      }

      // Table
      const rows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Option", bold: true })], width: { size: 60, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "Count", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: "%", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          ]
        })
      ];

      Object.values(counts).forEach(c => {
        const pct = qTotal > 0 ? ((c.count / qTotal) * 100).toFixed(1) : "0.0";
        rows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(c.label || "")] }),
              new TableCell({ children: [new Paragraph(String(c.count))] }),
              new TableCell({ children: [new Paragraph(pct + "%")] }),
            ]
          })
        );
      });

      docChildren.push(
        new Table({
          rows: rows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
      
      // Comments
      if (comments.length > 0) {
        docChildren.push(new Paragraph({ text: "Comments:", heading: HeadingLevel.HEADING_3, spacing: { before: 100 } }));
        comments.forEach(c => {
          docChildren.push(new Paragraph({ text: `• ${c}` }));
        });
      }

    } else {
      // Text answers
      const texts = submissions.map(s => s.answers[q.id]?.answer).filter(Boolean);
      if (texts.length > 0) {
        docChildren.push(new Paragraph({ text: "Responses:", heading: HeadingLevel.HEADING_3 }));
        texts.slice(0, 10).forEach(t => {
          docChildren.push(new Paragraph({ text: `• ${t}` }));
        });
      } else {
        docChildren.push(new Paragraph({ text: "No responses recorded.", italics: true }));
      }
    }
  }

  // 3. Build & Save
  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "OQI_Report.docx");
};