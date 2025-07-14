
import React, { useState } from 'react';
import { Play, Plus, Download, Slack, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface TestCase {
  id: string;
  name: string;
  description: string;
  className: string;
  methodName: string;
  keywords: string[];
  lastRun?: Date;
  lastStatus?: 'success' | 'failure' | 'running';
}

const TestCasesList = () => {
  const [testCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'Create Customer',
      description: 'Creates a new customer in Commusoft',
      className: 'CustomerTests',
      methodName: 'createCustomer',
      keywords: ['create', 'customer', 'new customer', 'add customer'],
      lastRun: new Date(Date.now() - 1000 * 60 * 30),
      lastStatus: 'success'
    },
    {
      id: '2',
      name: 'Update Customer',
      description: 'Updates existing customer information',
      className: 'CustomerTests',
      methodName: 'updateCustomer',
      keywords: ['update', 'customer', 'edit customer', 'modify customer'],
      lastRun: new Date(Date.now() - 1000 * 60 * 45),
      lastStatus: 'failure'
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
      keywords: ['create', 'job', 'new job', 'add job'],
      lastRun: new Date(Date.now() - 1000 * 60 * 10),
      lastStatus: 'success'
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

  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleTestSelection = (testId: string, checked: boolean) => {
    const newSelected = new Set(selectedTests);
    if (checked) {
      newSelected.add(testId);
    } else {
      newSelected.delete(testId);
    }
    setSelectedTests(newSelected);
  };

  const runSingleTest = async (testCase: TestCase) => {
    setRunningTests(prev => new Set(prev).add(testCase.id));
    
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.3;
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
    // Simulate report download
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
    // Simulate Slack integration
    try {
      const summary = {
        total: testCases.length,
        passed: testCases.filter(tc => tc.lastStatus === 'success').length,
        failed: testCases.filter(tc => tc.lastStatus === 'failure').length,
        timestamp: new Date().toISOString()
      };

      // This would be replaced with actual Slack webhook call
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
