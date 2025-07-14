
import React, { useState } from 'react';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

const ReportViewer = () => {
  const [reportData] = useState<TestSuite[]>([
    {
      name: 'CustomerTests',
      duration: 45.2,
      passed: 3,
      failed: 1,
      skipped: 0,
      tests: [
        { name: 'createCustomer', status: 'passed', duration: 12.3 },
        { name: 'updateCustomer', status: 'failed', duration: 15.7, error: 'Element not found: #customer-form' },
        { name: 'deleteCustomer', status: 'passed', duration: 8.9 },
        { name: 'searchCustomer', status: 'passed', duration: 8.3 }
      ]
    },
    {
      name: 'JobTests',
      duration: 62.8,
      passed: 4,
      failed: 0,
      skipped: 1,
      tests: [
        { name: 'createJob', status: 'passed', duration: 18.4 },
        { name: 'scheduleJob', status: 'passed', duration: 22.1 },
        { name: 'updateJob', status: 'passed', duration: 14.6 },
        { name: 'deleteJob', status: 'passed', duration: 7.7 },
        { name: 'bulkJobUpdate', status: 'skipped', duration: 0 }
      ]
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const totalTests = reportData.reduce((sum, suite) => sum + suite.tests.length, 0);
  const totalPassed = reportData.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = reportData.reduce((sum, suite) => sum + suite.failed, 0);
  const totalSkipped = reportData.reduce((sum, suite) => sum + suite.skipped, 0);
  const totalDuration = reportData.reduce((sum, suite) => sum + suite.duration, 0);
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  const refreshReport = async () => {
    setIsLoading(true);
    // Simulate loading new report data
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const downloadHtmlReport = () => {
    // Simulate downloading HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TestNG Report - Commusoft Automation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .passed { color: #28a745; }
          .failed { color: #dc3545; }
          .skipped { color: #ffc107; }
        </style>
      </head>
      <body>
        <h1>TestNG Report - Commusoft Automation</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Tests: ${totalTests}</p>
          <p class="passed">Passed: ${totalPassed}</p>
          <p class="failed">Failed: ${totalFailed}</p>
          <p class="skipped">Skipped: ${totalSkipped}</p>
          <p>Pass Rate: ${passRate.toFixed(1)}%</p>
          <p>Total Duration: ${totalDuration.toFixed(1)}s</p>
        </div>
        ${reportData.map(suite => `
          <h3>${suite.name}</h3>
          <ul>
            ${suite.tests.map(test => `
              <li class="${test.status}">
                ${test.name} - ${test.status.toUpperCase()} (${test.duration}s)
                ${test.error ? `<br/><small>Error: ${test.error}</small>` : ''}
              </li>
            `).join('')}
          </ul>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testng-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      skipped: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">TestNG Reports</h2>
        <div className="flex gap-2">
          <Button onClick={refreshReport} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={downloadHtmlReport}>
            <Download className="h-4 w-4 mr-2" />
            Download HTML
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalTests}</div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{totalSkipped}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Pass Rate: {passRate.toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={passRate} className="h-2" />
          <div className="text-sm text-muted-foreground mt-2">
            Duration: {totalDuration.toFixed(1)}s
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
          <TabsTrigger value="failures">Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            {reportData.map((suite, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{suite.name}</span>
                    <Badge variant="outline">
                      {suite.passed + suite.failed + suite.skipped} tests
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Passed: {suite.passed}</span>
                    </div>
                    <div>
                      <span className="text-red-600">Failed: {suite.failed}</span>
                    </div>
                    <div>
                      <span className="text-yellow-600">Skipped: {suite.skipped}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Duration: {suite.duration.toFixed(1)}s
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            {reportData.map((suite, suiteIndex) => (
              <Card key={suiteIndex}>
                <CardHeader>
                  <CardTitle>{suite.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div key={testIndex} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{test.name}</span>
                          {test.error && (
                            <div className="text-sm text-red-600 mt-1">
                              {test.error}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {test.duration.toFixed(1)}s
                          </span>
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failures">
          <div className="space-y-4">
            {reportData.map((suite, suiteIndex) => {
              const failedTests = suite.tests.filter(test => test.status === 'failed');
              if (failedTests.length === 0) return null;

              return (
                <Card key={suiteIndex}>
                  <CardHeader>
                    <CardTitle className="text-red-600">
                      {suite.name} - {failedTests.length} failure(s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {failedTests.map((test, testIndex) => (
                        <div key={testIndex} className="p-3 border border-red-200 rounded bg-red-50">
                          <div className="font-medium text-red-800">{test.name}</div>
                          <div className="text-sm text-red-600 mt-1">
                            Duration: {test.duration.toFixed(1)}s
                          </div>
                          {test.error && (
                            <div className="text-sm text-red-700 mt-2 font-mono bg-red-100 p-2 rounded">
                              {test.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {reportData.every(suite => suite.tests.every(test => test.status !== 'failed')) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-green-600 text-xl font-semibold">
                    🎉 No failures found!
                  </div>
                  <div className="text-muted-foreground mt-2">
                    All tests are passing successfully.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportViewer;
