
import React, { useState, useRef, useEffect } from 'react';
import { Send, Play, Download, Slack, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { GeminiService } from './GeminiIntegration';

interface Message {
  id: string;
  type: 'user' | 'system' | 'ai-analysis' | 'test-result' | 'ai-summary';
  content: string;
  timestamp: Date;
  testCases?: string[];
  status?: 'success' | 'failure' | 'running' | 'analyzing';
  confidence?: number;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  className: string;
  methodName: string;
  keywords: string[];
}

interface EnhancedChatInterfaceProps {
  userRole: 'admin' | 'tester';
  geminiApiKey?: string;
}

const EnhancedChatInterface = ({ userRole, geminiApiKey }: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '🤖 Welcome to Commusoft Automation Script by Karna! I can understand natural language commands like "run customer creation and login test" or "verify job edit and deletion flow". Type your request and I\'ll map it to the appropriate test cases.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [testCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'Create Customer',
      description: 'Creates a new customer in Commusoft',
      className: 'CustomerTests',
      methodName: 'createCustomer',
      keywords: ['create', 'customer', 'new customer', 'add customer', 'customer creation']
    },
    {
      id: '2',
      name: 'Update Customer',
      description: 'Updates existing customer information',
      className: 'CustomerTests',
      methodName: 'updateCustomer',
      keywords: ['update', 'customer', 'edit customer', 'modify customer', 'customer edit']
    },
    {
      id: '3',
      name: 'Delete Customer',
      description: 'Deletes a customer from the system',
      className: 'CustomerTests',
      methodName: 'deleteCustomer',
      keywords: ['delete', 'customer', 'remove customer', 'customer deletion']
    },
    {
      id: '4',
      name: 'Login Test',
      description: 'Tests user login functionality',
      className: 'LoginTests',
      methodName: 'login',
      keywords: ['login', 'sign in', 'authentication', 'auth']
    },
    {
      id: '5',
      name: 'Create Job',
      description: 'Creates a new job in Commusoft',
      className: 'JobTests',
      methodName: 'createJob',
      keywords: ['create', 'job', 'new job', 'add job', 'job creation']
    },
    {
      id: '6',
      name: 'Edit Job',
      description: 'Edits an existing job',
      className: 'JobTests',
      methodName: 'editJob',
      keywords: ['edit', 'job', 'update job', 'modify job', 'job edit']
    },
    {
      id: '7',
      name: 'Delete Job',
      description: 'Deletes a job from the system',
      className: 'JobTests',
      methodName: 'deleteJob',
      keywords: ['delete', 'job', 'remove job', 'job deletion']
    }
  ]);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (geminiApiKey) {
      setGeminiService(new GeminiService(geminiApiKey));
    }
  }, [geminiApiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    
    const lowercaseInput = input.toLowerCase();
    const suggestions = [
      'run customer creation and login test',
      'verify job edit and deletion flow',
      'test customer update and job creation',
      'execute login and customer deletion',
      'run all customer tests',
      'test job workflow',
      ...testCases
        .filter(testCase => 
          testCase.keywords.some(keyword => keyword.includes(lowercaseInput)) ||
          testCase.name.toLowerCase().includes(lowercaseInput)
        )
        .map(testCase => testCase.name)
    ].slice(0, 5);
    
    return suggestions;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0 && value.length > 0);
  };

  const executeTestSequence = async (testMethods: string[]): Promise<void> => {
    const testResults = [];

    for (const testMethod of testMethods) {
      const runningMessage: Message = {
        id: `${Date.now()}-${testMethod}`,
        type: 'test-result',
        content: `🔄 Running: ${testMethod}...`,
        timestamp: new Date(),
        status: 'running'
      };

      setMessages(prev => [...prev, runningMessage]);

      // Simulate test execution
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const success = Math.random() > 0.3;
        const result = {
          testName: testMethod,
          status: success ? 'success' : 'failure',
          error: success ? null : 'Element not found: #test-element'
        };
        
        testResults.push(result);

        const resultMessage: Message = {
          id: `${Date.now()}-result-${testMethod}`,
          type: 'test-result',
          content: success 
            ? `✅ ${testMethod} completed successfully!`
            : `❌ ${testMethod} failed: ${result.error}`,
          timestamp: new Date(),
          status: success ? 'success' : 'failure'
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== runningMessage.id),
          resultMessage
        ]);

      } catch (error) {
        testResults.push({
          testName: testMethod,
          status: 'failure',
          error: `Execution error: ${error}`
        });
      }
    }

    // Generate AI summary if Gemini is available
    if (geminiService && testResults.length > 0) {
      const summaryMessage: Message = {
        id: `${Date.now()}-summary`,
        type: 'ai-summary',
        content: '🤖 Generating test summary...',
        timestamp: new Date(),
        status: 'analyzing'
      };

      setMessages(prev => [...prev, summaryMessage]);

      try {
        const aiSummary = await geminiService.generateTestSummary(testResults);
        
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== summaryMessage.id),
          {
            ...summaryMessage,
            content: aiSummary,
            status: 'success'
          }
        ]);

        // Post to Slack if admin and configured
        if (userRole === 'admin') {
          // Simulate Slack posting
          toast({
            title: "Results Posted to Slack",
            description: "Test summary has been posted to the configured Slack channel."
          });
        }

      } catch (error) {
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== summaryMessage.id),
          {
            ...summaryMessage,
            content: `❌ Failed to generate AI summary: ${error}`,
            status: 'failure'
          }
        ]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setShowSuggestions(false);

    // AI Analysis Phase
    if (geminiService) {
      const analysisMessage: Message = {
        id: `${Date.now()}-analysis`,
        type: 'ai-analysis',
        content: '🧠 Analyzing your request with Gemini AI...',
        timestamp: new Date(),
        status: 'analyzing'
      };

      setMessages(prev => [...prev, analysisMessage]);

      try {
        const geminiResponse = await geminiService.parseUserIntent(inputValue, testCases);
        
        const analysisResult: Message = {
          id: `${Date.now()}-analysis-result`,
          type: 'ai-analysis',
          content: `🎯 **AI Analysis Results:**\n\n${geminiResponse.reasoning}\n\n**Mapped Tests:** ${geminiResponse.mappedTests.join(', ')}\n\n**Confidence:** ${(geminiResponse.confidence * 100).toFixed(1)}%`,
          timestamp: new Date(),
          testCases: geminiResponse.mappedTests,
          confidence: geminiResponse.confidence,
          status: 'success'
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== analysisMessage.id),
          analysisResult
        ]);

        // Execute the mapped tests
        if (geminiResponse.mappedTests.length > 0) {
          await executeTestSequence(geminiResponse.mappedTests);
        } else {
          const noMatchMessage: Message = {
            id: `${Date.now()}-no-match`,
            type: 'system',
            content: `I couldn't find matching test cases for "${inputValue}". Available test methods include: ${testCases.map(tc => tc.name).join(', ')}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, noMatchMessage]);
        }

      } catch (error) {
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== analysisMessage.id),
          {
            id: `${Date.now()}-error`,
            type: 'system',
            content: `❌ AI Analysis failed: ${error}. Falling back to keyword matching...`,
            timestamp: new Date()
          }
        ]);

        // Fallback to simple keyword matching
        const matchingTests = testCases.filter(testCase => 
          testCase.keywords.some(keyword => inputValue.toLowerCase().includes(keyword))
        );

        if (matchingTests.length > 0) {
          await executeTestSequence(matchingTests.map(t => `${t.className}#${t.methodName}`));
        }
      }
    } else {
      // Fallback without AI
      const matchingTests = testCases.filter(testCase => 
        testCase.keywords.some(keyword => inputValue.toLowerCase().includes(keyword))
      );

      if (matchingTests.length > 0) {
        await executeTestSequence(matchingTests.map(t => `${t.className}#${t.methodName}`));
      } else {
        const systemMessage: Message = {
          id: `${Date.now()}-system`,
          type: 'system',
          content: `I couldn't find matching test cases for "${inputValue}". Available commands include: ${testCases.map(tc => tc.keywords[0]).join(', ')}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    }

    setInputValue('');
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getMessageIcon = (message: Message) => {
    switch (message.type) {
      case 'ai-analysis':
        return <Brain className="h-4 w-4 text-blue-500" />;
      case 'ai-summary':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.type === 'system'
                  ? 'bg-muted'
                  : message.type === 'ai-analysis'
                  ? 'bg-blue-50 border border-blue-200'
                  : message.type === 'ai-summary'
                  ? 'bg-purple-50 border border-purple-200'
                  : 'bg-card border'
              }`}
            >
              <div className="flex items-start gap-2">
                {getMessageIcon(message)}
                <div className="flex-1">
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                    {message.timestamp.toLocaleTimeString()}
                    {message.confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {(message.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                    {message.status && (
                      <Badge
                        variant={
                          message.status === 'success'
                            ? 'default'
                            : message.status === 'failure'
                            ? 'destructive'
                            : message.status === 'analyzing'
                            ? 'secondary'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {message.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="border-t p-4 relative">
        {showSuggestions && (
          <div className="absolute bottom-full left-4 right-4 bg-popover border rounded-lg shadow-lg p-2 mb-2 z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 hover:bg-muted rounded text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type natural language commands like 'run customer creation and login test'..."
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {geminiService && (
          <div className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Brain className="h-3 w-3" />
            AI-powered natural language processing enabled
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
