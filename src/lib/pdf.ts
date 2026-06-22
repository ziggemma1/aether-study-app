import html2pdf from 'html2pdf.js';
import { marked } from 'marked';

export const generateMaterialPDF = async (material: any) => {
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.fontFamily = 'Arial, sans-serif'; // Standard PDF fonts
  element.style.color = '#111827';
  element.classList.add('prose', 'max-w-none');

  // Configure marked for safe HTML
  const parsedSummary = await marked.parse(material.summary || '');
  
  let html = `
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 4px solid #7c3aed; padding-bottom: 20px;">
      <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 8px; color: #7c3aed; text-transform: uppercase;">${material.title}</h1>
      <p style="color: #6b7280; font-size: 14px; letter-spacing: 1px;">AETHER STUDY • GENERATED STUDY GUIDE • ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div style="margin-bottom: 40px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 16px;">I. AI Summary</h2>
      <div style="line-height: 1.7; color: #374151; font-size: 16px;">${parsedSummary}</div>
    </div>
  `;

  if (material.keyTopics && material.keyTopics.length > 0) {
    html += `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 16px;">II. Key Concepts</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${material.keyTopics.map((topic: string) => `
            <span style="background: #f3f4f6; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #4b5563; border: 1px solid #e5e7eb;">
              ${topic}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (material.realLifeApplications && material.realLifeApplications.length > 0) {
    html += `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 16px;">III. Real-World Context</h2>
        <ul style="padding-left: 20px; color: #374151;">
          ${material.realLifeApplications.map((app: string) => `<li style="margin-bottom: 12px; line-height: 1.6;">${app}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Add detailed notes if available
  if (material.noteSections && material.noteSections.length > 0) {
    html += `<div style="page-break-before: always;"></div>`;
    html += `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
        <h2 style="font-size: 28px; font-weight: 800; color: #7c3aed;">Detailed Academic Notes</h2>
      </div>
    `;
    
    for (const section of material.noteSections) {
      const parsedContent = await marked.parse(section.content || '');
      html += `
        <div style="margin-bottom: 50px; page-break-inside: avoid;">
          <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #111827; background: #f9fafb; padding: 10px; border-left: 4px solid #7c3aed;">
            ${section.heading}
          </h3>
          <div style="line-height: 1.7; color: #374151; font-size: 16px;">${parsedContent}</div>
        </div>
      `;
    }
  } else if (material.detailedNotes) {
     const formatXMLNotesForPDF = (xml: string): string => {
       if (!xml || !/<eli5>|<deep>|<concepts>/i.test(xml)) {
         return xml;
       }
       
       const eli5Match = xml.match(/<eli5>([\s\S]*?)<\/eli5>/i);
       const conceptsMatch = xml.match(/<concepts>([\s\S]*?)<\/concepts>/i);
       const deepMatch = xml.match(/<deep>([\s\S]*?)<\/deep>/i);
       const examplesMatch = xml.match(/<examples>([\s\S]*?)<\/examples>/i);
       const summaryMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/i);
       
       let markdown = "";
       if (eli5Match) {
         markdown += `### 👶 ELI5 (Simple Analogy)\n\n${eli5Match[1].trim()}\n\n`;
       }
       if (conceptsMatch) {
         markdown += `### 🔑 Key Vocabulary & Concepts\n\n${conceptsMatch[1].trim()}\n\n`;
       }
       if (deepMatch) {
         markdown += `### 🧠 Deep-Dive Explanation\n\n${deepMatch[1].trim()}\n\n`;
       }
       if (examplesMatch) {
         markdown += `### 💡 Practical Examples & Practice Problems\n\n${examplesMatch[1].trim()}\n\n`;
       }
       if (summaryMatch) {
         markdown += `### 📑 Summary & Takeaways\n\n${summaryMatch[1].trim()}\n\n`;
       }
       return markdown;
     };

     const formattedNotes = formatXMLNotesForPDF(material.detailedNotes);
     const parsedNotes = await marked.parse(formattedNotes);
     html += `<div style="page-break-before: always;"></div>`;
     html += `<h2 style="font-size: 26px; font-weight: 800; color: #7c3aed; margin-bottom: 24px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Detailed Study Notes</h2>`;
     html += `<div style="line-height: 1.8; color: #374151; font-size: 16px;">${parsedNotes}</div>`;
  }

  element.innerHTML = html;
  
  // Apply some global styles to the injected element
  const style = document.createElement('style');
  style.innerHTML = `
    .prose h1, .prose h2, .prose h3 { color: #111827; margin-top: 1.5em; margin-bottom: 0.5em; }
    .prose p { margin-bottom: 1em; }
    .prose ul, .prose ol { padding-left: 1.5em; margin-bottom: 1em; }
    .prose li { margin-bottom: 0.5em; }
    .prose code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
    .prose pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 1em; overflow-x: auto; }
    .prose blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; font-style: italic; color: #4b5563; }
  `;
  element.appendChild(style);

  const opt: any = {
    margin: 15,
    filename: `${material.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  return html2pdf().from(element).set(opt).save();
};
