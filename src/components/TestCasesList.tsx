import React, { useState, useEffect } from 'react';
import { Play, Download, Slack, CheckCircle, XCircle, Clock, RefreshCw, FileDown, Filter, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MavenTestScanner, TestMethod } from '@/services/MavenTestScanner';
import { TestExecutionService } from '@/services/TestExecutionService';
import { SlackService } from '@/services/SlackService';
import { PDFReportService, TestReportData } from '@/services/PDFReportService';

interface TestCasesListProps {
  testConfig?: any;
}

const TestCasesList = ({ testConfig }: TestCasesListProps) => {
  const [testCases, setTestCases] = useState<TestMethod[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestMethod[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [lastExecutionResults, setLastExecutionResults] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (testConfig) {
      scanTestMethods();
    }
  }, [testConfig]);

  useEffect(() => {
    // Apply class filter
    if (classFilter === 'all') {
      setFilteredTestCases(testCases);
    } else {
      setFilteredTestCases(testCases.filter(tc => tc.className === classFilter));
    }
  }, [testCases, classFilter]);

  const scanTestMethods = async () => {
    setIsScanning(true);
    try {
      const scanner = new MavenTestScanner(testConfig);
      const methods = await scanner.scanTestMethods();
      setTestCases(methods);
      
      // Extract unique class names for filter
      const classes = scanner.getUniqueClassNames();
      setUniqueClasses(classes);
      
      toast({
        title: "Test Methods Scanned",
        description: `Found ${methods.length} test methods across ${classes.length} classes`,
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

  const handleSelectAll = () => {
    const visibleTestIds = filteredTestCases.map(tc => tc.id);
    const allSelected = visibleTestIds.every(id => selectedTests.has(id));
    
    const newSelected = new Set(selectedTests);
    if (allSelected) {
      // Deselect all visible tests
      visibleTestIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all visible tests
      visibleTestIds.forEach(id => newSelected.add(id));
    }
    setSelectedTests(newSelected);
  };

  const runSingleTest = async (testCase: TestMethod) => {
    setRunningTests(prev => new Set(prev).add(testCase.id));
    
    try {
      console.log(`🚀 k.ai: Starting test execution for ${testCase.className}.${testCase.methodName}`);
      
      const executionService = new TestExecutionService(testConfig);
      const result = await executionService.executeTest(testCase);
      
      // Update test case status
      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id 
          ? { 
              ...tc, 
              lastRun: result.endTime || new Date(), 
              lastStatus: result.status as 'success' | 'failure'
            }
          : tc
      ));

      // Store result for reporting
      setLastExecutionResults(prev => [
        ...prev.filter(r => r.testId !== testCase.id),
        {
          testId: testCase.id,
          name: testCase.name,
          className: testCase.className,
          methodName: testCase.methodName,
          status: result.status,
          duration: result.endTime && result.startTime ? 
            (result.endTime.getTime() - result.startTime.getTime()) / 1000 : undefined,
          error: result.error,
          logs: result.logs
        }
      ]);

      toast({
        title: result.status === 'success' ? "✅ Test Passed" : "❌ Test Failed",
        description: `${testCase.name} execution completed${result.error ? `: ${result.error}` : ''}`,
        variant: result.status === 'success' ? "default" : "destructive"
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
    
    toast({
      title: "🚀 k.ai: Starting Bulk Test Execution",
      description: `Running ${selectedTests.size} selected test(s) with real browser automation`,
    });

    for (const testCase of selectedTestCases) {
      await runSingleTest(testCase);
    }

    const passedCount = lastExecutionResults.filter(r => r.status === 'success').length;
    const totalCount = selectedTests.size;

    toast({
      title: "✅ Test Suite Completed",
      description: `Executed ${totalCount} tests: ${passedCount} passed, ${totalCount - passedCount} failed`,
    });
  };

  const downloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTests: testCases.length,
      selectedTests: selectedTests.size,
      classFilter: classFilter,
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

  const downloadPDFReport = async () => {
    if (lastExecutionResults.length === 0) {
      toast({
        title: "No Results Available",
        description: "Please run some tests first to generate a PDF report",
        variant: "destructive"
      });
      return;
    }

    try {
      const companyLogo = localStorage.getItem('companyLogo');
      const reportData: TestReportData = {
        testResults: lastExecutionResults,
        summary: `k.ai executed ${lastExecutionResults.length} tests with ${lastExecutionResults.filter(r => r.status === 'success').length} passing and ${lastExecutionResults.filter(r => r.status === 'failure').length} failing.`,
        executionDate: new Date(),
        companyLogo: companyLogo || undefined
      };

      await PDFReportService.downloadPDFReport(reportData);

      toast({
        title: "PDF Report Generated",
        description: "Test report has been prepared for download"
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    }
  };

  const postToSlack = async () => {
    try {
      const adminSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
      const { slackBotToken, slackChannelId } = adminSettings;
      
      if (!slackBotToken || !slackChannelId) {
        toast({
          title: "Slack Not Configured",
          description: "Please configure Slack integration in Admin settings first.",
          variant: "destructive"
        });
        return;
      }

      const slackService = new SlackService(slackBotToken, slackChannelId);
      
      const testResults = lastExecutionResults.length > 0 ? lastExecutionResults : 
        testCases.filter(tc => tc.lastStatus).map(tc => ({
          name: tc.name,
          status: tc.lastStatus,
          className: tc.className,
          methodName: tc.methodName
        }));

      const summary = `🤖 k.ai executed ${testResults.length} tests with ${testResults.filter(r => r.status === 'success').length} passing and ${testResults.filter(r => r.status === 'failure').length} failing.`;

      const success = await slackService.postTestReport(testResults, summary, slackChannelId);

      if (success) {
        toast({
          title: "Posted to Slack",
          description: "Test results have been posted to the configured Slack channel successfully"
        });
      } else {
        toast({
          title: "Slack Posting Queued",
          description: "Message queued for posting. Check admin panel for pending messages.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Slack posting error:', error);
      toast({
        title: "Slack Error",
        description: "Failed to post results to Slack. Message queued for retry.",
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

  const visibleSelectedCount = filteredTestCases.filter(tc => selectedTests.has(tc.id)).length;
  const allVisibleSelected = filteredTestCases.length > 0 && filteredTestCases.every(tc => selectedTests.has(tc.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Test Cases ({filteredTestCases.length}
          {classFilter !== 'all' && ` of ${testCases.length}`})
        </h2>
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
            Run Selected ({visibleSelectedCount})
          </Button>
          <Button variant="outline" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline" onClick={downloadPDFReport}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button variant="outline" onClick={postToSlack}>
            <Slack className="h-4 w-4 mr-2" />
            Post to Channel
          </Button>
        </div>
      </div>

      {/* Filter and Bulk Selection Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter by Class:</span>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes ({testCases.length})</SelectItem>
              {uniqueClasses.map(className => {
                const count = testCases.filter(tc => tc.className === className).length;
                return (
                  <SelectItem key={className} value={className}>
                    {className} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={filteredTestCases.length === 0}
          >
            {allVisibleSelected ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {allVisibleSelected ? 'Deselect All' : 'Select All'} ({filteredTestCases.length})
          </Button>
          <span className="text-sm text-muted-foreground">
            {visibleSelectedCount} of {filteredTestCases.length} selected
          </span>
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
          {filteredTestCases.map((testCase) => (
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
                      {runningTests.has(testCase.id) && (
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          Browser Running...
                        </Badge>
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
