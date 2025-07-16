
import React, { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface TestConfig {
  testRootPath: string;
  headlessMode: boolean;
  testRunnerFlags: string;
  mavenCommand: string;
  testOutputDir: string;
  containerPort: string;
  environment: string;
}

interface TestConfigurationProps {
  userRole: 'admin' | 'tester';
  testConfig: TestConfig;
  onConfigChange: (config: TestConfig) => void;
}

const TestConfiguration = ({ userRole, testConfig, onConfigChange }: TestConfigurationProps) => {
  const [localConfig, setLocalConfig] = useState<TestConfig>(testConfig);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalConfig(testConfig);
  }, [testConfig]);

  const handleFieldChange = (field: keyof TestConfig, value: string | boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      onConfigChange(localConfig);
      localStorage.setItem('testConfig', JSON.stringify(localConfig));
      
      toast({
        title: "Configuration Saved",
        description: "Test configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'tester';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !canEdit}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test Root Path</label>
          <Input
            type="text"
            value={localConfig.testRootPath || './src/test/java'}
            onChange={(e) => handleFieldChange('testRootPath', e.target.value)}
            placeholder="./src/test/java"
            readOnly={!canEdit}
            className={!canEdit ? 'bg-muted cursor-not-allowed' : ''}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Headless Mode</label>
            <p className="text-xs text-muted-foreground">Run tests without opening browser window</p>
          </div>
          <Switch
            checked={localConfig.headlessMode}
            onCheckedChange={(checked) => handleFieldChange('headlessMode', checked)}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Test Runner Flags</label>
          <Input
            type="text"
            value={localConfig.testRunnerFlags || '-Dwebdriver.chrome.driver=auto'}
            onChange={(e) => handleFieldChange('testRunnerFlags', e.target.value)}
            placeholder="-Dwebdriver.chrome.driver=auto -Dheadless=true"
            readOnly={!canEdit}
            className={!canEdit ? 'bg-muted cursor-not-allowed' : ''}
          />
        </div>

        {userRole === 'admin' && (
          <>
            <div>
              <label className="text-sm font-medium">Maven Command Template</label>
              <Input
                type="text"
                value={localConfig.mavenCommand}
                onChange={(e) => handleFieldChange('mavenCommand', e.target.value)}
                placeholder="mvn test -Dtest="
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Test Output Directory</label>
              <Input
                type="text"
                value={localConfig.testOutputDir}
                onChange={(e) => handleFieldChange('testOutputDir', e.target.value)}
                placeholder="./test-output"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TestConfiguration;
