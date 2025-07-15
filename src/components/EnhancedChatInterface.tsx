
import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { GeminiService } from './GeminiIntegration';
import { MavenTestScanner, TestMethod } from '@/services/MavenTestScanner';
import { NaturalLanguageProcessor } from '@/services/NaturalLanguageProcessor';

interface Message {
  id: string;
  type: 'user' | 'system' | 'ai-analysis' | 'test-result' | 'ai-summary';
  content: string;
  timestamp: Date;
  testCases?: string[];
  status?: 'success' | 'failure' | 'running' | 'analyzing';
  confidence?: number;
}

interface EnhancedChatInterfaceProps {
  userRole: 'admin' | 'tester';
  geminiApiKey?: string;
  testConfig?: any;
}

const EnhancedChatInterface = ({ userRole, geminiApiKey, testConfig }: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '🤖 Welcome to Commusoft Automation Script by Karna! I can understand complex natural language commands like "create customer, edit that and then create a job to that customer and then complete that job and raise invoice for that job". Type your request and I\'ll execute the test sequence.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [testMethods, setTestMethods] = useState<TestMethod[]>([]);
  const [nlProcessor, setNlProcessor] = useState<NaturalLanguageProcessor | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (geminiApiKey) {
      setGeminiService(new GeminiService(geminiApiKey));
    }
  }, [geminiApiKey]);

  useEffect(() => {
    if (testConfig) {
      loadTestMethods();
    }
  }, [testConfig]);

  useEffect(() => {
    if (testMethods.length > 0) {
      setNlProcessor(new NaturalLanguageProcessor(testMethods));
    }
  }, [testMethods]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTestMethods = async () => {
    try {
      const scanner = new MavenTestScanner(testConfig);
      const methods = await scanner.scanTestMethods();
      setTestMethods(methods);
    } catch (error) {
      console.error('Error loading test methods:', error);
    }
  };

  const executeTestSequence = async (sequence: string[]): Promise<void> => {
    const testResults = [];
    const scanner = new MavenTestScanner(testConfig);

    for (const testMethod of sequence) {
      const [className, methodName] = testMethod.split('#');
      const testName = testMethods.find(tm => 
        tm.className === className && tm.methodName === methodName
      )?.name || testMethod;

      const runningMessage: Message = {
        id: `${Date.now()}-${testMethod}`,
        type: 'test-result',
        content: `🔄 Running: ${testName}...`,
        timestamp: new Date(),
        status: 'running'
      };

      setMessages(prev => [...prev, runningMessage]);

      try {
        const success = await scanner.executeTest(className, methodName);
        
        const result = {
          testName,
          status: success ? 'success' : 'failure',
          error: success ? null : 'Test execution failed'
        };
        
        testResults.push(result);

        const resultMessage: Message = {
          id: `${Date.now()}-result-${testMethod}`,
          type: 'test-result',
          content: success 
            ? `✅ ${testName} completed successfully!`
            : `❌ ${testName} failed: ${result.error}`,
          timestamp: new Date(),
          status: success ? 'success' : 'failure'
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== runningMessage.id),
          resultMessage
        ]);

      } catch (error) {
        testResults.push({
          testName,
          status: 'failure',
          error: `Execution error: ${error}`
        });
      }
    }

    // Generate AI summary if available
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

    if (!nlProcessor) {
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        type: 'system',
        content: 'Test methods not loaded. Please configure Maven settings and refresh.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsProcessing(false);
      setInputValue('');
      return;
    }

    // Parse the complex command
    const analysisMessage: Message = {
      id: `${Date.now()}-analysis`,
      type: 'ai-analysis',
      content: '🧠 Analyzing your complex command...',
      timestamp: new Date(),
      status: 'analyzing'
    };

    setMessages(prev => [...prev, analysisMessage]);

    try {
      const parsedCommand = nlProcessor.parseComplexCommand(inputValue);
      
      const analysisResult: Message = {
        id: `${Date.now()}-analysis-result`,
        type: 'ai-analysis',
        content: `🎯 **Command Analysis:**\n\n${parsedCommand.reasoning}\n\n**Identified Sequence:** ${parsedCommand.sequence.length} test(s)\n\n**Confidence:** ${(parsedCommand.confidence * 100).toFixed(1)}%`,
        timestamp: new Date(),
        testCases: parsedCommand.sequence,
        confidence: parsedCommand.confidence,
        status: 'success'
      };

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== analysisMessage.id),
        analysisResult
      ]);

      // Execute the sequence
      if (parsedCommand.sequence.length > 0) {
        await executeTestSequence(parsedCommand.sequence);
      } else {
        const noMatchMessage: Message = {
          id: `${Date.now()}-no-match`,
          type: 'system',
          content: `I couldn't identify test methods from your command. Available tests: ${testMethods.map(tm => tm.name).join(', ')}`,
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
          content: `❌ Analysis failed: ${error}`,
          timestamp: new Date()
        }
      ]);
    }

    setInputValue('');
    setIsProcessing(false);
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

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Try: 'create customer, edit that and then create a job to that customer and then complete that job and raise invoice for that job'"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="text-xs text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Brain className="h-3 w-3" />
          Complex natural language processing enabled
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
