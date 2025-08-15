import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Download, Trash2, ChevronRight, HelpCircle, Copy, AlertTriangle } from "lucide-react";

// Custom CSS for larger calendar popups
const calendarStyles = `
  .calendar-large::-webkit-calendar-picker-indicator {
    font-size: 20px;
    width: 24px;
    height: 24px;
    padding: 4px;
  }
  
  /* Increase calendar popup size - Webkit browsers */
  .calendar-large::-webkit-datetime-edit {
    font-size: 18px;
    line-height: 1.5;
  }
  
  /* Firefox calendar styling */
  .calendar-large {
    font-size: 18px !important;
  }
  
  /* General date input styling for larger calendar */
  input[type="month"].calendar-large {
    font-size: 18px;
    line-height: 1.5;
    min-height: 48px;
    padding: 12px;
  }
`;

// Data Models (matching backend)
interface CustomerNote {
  CustomerName: string;
  ProductManagerName: string;
  NoteID: string;  // Changed to string to handle Salesforce IDs
  Date: string;
  Subject: string;
  NoteContent: string;
  CleanedNoteContent: string;
}

interface DateRange {
  startMonth: string;
  endMonth: string;
}

interface QAAnswer {
  answer: string; // "Yes", "No", "Maybe", or "-"
  evidence: string[];
}

interface QAResult {
  noteId: string;  // Changed to string to handle Salesforce IDs
  customerName: string;
  pmAuthor: string;
  date: string;
  answers: QAAnswer[];
}

type AppStep = 'input' | 'notes' | 'review' | 'questions' | 'results';

