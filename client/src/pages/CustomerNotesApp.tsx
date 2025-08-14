import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Download, Trash2, ChevronRight, HelpCircle } from "lucide-react";

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
  answer: string; // "Yes", "No", or "-"
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
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                  isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                  'border-gray-300 bg-white text-gray-500'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium 
                ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
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
              <CardTitle>Step 2: Review Filtered Notes ({filteredNotes.length} found)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Remove any notes you don't want to include in the Q&A analysis
              </p>
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
                <p className="text-sm text-gray-600">
                  {selectedNotes.length} of {filteredNotes.length} notes selected
                </p>
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
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('review')}
                >
                  Back to Notes
                </Button>
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
              <div className="flex gap-2">
                <Button onClick={generateCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={() => setCurrentStep('input')} variant="outline" size="sm">
                  Start Over
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Customer Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      {questions.map((question, i) => (
                        <React.Fragment key={i}>
                          <th className="border border-gray-300 px-4 py-2 text-left max-w-xs">
                            <div className="font-medium text-sm break-words">
                              {question}
                            </div>
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-left max-w-xs">
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
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Questions Asked:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {questions.map((question, i) => (
                    <li key={i} className="text-sm">{question}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}