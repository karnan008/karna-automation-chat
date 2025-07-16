
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Play, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NaturalLanguageProcessor, ParsedCommand } from '@/services/NaturalLanguageProcessor';
import { MavenTestScanner, TestMethod } from '@/services/MavenTestScanner';
import { TestExecutionService } from '@/services/TestExecutionService';
import { ParsedTestMethod } from '@/services/JavaTestParser';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  command?: ParsedCommand;
  executionResult?: {
    success: boolean;
    details: string;
  };
}

interface EnhancedChatInterfaceProps {
  userRole: 'admin' | 'tester';
  geminiApiKey: string;
  testConfig: any;
  uploadedTestMethods?: ParsedTestMethod[];
}

const EnhancedChatInterface = ({ 
  userRole, 
  geminiApiKey, 
  testConfig,
  uploadedTestMethods = []
}: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMethods, setTestMethods] = useState<TestMethod[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with uploaded test methods
  useEffect(() => {
    const initializeTestMethods = async () => {
      const scanner = new MavenTestScanner(testConfig);
      if (uploadedTestMethods.length > 0) {
        scanner.setUploadedMethods(uploadedTestMethods);
      }
      const methods = await scanner.scanTestMethods();
      setTestMethods(methods);
      
      if (methods.length > 0) {
        addMessage('system', 
          `✅ Loaded ${methods.length} test methods from your uploaded project. You can now use natural language commands like "create customer and edit job" to run tests.`
        );
      } else {
        addMessage('system', 
          '⚠️ No test methods loaded. Please upload your Java TestNG project in the Admin panel to enable test execution.'
        );
      }
    };

    initializeTestMethods();
  }, [testConfig, uploadedTestMethods]);

  const addMessage = (
    type: 'user' | 'bot' | 'system',
    content: string,
    command?: ParsedCommand,
    executionResult?: { success: boolean; details: string }
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      command,
      executionResult
    };
    setMessages(prev => [...prev, newMessage]);
  };

  useEffect(() => {
    // Scroll to bottom when messages update
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      if (testMethods.length === 0) {
        addMessage('bot', 
          '❌ No test methods are available. Please upload your Java TestNG project in the Admin panel first.'
        );
        return;
      }

      // Process natural language command
      const processor = new NaturalLanguageProcessor(testMethods);
      const parsedCommand = processor.parseComplexCommand(userMessage);
      
      if (parsedCommand.sequence.length === 0) {
        addMessage('bot', 
          `❌ I couldn't identify any test methods from your command: "${userMessage}"\n\n` +
          `Available test methods:\n${testMethods.slice(0, 5).map(m => `• ${m.name}`).join('\n')}` +
          (testMethods.length > 5 ? `\n... and ${testMethods.length - 5} more` : '')
        );
        return;
      }

      // Show parsed command with k.ai branding
      const botResponse = `🤖 **k.ai Command Analysis:** ${parsedCommand.reasoning}\n\n` +
        `**Execution Plan:**\n${parsedCommand.sequence.map((cmd, idx) => `${idx + 1}. ${cmd}`).join('\n')}\n\n` +
        `**Maven Command:** \`mvn test -Dtest=${parsedCommand.sequence.join(',')}\`\n\n` +
        `Executing your tests with real browser automation...`;
      
      addMessage('bot', botResponse, parsedCommand);

      // Execute tests with real execution service
      const executionService = new TestExecutionService(testConfig);
      const results: string[] = [];
      
      for (const testCommand of parsedCommand.sequence) {
        const [className, methodName] = testCommand.split('#');
        const testMethod = testMethods.find(t => t.className === className && t.methodName === methodName);
        
        if (testMethod) {
          const result = await executionService.executeTest(testMethod);
          results.push(`${testCommand}: ${result.status === 'success' ? '✅ PASSED' : '❌ FAILED'}`);
          
          if (result.error) {
            results.push(`  Error: ${result.error}`);
          }
        }
      }

      const executionSummary = `**k.ai Execution Results:**\n${results.join('\n')}\n\n` +
        `**Summary:** ${results.filter(r => r.includes('✅')).length}/${parsedCommand.sequence.length} tests passed\n\n` +
        `Real browser automation completed. Check your test environment for browser activity logs.`;
      
      addMessage('system', executionSummary, undefined, {
        success: results.every(r => r.includes('✅')),
        details: executionSummary
      });

    } catch (error) {
      console.error('Error processing command:', error);
      addMessage('bot', '❌ k.ai encountered an error while processing your command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">k.ai Test Assistant Ready</p>
              <p className="text-sm">
                {uploadedTestMethods.length > 0 
                  ? `Hi! I'm k.ai, your QA assistant. Type commands like "create customer and edit job" to run your ${uploadedTestMethods.length} uploaded test methods with real browser automation.`
                  : 'Upload your Java TestNG project in the Admin panel to start running tests with natural language.'
                }
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-8 h-8 rounded-full bg-${message.type === 'user' ? 'accent' : 'primary'} flex items-center justify-center`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4 text-accent-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">{message.content}</p>
                {message.executionResult && (
                  <div className="mt-2 p-2 rounded-md bg-muted-foreground/10">
                    <p className="text-xs font-bold">
                      {message.executionResult.success ? (
                        <CheckCircle className="inline-block h-3 w-3 mr-1 text-green-500" />
                      ) : (
                        <XCircle className="inline-block h-3 w-3 mr-1 text-red-500" />
                      )}
                      Execution Result:
                    </p>
                    <p className="text-xs">{message.executionResult.details}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Loader className="h-4 w-4 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Processing your command...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              uploadedTestMethods.length > 0
                ? "Ask k.ai: 'create customer and edit job' or 'run all customer tests'"
                : "Upload your Java project first to enable k.ai test commands"
            }
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isProcessing || uploadedTestMethods.length === 0}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isProcessing || uploadedTestMethods.length === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {uploadedTestMethods.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 k.ai tip: Use natural language like "create customer, edit it, then create job and complete it"
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
