
import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestCase {
  id: string;
  name: string;
  className: string;
  methodName: string;
  keywords: string[];
}

interface GeminiResponse {
  mappedTests: string[];
  reasoning: string;
  confidence: number;
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async parseUserIntent(userInput: string, availableTests: TestCase[]): Promise<GeminiResponse> {
    // Simulate Gemini API call (replace with actual Google Generative AI integration)
    const testNames = availableTests.map(t => `${t.className}#${t.methodName} (${t.name})`).join('\n');
    
    const prompt = `
      User wants to run tests with this request: "${userInput}"
      
      Available test methods:
      ${testNames}
      
      Please identify which test methods match the user's intent and return them in this format:
      - List the matching test method names
      - Explain your reasoning
      - Provide a confidence score (0-1)
    `;

    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock intelligent matching
    const lowercaseInput = userInput.toLowerCase();
    const matchedTests = availableTests.filter(test => 
      test.keywords.some(keyword => lowercaseInput.includes(keyword)) ||
      test.name.toLowerCase().includes(lowercaseInput.split(' ')[0])
    );

    return {
      mappedTests: matchedTests.map(t => `${t.className}#${t.methodName}`),
      reasoning: `Based on the keywords "${userInput}", I identified ${matchedTests.length} matching test methods related to ${matchedTests.map(t => t.name.toLowerCase()).join(', ')}.`,
      confidence: matchedTests.length > 0 ? 0.85 : 0.2
    };
  }

  async generateTestSummary(testResults: any[]): Promise<string> {
    // Simulate Gemini API call for generating human-readable test summaries
    await new Promise(resolve => setTimeout(resolve, 800));

    let summary = "🤖 **Test Execution Summary:**\n\n";
    
    testResults.forEach((result, index) => {
      const emoji = result.status === 'success' ? '✅' : result.status === 'failure' ? '❌' : '⏳';
      summary += `${emoji} **${result.testName}**: ${result.status === 'success' ? 'Passed successfully' : result.status === 'failure' ? `Failed - ${result.error || 'Unknown error'}` : 'Currently running'}\n`;
    });

    const passed = testResults.filter(r => r.status === 'success').length;
    const failed = testResults.filter(r => r.status === 'failure').length;
    
    summary += `\n📊 **Overall**: ${passed} passed, ${failed} failed out of ${testResults.length} tests`;
    
    if (failed === 0) {
      summary += "\n🎉 All tests passed! Great job!";
    } else {
      summary += `\n⚠️ ${failed} test(s) need attention. Please check the detailed logs.`;
    }

    return summary;
  }
}

interface GeminiIntegrationProps {
  isVisible: boolean;
  userRole: 'admin' | 'tester';
}

const GeminiIntegration = ({ isVisible, userRole }: GeminiIntegrationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isVisible) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Gemini AI Processing
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm">
              {isProcessing ? 'Processing natural language...' : 'Ready to interpret commands'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI will map your natural language requests to specific test methods and generate human-readable summaries.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiIntegration;