export function CustomerNotesApp() {
  // Step management
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // Step 1: Input data
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Step 2-5: Notes data
  const [rawNotes, setRawNotes] = useState<CustomerNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<CustomerNote[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<CustomerNote[]>([]);
  const [showNotesCount, setShowNotesCount] = useState(false);

  // Step 6-7: Questions and results
  const [questionsText, setQuestionsText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [qaResults, setQAResults] = useState<QAResult[]>([]);

  // Fetch PM names on component mount
  React.useEffect(() => {
    const fetchPMNames = async () => {
      try {
        const response = await fetch('/api/notes/pm-names');
        if (response.ok) {
          const names = await response.json();
          setAvailableNames(names);
        }
      } catch (error) {
        console.error('Error fetching PM names:', error);
      }
    };
    
    fetchPMNames();
  }, []);

  // API calls
  const fetchNotes = async () => {
    setLoading(true);
    setProgressStatus('Fetching customer notes from database...');
    
    try {
      // Use real data endpoint (falls back gracefully if no data)
      const response = await fetch('/api/notes/fetch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: selectedNames,
          dateRange: { startMonth, endMonth },
          projectDescription
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setRawNotes(data);
      setShowNotesCount(true);
      
      if (data.length === 0) {
        setProgressStatus('');
        setLoading(false);
        return;
      }
      
      setProgressStatus(`Found ${data.length} notes. Processing content...`);
      
      // Show the count for a moment before continuing to filter
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Transform HTML to text
      setProgressStatus(`Converting HTML content to text...`);
      const transformResponse = await fetch('/api/notes/transform-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!transformResponse.ok) throw new Error('Failed to transform notes');
      const transformedData = await transformResponse.json();
      
      // Filter for relevance with progress tracking
      setProgressStatus(`Analyzing relevance: processing note 1 of ${transformedData.length}...`);
      
      const filteredData = [];
      for (let i = 0; i < transformedData.length; i++) {
        const note = transformedData[i];
        setProgressStatus(`Analyzing relevance: processing note ${i + 1} of ${transformedData.length}...`);
        
        try {
          const filterResponse = await fetch('/api/notes/filter-relevance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notes: [note], // Process one note at a time
              projectDescription
            })
          });
          
          if (filterResponse.ok) {
            const result = await filterResponse.json();
            if (result.length > 0) {
              filteredData.push(result[0]);
            }
          }
        } catch (noteError) {
          console.warn(`Error processing note ${i + 1}:`, noteError);
          // Continue with other notes even if one fails
        }
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setProgressStatus('Finalizing results...');
      setFilteredNotes(filteredData);
      setSelectedNotes(filteredData);
      setCurrentStep('review');
      
    } catch (error) {
      console.error('Error processing notes:', error);
      alert('Error processing notes. Please try again.');
    } finally {
      setLoading(false);
      setProgressStatus('');
    }
  };

  const processQuestions = async () => {
    if (!questionsText.trim()) return;
    
    const questionList = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    setQuestions(questionList);
    setLoading(true);
    
    const totalOperations = selectedNotes.length * questionList.length;
    let currentOperation = 0;
    
    try {
      setProgressStatus(`Processing Q&A: 0 of ${totalOperations} question-note pairs...`);
      
      const results = [];
      
      for (let noteIndex = 0; noteIndex < selectedNotes.length; noteIndex++) {
        const note = selectedNotes[noteIndex];
        const answers = [];
        
        for (let questionIndex = 0; questionIndex < questionList.length; questionIndex++) {
          const question = questionList[questionIndex];
          currentOperation++;
          
          setProgressStatus(`Processing Q&A: ${currentOperation} of ${totalOperations} (Note ${noteIndex + 1}/${selectedNotes.length}, Question ${questionIndex + 1}/${questionList.length})...`);
          
          try {
            const response = await fetch('/api/notes/answer-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: [note],
                questions: [question]
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.length > 0 && result[0].answers.length > 0) {
                answers.push(result[0].answers[0]);
              } else {
                answers.push({ answer: '-', evidence: [] });
              }
            } else {
              answers.push({ answer: '-', evidence: [] });
            }
          } catch (questionError) {
            console.warn(`Error processing question ${questionIndex + 1} for note ${noteIndex + 1}:`, questionError);
            answers.push({ answer: '-', evidence: [] });
          }
          
          // Small delay to allow UI updates
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        results.push({
          noteId: note.NoteID,
          customerName: note.CustomerName,
          pmAuthor: note.ProductManagerName,
          date: note.Date,
          answers: answers
        });
      }
      
      setProgressStatus('Finalizing Q&A results...');
      setQAResults(results);
      setCurrentStep('results');
      
    } catch (error) {
      console.error('Error processing questions:', error);
      alert('Error processing questions. Please try again.');
    } finally {
      setLoading(false);
      setProgressStatus('');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.find(n => n.NoteID === noteId)
        ? prev.filter(n => n.NoteID !== noteId)
        : [...prev, filteredNotes.find(n => n.NoteID === noteId)!]
    );
  };

  const calculateSummaryStats = () => {
    if (qaResults.length === 0 || questions.length === 0) return [];
    
    return questions.map((_, questionIndex) => {
      const answers = qaResults.map(result => result.answers[questionIndex]?.answer || '-');
      const total = answers.length;
      
      const counts = {
        Yes: answers.filter(a => a === 'Yes').length,
        No: answers.filter(a => a === 'No').length,
        Maybe: answers.filter(a => a === 'Maybe').length,
        '-': answers.filter(a => a === '-').length
      };
      
      const percentages = {
        Yes: total > 0 ? ((counts.Yes / total) * 100).toFixed(1) : '0.0',
        No: total > 0 ? ((counts.No / total) * 100).toFixed(1) : '0.0',
        Maybe: total > 0 ? ((counts.Maybe / total) * 100).toFixed(1) : '0.0',
        '-': total > 0 ? ((counts['-'] / total) * 100).toFixed(1) : '0.0'
      };
      
      return { counts, percentages, total };
    });
  };

  const generateCSV = () => {
    if (qaResults.length === 0) return;
    
    const headers = ['Customer Name', 'PM Author', 'Date'];
    questions.forEach((question, i) => {
      headers.push(question, `Evidence: ${question}`);
    });
    
    const rows = qaResults.map(result => {
      const row = [result.customerName, result.pmAuthor, result.date];
      result.answers.forEach(answer => {
        row.push(answer.answer);
        row.push(answer.evidence.map(e => `"${e}"`).join(' | '));
      });
      return row;
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-notes-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToGoogleSheets = async () => {
    if (qaResults.length === 0) return;
    
    const headers = ['Customer Name', 'PM Author', 'Date'];
    questions.forEach((question, i) => {
      headers.push(question, `Evidence: ${question}`);
    });
    
    const rows = qaResults.map(result => {
      const row = [result.customerName, result.pmAuthor, result.date];
      result.answers.forEach(answer => {
        row.push(answer.answer);
        row.push(answer.evidence.join(' | '));
      });
      return row;
    });
    
    const allRows = [headers, ...rows];
    const tsvContent = allRows
      .map(row => row.join('\t'))
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(tsvContent);
      alert('Table copied to clipboard! You can now paste it into Google Sheets.');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try the CSV download instead.');
    }
  };

  const downloadHTML = () => {
    if (qaResults.length === 0) return;
    
    const summaryStats = calculateSummaryStats();
    
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Customer Notes Q&A Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background-color: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .summary h3 { margin-top: 0; }
        .question-summary { border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 12px; }
        .stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; }
        .stat-yes { color: #166534; }
        .stat-no { color: #991b1b; }
        .stat-maybe { color: #a16207; }
        .stat-na { color: #6b7280; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .answer-yes { background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; }
        .answer-no { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; }
        .answer-maybe { background-color: #fef3c7; color: #a16207; padding: 4px 8px; border-radius: 4px; }
        .answer-na { background-color: #f3f4f6; color: #6b7280; padding: 4px 8px; border-radius: 4px; }
        .evidence { font-size: 12px; }
    </style>
</head>
<body>
    <h1>Customer Notes Q&A Results</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    
    <div class="summary">
        <h3>Results Summary (${qaResults.length} notes analyzed):</h3>`;
    
    questions.forEach((question, i) => {
      const stats = summaryStats[i];
      if (stats) {
        htmlContent += `
        <div class="question-summary">
            <div style="font-weight: bold; margin-bottom: 4px;">${question}</div>
            <div class="stats">
                <span class="stat-yes"><strong>Yes:</strong> ${stats.counts.Yes} (${stats.percentages.Yes}%)</span>
                <span class="stat-no"><strong>No:</strong> ${stats.counts.No} (${stats.percentages.No}%)</span>
                <span class="stat-maybe"><strong>Maybe:</strong> ${stats.counts.Maybe} (${stats.percentages.Maybe}%)</span>
                <span class="stat-na"><strong>N/A:</strong> ${stats.counts['-']} (${stats.percentages['-']}%)</span>
            </div>
        </div>`;
      }
    });
    
    htmlContent += `
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Customer Name</th>
                <th>PM Author</th>
                <th>Date</th>`;
    
    questions.forEach((question, i) => {
      htmlContent += `
                <th>${question}</th>
                <th>Evidence: ${question}</th>`;
    });
    
    htmlContent += `
            </tr>
        </thead>
        <tbody>`;
    
    qaResults.forEach((result, rowIndex) => {
      htmlContent += `
            <tr>
                <td>${result.customerName}</td>
                <td>${result.pmAuthor}</td>
                <td>${result.date}</td>`;
      
      result.answers.forEach((answer, i) => {
        const answerClass = answer.answer === 'Yes' ? 'answer-yes' :
                           answer.answer === 'No' ? 'answer-no' :
                           answer.answer === 'Maybe' ? 'answer-maybe' : 'answer-na';
        
        htmlContent += `
                <td><span class="${answerClass}">${answer.answer}</span></td>
                <td class="evidence">`;
        
        answer.evidence.forEach(evidence => {
          htmlContent += `• "${evidence}"<br>`;
        });
        
        htmlContent += `</td>`;
      });
      
      htmlContent += `
            </tr>`;
    });
    
    htmlContent += `
        </tbody>
    </table>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-notes-analysis.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canNavigateToStep = (stepKey: AppStep): boolean => {
    const stepOrder: AppStep[] = ['input', 'review', 'questions', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(stepKey);
    
    // Can always go back to previous steps
    if (targetIndex <= currentIndex) return true;
    
    // Can go forward only if we have the required data
    switch (stepKey) {
      case 'review':
        return rawNotes.length > 0;
      case 'questions':
        return selectedNotes.length > 0;
      case 'results':
        return qaResults.length > 0;
      default:
        return false;
    }
  };

  const navigateToStep = (stepKey: AppStep) => {
    if (canNavigateToStep(stepKey)) {
      setCurrentStep(stepKey);
      // Reset progress and count display when going back to input
      if (stepKey === 'input') {
        setShowNotesCount(false);
        setProgressStatus('');
      }
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'input', label: 'Input', icon: FileText },
      { key: 'review', label: 'Review Notes', icon: Search },
      { key: 'questions', label: 'Questions', icon: HelpCircle },
      { key: 'results', label: 'Results', icon: Download }
    ];
    
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
          const canNavigate = canNavigateToStep(step.key as AppStep);
          
          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => navigateToStep(step.key as AppStep)}
                disabled={!canNavigate}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white hover:bg-green-600' : 
                    canNavigate ? 'border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50' :
                    'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateToStep(step.key as AppStep)}
                disabled={!canNavigate}
                className={`ml-2 text-sm font-medium transition-colors
                  ${isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600 hover:text-green-700' : 
                    canNavigate ? 'text-gray-500 hover:text-gray-700' :
                    'text-gray-400 cursor-not-allowed'}`}
              >
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 mx-4 text-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Inject custom CSS for larger calendar popups */}
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Customer Notes Q&A
          </h1>
          <p className="text-xl text-muted-foreground">
            Ask yes/no questions over your customer notes using AI analysis
          </p>
        </div>

        {/* Tutorial Overview */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                ?
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>1. Select:</strong> Choose Product Managers and date range</p>
                  <p><strong>2. Review:</strong> We'll find and filter relevant customer notes</p>
                  <p><strong>3. Ask:</strong> Write yes/no questions about your notes</p>
                  <p><strong>4. Analyze:</strong> AI analyzes each note with evidence-based answers</p>
                  <p className="text-xs text-blue-600 mt-2">💡 Your results are not saved - export them when done!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderStepIndicator()}

        {/* Step 1: Input Collection */}
        {currentStep === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Enter Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Product Managers ({selectedNames.length} selected)</label>
                <div className="space-y-2">
                  {/* Selected names display */}
                  {selectedNames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedNames.map((name, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                          {name}
                          <button
                            onClick={() => setSelectedNames(prev => prev.filter(n => n !== name))}
                            className="hover:text-blue-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Searchable input for names */}
                  <div className="relative">
                    <input
                      type="text"
                      value={nameSearchTerm}
                      onChange={(e) => setNameSearchTerm(e.target.value)}
                      placeholder="Type to search Product Managers..."
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown suggestions */}
                    {nameSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {availableNames
                          .filter(name => 
                            !selectedNames.includes(name) && 
                            name.toLowerCase().includes(nameSearchTerm.toLowerCase())
                          )
                          .slice(0, 10) // Limit to 10 suggestions
                          .map((name, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setSelectedNames(prev => [...prev, name]);
                                setNameSearchTerm(""); // Clear search after selection
                              }}
                              className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              {name}
                            </div>
                          ))
                        }
                        {availableNames
                          .filter(name => 
                            !selectedNames.includes(name) && 
                            name.toLowerCase().includes(nameSearchTerm.toLowerCase())
                          ).length === 0 && (
                          <div className="p-2 text-gray-500 text-sm">
                            No matching Product Managers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedNames.length === 0 && (
                    <p className="text-sm text-red-600">At least one Product Manager must be selected</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Month</label>
                  <Input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="text-lg p-3 h-12 calendar-large"
                    style={{
                      fontSize: '18px',
                      padding: '12px',
                      minHeight: '48px'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Month</label>
                  <Input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="text-lg p-3 h-12 calendar-large"
                    style={{
                      fontSize: '18px',
                      padding: '12px',
                      minHeight: '48px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Description</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project to help filter relevant notes..."
                />
              </div>

              {showNotesCount && rawNotes.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Found {rawNotes.length} customer notes
                      </p>
                      <p className="text-sm text-blue-700">
                        For {selectedNames.join(', ')} from {startMonth} to {endMonth}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Now filtering for relevance to your project...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showNotesCount && rawNotes.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">
                        No customer notes found
                      </p>
                      <p className="text-sm text-yellow-700">
                        For {selectedNames.join(', ')} from {startMonth} to {endMonth}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Try adjusting your name or date range and search again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={fetchNotes}
                disabled={selectedNames.length === 0 || !startMonth || !endMonth || !projectDescription || loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">{progressStatus || 'Processing...'}</span>
                  </div>
                ) : 'Fetch & Process Notes'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Notes */}
        {currentStep === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Review Filtered Notes</CardTitle>
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Found {rawNotes.length} total notes for {selectedNames.join(', ')} ({startMonth} to {endMonth})
                  </span>
                  <span className="text-blue-600 font-medium">
                    → {filteredNotes.length} relevant to your project
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Remove any notes you don't want to include in the Q&A analysis
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {filteredNotes.map((note) => (
                  <div
                    key={note.NoteID}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedNotes.find(n => n.NoteID === note.NoteID)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleNoteSelection(note.NoteID)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{note.CustomerName}</span>
                          <span className="text-sm text-gray-500">{note.Date}</span>
                        </div>
                        <h4 className="font-medium mb-2">{note.Subject}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {note.CleanedNoteContent.slice(0, 280)}
                          {note.CleanedNoteContent.length > 280 && '...'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNoteSelection(note.NoteID);
                        }}
                      >
                        {selectedNotes.find(n => n.NoteID === note.NoteID) ? (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        ) : (
                          '+ Add'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('input')}
                  >
                    ← Edit Input
                  </Button>
                  <p className="text-sm text-gray-600 self-center">
                    {selectedNotes.length} of {filteredNotes.length} notes selected
                  </p>
                </div>
                <Button
                  onClick={() => setCurrentStep('questions')}
                  disabled={selectedNotes.length === 0}
                >
                  Continue with {selectedNotes.length} notes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions Input */}
        {currentStep === 'questions' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Enter Your Yes/No Questions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter one question per line. Each will be answered for all {selectedNotes.length} selected notes.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Questions</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  placeholder={`Did the customer request a pilot?
Is pricing a blocker?
Are they interested in our new features?`}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('input')}
                  >
                    ← Edit Input
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('review')}
                  >
                    ← Edit Notes
                  </Button>
                </div>
                <Button
                  onClick={processQuestions}
                  disabled={!questionsText.trim() || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm">{progressStatus || 'Processing...'}</span>
                    </div>
                  ) : 'Process Questions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Results</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generateCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={copyToGoogleSheets} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy for Google Sheets
                </Button>
                <Button onClick={downloadHTML} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
                <Button onClick={() => setCurrentStep('input')} variant="outline" size="sm">
                  ← Edit Input
                </Button>
                <Button onClick={() => setCurrentStep('review')} variant="outline" size="sm">
                  ← Edit Notes
                </Button>
                <Button onClick={() => setCurrentStep('questions')} variant="outline" size="sm">
                  ← Edit Questions
                </Button>
                <Button onClick={() => setCurrentStep('input')} variant="destructive" size="sm">
                  Start Over
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Statistics */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3">Results Summary ({qaResults.length} notes analyzed):</h4>
                <div className="space-y-3">
                  {questions.map((question, i) => {
                    const stats = calculateSummaryStats()[i];
                    if (!stats) return null;
                    return (
                      <div key={i} className="border-l-4 border-blue-400 pl-3">
                        <div className="font-medium text-sm mb-1">{question}</div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-green-700">
                            <strong>Yes:</strong> {stats.counts.Yes} ({stats.percentages.Yes}%)
                          </span>
                          <span className="text-red-700">
                            <strong>No:</strong> {stats.counts.No} ({stats.percentages.No}%)
                          </span>
                          <span className="text-yellow-700">
                            <strong>Maybe:</strong> {stats.counts.Maybe} ({stats.percentages.Maybe}%)
                          </span>
                          <span className="text-gray-600">
                            <strong>N/A:</strong> {stats.counts['-']} ({stats.percentages['-']}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Reminder */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> Your results are not automatically saved. 
                    Please use the download buttons above to save your analysis before leaving this page.
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[75vh]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-2 text-left w-32 max-w-32 sticky top-0 bg-gray-50">
                        <div className="font-medium text-sm break-words">
                          Customer Name
                        </div>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left sticky top-0 bg-gray-50">
                        <div className="font-medium text-sm break-words">
                          PM Author
                        </div>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left sticky top-0 bg-gray-50">
                        <div className="font-medium text-sm break-words">
                          Date
                        </div>
                      </th>
                      {questions.map((question, i) => (
                        <React.Fragment key={i}>
                          <th className="border border-gray-300 px-2 py-2 text-left w-32 sticky top-0 bg-gray-50">
                            <div className="font-medium text-xs break-words whitespace-normal leading-tight">
                              {question}
                            </div>
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left max-w-xs sticky top-0 bg-gray-50">
                            <div className="font-medium text-sm break-words">
                              Evidence: {question}
                            </div>
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {qaResults.map((result, rowIndex) => (
                      <tr key={result.noteId} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 py-2 w-32 max-w-32">
                          <div className="text-sm break-words">{result.customerName}</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{result.pmAuthor || 'Unknown'}</td>
                        <td className="border border-gray-300 px-4 py-2">{result.date}</td>
                        {result.answers.map((answer, i) => (
                          <React.Fragment key={i}>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                answer.answer === 'Yes' ? 'bg-green-100 text-green-800' :
                                answer.answer === 'No' ? 'bg-red-100 text-red-800' :
                                answer.answer === 'Maybe' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {answer.answer}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="max-w-xs">
                                {answer.evidence.map((evidence, j) => (
                                  <div key={j} className="text-sm mb-1">
                                    • "{evidence}"
                                  </div>
                                ))}
                              </div>
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}