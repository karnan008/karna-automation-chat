
import React, { useState } from 'react';
import { Settings, Slack, Key, Users, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [slackChannelId, setSlackChannelId] = useState('');
  const [testCasesPath, setTestCasesPath] = useState('./src/test/java');
  const { toast } = useToast();

  const handleSaveSettings = () => {
    // This would typically save to backend/database
    toast({
      title: "Settings Saved",
      description: "Configuration has been updated successfully.",
    });
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
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <Badge variant="destructive">Admin Only</Badge>
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
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
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
                  value={slackBotToken}
                  onChange={(e) => setSlackBotToken(e.target.value)}
                  placeholder="xoxb-your-bot-token"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Default Channel ID</label>
                <Input
                  type="text"
                  value={slackChannelId}
                  onChange={(e) => setSlackChannelId(e.target.value)}
                  placeholder="C1234567890"
                />
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Integration Settings
              </Button>
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
                  value={testCasesPath}
                  onChange={(e) => setTestCasesPath(e.target.value)}
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
