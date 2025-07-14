
import React, { useState, useEffect } from 'react';
import { Settings, Slack, Key, Users, TestTube, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AdminSettings {
  geminiApiKey: string;
  slackBotToken: string;
  slackChannelId: string;
  testCasesPath: string;
}

const AdminPanel = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    geminiApiKey: '',
    slackBotToken: '',
    slackChannelId: '',
    testCasesPath: './src/test/java'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof AdminSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Settings Saved",
        description: "Configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanTests = () => {
    // This would trigger test case scanning
    toast({
      title: "Scanning Tests",
      description: "Test cases are being scanned from the project directory.",
    });
  };

  const mockTesters = [
    { id: 1, username: 'john.doe', email: 'john@example.com', active: true },
    { id: 2, username: 'jane.smith', email: 'jane@example.com', active: true },
    { id: 3, username: 'bob.wilson', email: 'bob@example.com', active: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <Badge variant="destructive">Admin Only</Badge>
        </div>
        <Button onClick={handleSaveSettings} disabled={isLoading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tests">Test Discovery</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gemini AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Gemini API Key</label>
                <Input
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                  placeholder="Enter your Gemini Pro API key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for natural language processing and chat summarization
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slack className="h-5 w-5" />
                Slack Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Slack Bot Token</label>
                <Input
                  type="password"
                  value={settings.slackBotToken}
                  onChange={(e) => handleInputChange('slackBotToken', e.target.value)}
                  placeholder="xoxb-your-bot-token"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Default Channel ID</label>
                <Input
                  type="text"
                  value={settings.slackChannelId}
                  onChange={(e) => handleInputChange('slackChannelId', e.target.value)}
                  placeholder="C1234567890"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tester Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTesters.map((tester) => (
                  <div key={tester.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{tester.username}</div>
                      <div className="text-sm text-muted-foreground">{tester.email}</div>
                    </div>
                    <Badge variant={tester.active ? "default" : "secondary"}>
                      {tester.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                <Users className="h-4 w-4 mr-2" />
                Add New Tester
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Case Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Classes Directory</label>
                <Input
                  type="text"
                  value={settings.testCasesPath}
                  onChange={(e) => handleInputChange('testCasesPath', e.target.value)}
                  placeholder="./src/test/java"
                />
              </div>
              <Button onClick={handleScanTests} className="w-full">
                <TestTube className="h-4 w-4 mr-2" />
                Scan for @Test Methods
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>This will scan your Java project for @Test annotated methods and update the test case list automatically.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
