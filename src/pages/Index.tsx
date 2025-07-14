
import React, { useState } from 'react';
import { MessageSquare, List, BarChart3, Settings, Play, LogOut, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AuthLogin from '@/components/AuthLogin';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import AdminPanel from '@/components/AdminPanel';
import TestCasesList from '@/components/TestCasesList';
import ReportViewer from '@/components/ReportViewer';
import GeminiIntegration from '@/components/GeminiIntegration';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'tester'>('tester');
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  const handleLogin = (role: 'admin' | 'tester', user: string) => {
    setUserRole(role);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('tester');
    setUsername('');
    setActiveTab('chat');
  };

  if (!isAuthenticated) {
    return <AuthLogin onLogin={handleLogin} />;
  }

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
              <p className="text-sm text-muted-foreground">by Karna - AI-Powered Test Automation</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={userRole === 'admin' ? 'destructive' : 'default'}>
                  <Shield className="h-3 w-3 mr-1" />
                  {userRole.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">Welcome, {username}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Ready</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
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
            {userRole === 'admin' && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <div className="grid gap-4">
              <GeminiIntegration 
                isVisible={true} 
                userRole={userRole}
              />
              <Card className="h-[700px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    AI-Powered Command Interface
                    <Badge variant="secondary" className="ml-auto">Natural Language</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <EnhancedChatInterface 
                    userRole={userRole}
                    geminiApiKey="your-gemini-api-key" // This would come from admin settings
                  />
                </CardContent>
              </Card>
            </div>
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
                      readOnly={userRole !== 'admin'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Test Output Directory</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="./test-output"
                      placeholder="Path to TestNG output directory"
                      readOnly={userRole !== 'admin'}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Docker Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Container Port</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="3000"
                      placeholder="Port number"
                      readOnly={userRole !== 'admin'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Environment</label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border rounded"
                      defaultValue="production"
                      placeholder="deployment environment"
                      readOnly={userRole !== 'admin'}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="admin" className="mt-0">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
