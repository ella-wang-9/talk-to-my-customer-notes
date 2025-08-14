import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Download, Trash2, ChevronRight, HelpCircle, Copy, AlertTriangle } from "lucide-react";

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
  date: string;
  answers: QAAnswer[];
}

type AppStep = 'input' | 'notes' | 'review' | 'questions' | 'results';

export function CustomerNotesApp() {
  // Step management
  const [currentStep, setCurrentStep] = useState<AppStep>('input');
  const [loading, setLoading] = useState(false);

  // Step 1: Input data
  const [name, setName] = useState("");
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

  // API calls
  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Use real data endpoint (falls back gracefully if no data)
      const response = await fetch('/api/notes/fetch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          dateRange: { startMonth, endMonth },
          projectDescription
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setRawNotes(data);
      setShowNotesCount(true);
      
      // Show the count for a moment before continuing to filter
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Transform HTML to text
      const transformResponse = await fetch('/api/notes/transform-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!transformResponse.ok) throw new Error('Failed to transform notes');
      const transformedData = await transformResponse.json();
      
      // Filter for relevance
      const filterResponse = await fetch('/api/notes/filter-relevance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: transformedData,
          projectDescription
        })
      });
      
      if (!filterResponse.ok) throw new Error('Failed to filter notes');
      const filteredData = await filterResponse.json();
      setFilteredNotes(filteredData);
      setSelectedNotes(filteredData);
      setCurrentStep('review');
      
    } catch (error) {
      console.error('Error processing notes:', error);
      alert('Error processing notes. Please try again.');
    } finally {
      setLoading(false);
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
    
    try {
      const response = await fetch('/api/notes/answer-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: selectedNotes,
          questions: questionList
        })
      });
      
      if (!response.ok) throw new Error('Failed to process questions');
      const results = await response.json();
      setQAResults(results);
      setCurrentStep('results');
      
    } catch (error) {
      console.error('Error processing questions:', error);
      alert('Error processing questions. Please try again.');
    } finally {
      setLoading(false);
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
    
    const headers = ['Customer Name', 'Date'];
    questions.forEach((question, i) => {
      headers.push(question, `Evidence: ${question}`);
    });
    
    const rows = qaResults.map(result => {
      const row = [result.customerName, result.date];
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
    
    const headers = ['Customer Name', 'Date'];
    questions.forEach((question, i) => {
      headers.push(question, `Evidence: ${question}`);
    });
    
    const rows = qaResults.map(result => {
      const row = [result.customerName, result.date];
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
      // Reset count display when going back to input
      if (stepKey === 'input') {
        setShowNotesCount(false);
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

        {renderStepIndicator()}

        {/* Step 1: Input Collection */}
        {currentStep === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Enter Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Month</label>
                  <Input
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Month</label>
                  <Input
                    type="month"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
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
                        For "{name}" from {startMonth} to {endMonth}
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
                        For "{name}" from {startMonth} to {endMonth}
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
                disabled={!name || !startMonth || !endMonth || !projectDescription || loading}
                className="w-full"
              >
                {loading ? <Skeleton className="h-4 w-20" /> : 'Fetch & Process Notes'}
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
                    Found {rawNotes.length} total notes for "{name}" ({startMonth} to {endMonth})
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
                  {loading ? <Skeleton className="h-4 w-32" /> : 'Process Questions'}
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

              <div className="overflow-x-auto max-h-[800px]">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left sticky top-0 bg-gray-50">
                        <div className="font-medium text-sm break-words">
                          Customer Name
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
                        <td className="border border-gray-300 px-4 py-2">{result.customerName}</td>
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