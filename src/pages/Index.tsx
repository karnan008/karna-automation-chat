import React, { useState, useEffect } from 'react';
import { MessageSquare, List, BarChart3, Settings, Play, LogOut, Shield, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AuthLogin from '@/components/AuthLogin';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import AdminPanel from '@/components/AdminPanel';
import TestCasesList from '@/components/TestCasesList';
import ReportViewer from '@/components/ReportViewer';
import GeminiIntegration from '@/components/GeminiIntegration';
import TestConfiguration from '@/components/TestConfiguration';
import { ParsedTestMethod } from '@/services/JavaTestParser';

interface TestConfig {
  mavenCommand: string;
  testOutputDir: string;
  containerPort: string;
  environment: string;
  testRootPath: string;
  headlessMode: boolean;
  testRunnerFlags: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'tester'>('tester');
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [testConfig, setTestConfig] = useState<TestConfig>({
    mavenCommand: 'mvn test -Dtest=',
    testOutputDir: './test-output',
    containerPort: '3000',
    environment: 'production',
    testRootPath: './src/test/java',
    headlessMode: true,
    testRunnerFlags: '-Dwebdriver.chrome.driver=auto'
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [uploadedTestMethods, setUploadedTestMethods] = useState<ParsedTestMethod[]>([]);
  const { toast } = useToast();

  // Load test configuration from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('testConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setTestConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading test configuration:', error);
      }
    }
  }, []);

  // Load uploaded test methods on component mount
  useEffect(() => {
    const savedMethods = localStorage.getItem('uploadedTestMethods');
    if (savedMethods) {
      try {
        const methods = JSON.parse(savedMethods);
        setUploadedTestMethods(methods);
      } catch (error) {
        console.error('Error loading uploaded test methods:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Load company logo
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setCompanyLogo(savedLogo);
    }
  }, []);

  const handleTestMethodsUpdated = (methods: ParsedTestMethod[]) => {
    setUploadedTestMethods(methods);
  };

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

  const handleConfigChange = (config: TestConfig) => {
    setTestConfig(config);
  };

  const handleSaveTestConfig = async () => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can modify test configuration.",
        variant: "destructive",
      });
      return;
    }

    setIsConfigLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('testConfig', JSON.stringify(testConfig));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Configuration Saved",
        description: "Test configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save test configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfigLoading(false);
    }
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
            <div className="flex items-center gap-4">
              {companyLogo && (
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className="h-10 w-auto max-w-32 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Commusoft Automation Script
                </h1>
                <p className="text-sm text-muted-foreground">by Karna - AI-Powered Test Automation with k.ai</p>
              </div>
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
                <span>k.ai Ready</span>
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
          <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-6' : 'grid-cols-5'} mb-6`}>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              k.ai Chat
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
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code Viewer
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
                    k.ai - AI-Powered Command Interface
                    <Badge variant="secondary" className="ml-auto">Natural Language + Real Browser Automation</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <EnhancedChatInterface 
                    userRole={userRole}
                    geminiApiKey="your-gemini-api-key"
                    testConfig={testConfig}
                    uploadedTestMethods={uploadedTestMethods}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <TestCasesList testConfig={testConfig} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportViewer />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="space-y-6">
              <TestConfiguration 
                userRole={userRole}
                testConfig={testConfig}
                onConfigChange={handleConfigChange}
              />
              
              {userRole === 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Docker Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Container Port</label>
                      <Input
                        type="text"
                        value={testConfig.containerPort}
                        onChange={(e) => handleConfigChange({ ...testConfig, containerPort: e.target.value })}
                        placeholder="Port number"
                        readOnly={userRole !== 'admin'}
                        className={userRole !== 'admin' ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Environment</label>
                      <Input
                        type="text"
                        value={testConfig.environment}
                        onChange={(e) => handleConfigChange({ ...testConfig, environment: e.target.value })}
                        placeholder="deployment environment"
                        readOnly={userRole !== 'admin'}
                        className={userRole !== 'admin' ? 'bg-muted cursor-not-allowed' : ''}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Viewer & Editor
                  <Badge variant="secondary">Coming Soon</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">VS Code-like Editor</h3>
                  <p className="text-muted-foreground mb-4">
                    Full project structure viewer with in-browser code editing capabilities
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This feature will allow you to view and edit your Java Selenium test files 
                    directly in the browser with syntax highlighting and file management.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="admin" className="mt-0">
              <AdminPanel onTestMethodsUpdated={handleTestMethodsUpdated} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
