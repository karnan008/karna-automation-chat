
import React, { useState, useRef, useEffect } from 'react';
import { Send, Play, Download, Slack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'system' | 'test-result';
  content: string;
  timestamp: Date;
  testCase?: string;
  status?: 'success' | 'failure' | 'running';
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  className: string;
  methodName: string;
  keywords: string[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to Commusoft Automation Script by Karna! Type commands like "create customer" or "run all tests" to execute test cases.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'Create Customer',
      description: 'Creates a new customer in Commusoft',
      className: 'CustomerTests',
      methodName: 'createCustomer',
      keywords: ['create', 'customer', 'new customer', 'add customer']
    },
    {
      id: '2',
      name: 'Update Customer',
      description: 'Updates existing customer information',
      className: 'CustomerTests',
      methodName: 'updateCustomer',
      keywords: ['update', 'customer', 'edit customer', 'modify customer']
    },
    {
      id: '3',
      name: 'Delete Customer',
      description: 'Deletes a customer from the system',
      className: 'CustomerTests',
      methodName: 'deleteCustomer',
      keywords: ['delete', 'customer', 'remove customer']
    },
    {
      id: '4',
      name: 'Create Job',
      description: 'Creates a new job in Commusoft',
      className: 'JobTests',
      methodName: 'createJob',
      keywords: ['create', 'job', 'new job', 'add job']
    },
    {
      id: '5',
      name: 'Schedule Job',
      description: 'Schedules a job for a specific date',
      className: 'JobTests',
      methodName: 'scheduleJob',
      keywords: ['schedule', 'job', 'book job', 'assign job']
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findMatchingTestCase = (input: string): TestCase | null => {
    const lowercaseInput = input.toLowerCase();
    return testCases.find(testCase => 
      testCase.keywords.some(keyword => lowercaseInput.includes(keyword))
    ) || null;
  };

  const generateSuggestions = (input: string): string[] => {
    if (!input.trim()) return [];
    
    const lowercaseInput = input.toLowerCase();
    const suggestions = testCases
      .filter(testCase => 
        testCase.keywords.some(keyword => keyword.includes(lowercaseInput)) ||
        testCase.name.toLowerCase().includes(lowercaseInput)
      )
      .map(testCase => testCase.name)
      .slice(0, 5);
    
    return suggestions;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0 && value.length > 0);
  };

  const executeTestCase = async (testCase: TestCase): Promise<void> => {
    const runningMessage: Message = {
      id: Date.now().toString(),
      type: 'test-result',
      content: `Running test: ${testCase.name}...`,
      timestamp: new Date(),
      testCase: testCase.name,
      status: 'running'
    };

    setMessages(prev => [...prev, runningMessage]);

    // Simulate test execution (replace with actual Maven command execution)
    try {
      // This would be replaced with actual backend call
      const response = await fetch('/api/execute-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className: testCase.className,
          methodName: testCase.methodName
        })
      });

      // Simulate execution time
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate for demo
        const resultMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'test-result',
          content: success 
            ? `✅ Test "${testCase.name}" completed successfully!`
            : `❌ Test "${testCase.name}" failed. Check logs for details.`,
          timestamp: new Date(),
          testCase: testCase.name,
          status: success ? 'success' : 'failure'
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== runningMessage.id),
          resultMessage
        ]);

        toast({
          title: success ? "Test Passed" : "Test Failed",
          description: `${testCase.name} execution completed`,
          variant: success ? "default" : "destructive"
        });
      }, 2000);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'test-result',
        content: `❌ Error executing test "${testCase.name}": ${error}`,
        timestamp: new Date(),
        testCase: testCase.name,
        status: 'failure'
      };

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== runningMessage.id),
        errorMessage
      ]);
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

    // Find matching test case
    const matchingTestCase = findMatchingTestCase(inputValue);

    if (matchingTestCase) {
      await executeTestCase(matchingTestCase);
    } else {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `I couldn't find a matching test case for "${inputValue}". Available commands include: ${testCases.map(tc => tc.keywords[0]).join(', ')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
    }

    setInputValue('');
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
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
                  : 'bg-card border'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
                {message.testCase && (
                  <Badge
                    variant={
                      message.status === 'success'
                        ? 'default'
                        : message.status === 'failure'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="ml-2"
                  >
                    {message.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="border-t p-4 relative">
        {showSuggestions && (
          <div className="absolute bottom-full left-4 right-4 bg-popover border rounded-lg shadow-lg p-2 mb-2">
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
            placeholder="Type a command like 'create customer' or 'run all tests'..."
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
