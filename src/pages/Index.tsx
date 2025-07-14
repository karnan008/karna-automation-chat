
import React, { useState } from 'react';
import { MessageSquare, List, BarChart3, Settings, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatInterface from '@/components/ChatInterface';
import TestCasesList from '@/components/TestCasesList';
import ReportViewer from '@/components/ReportViewer';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Commusoft Automation Script
              </h1>
              <p className="text-sm text-muted-foreground">by Karna</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Interface
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Test Cases
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Command Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ChatInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <TestCasesList />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportViewer />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Maven Test Command</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="mvn test -Dtest="
                      placeholder="Enter Maven command template"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Test Output Directory</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="./test-output"
                      placeholder="Path to TestNG output directory"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slack Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Slack Webhook URL</label>
                    <input
                      type="url"
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Default Channel</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="#automation-results"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Users to Tag</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      placeholder="@karna, @team"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Auto-Discovery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Test Classes Directory</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="./src/test/java"
                      placeholder="Path to test classes"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="auto-scan" defaultChecked />
                    <label htmlFor="auto-scan" className="text-sm">
                      Automatically scan for new test cases
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
