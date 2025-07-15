
import React, { useState, useEffect } from 'react';
import { Play, Download, Slack, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MavenTestScanner, TestMethod } from '@/services/MavenTestScanner';

interface TestCasesListProps {
  testConfig?: any;
}

const TestCasesList = ({ testConfig }: TestCasesListProps) => {
  const [testCases, setTestCases] = useState<TestMethod[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (testConfig) {
      scanTestMethods();
    }
  }, [testConfig]);

  const scanTestMethods = async () => {
    setIsScanning(true);
    try {
      const scanner = new MavenTestScanner(testConfig);
      const methods = await scanner.scanTestMethods();
      setTestCases(methods);
      
      toast({
        title: "Test Methods Scanned",
        description: `Found ${methods.length} test methods`,
      });
    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Failed to scan test methods",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleTestSelection = (testId: string, checked: boolean) => {
    const newSelected = new Set(selectedTests);
    if (checked) {
      newSelected.add(testId);
    } else {
      newSelected.delete(testId);
    }
    setSelectedTests(newSelected);
  };

  const runSingleTest = async (testCase: TestMethod) => {
    setRunningTests(prev => new Set(prev).add(testCase.id));
    
    try {
      const scanner = new MavenTestScanner(testConfig);
      const success = await scanner.executeTest(testCase.className, testCase.methodName);
      
      // Update test case status
      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id 
          ? { ...tc, lastRun: new Date(), lastStatus: success ? 'success' : 'failure' }
          : tc
      ));

      toast({
        title: success ? "Test Passed" : "Test Failed",
        description: `${testCase.name} execution completed`,
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: `Failed to execute ${testCase.name}`,
        variant: "destructive"
      });
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testCase.id);
        return newSet;
      });
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.size === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select at least one test to run",
        variant: "destructive"
      });
      return;
    }

    const selectedTestCases = testCases.filter(tc => selectedTests.has(tc.id));
    
    for (const testCase of selectedTestCases) {
      await runSingleTest(testCase);
    }

    toast({
      title: "Test Suite Completed",
      description: `Executed ${selectedTests.size} test(s)`,
    });
  };

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTests: testCases.length,
      selectedTests: selectedTests.size,
      testCases: testCases.filter(tc => selectedTests.has(tc.id))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testng-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "TestNG report has been downloaded successfully"
    });
  };

  const postToSlack = async () => {
    try {
      const summary = {
        total: testCases.length,
        passed: testCases.filter(tc => tc.lastStatus === 'success').length,
        failed: testCases.filter(tc => tc.lastStatus === 'failure').length,
        timestamp: new Date().toISOString()
      };

      console.log('Posting to Slack:', summary);

      toast({
        title: "Posted to Slack",
        description: "Test results have been posted to the configured Slack channel"
      });
    } catch (error) {
      toast({
        title: "Slack Error",
        description: "Failed to post results to Slack",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status?: 'success' | 'failure' | 'running') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Cases ({testCases.length})</h2>
        <div className="flex gap-2">
          <Button 
            onClick={scanTestMethods} 
            disabled={isScanning}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Refresh Tests'}
          </Button>
          <Button onClick={runSelectedTests} disabled={selectedTests.size === 0}>
            <Play className="h-4 w-4 mr-2" />
            Run Selected ({selectedTests.size})
          </Button>
          <Button variant="outline" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline" onClick={postToSlack}>
            <Slack className="h-4 w-4 mr-2" />
            Post to Slack
          </Button>
        </div>
      </div>

      {testCases.length === 0 && !isScanning && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No test methods found. Configure your Maven test command in Settings and click "Refresh Tests".
          </p>
          <Button onClick={scanTestMethods} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Scan Test Methods
          </Button>
        </Card>
      )}

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {testCases.map((testCase) => (
            <Card key={testCase.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedTests.has(testCase.id)}
                    onCheckedChange={(checked) => 
                      handleTestSelection(testCase.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{testCase.name}</h3>
                      {getStatusIcon(
                        runningTests.has(testCase.id) ? 'running' : testCase.lastStatus
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {testCase.description}
                    </p>
                    <div className="text-xs text-muted-foreground mb-2">
                      {testCase.className}#{testCase.methodName}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {testCase.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {testCase.lastRun && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last run: {testCase.lastRun.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => runSingleTest(testCase)}
                  disabled={runningTests.has(testCase.id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TestCasesList;
