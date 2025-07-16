
import { TestMethod } from './MavenTestScanner';

export interface TestExecutionResult {
  testId: string;
  className: string;
  methodName: string;
  status: 'success' | 'failure' | 'running';
  startTime: Date;
  endTime?: Date;
  error?: string;
  logs?: string[];
}

export class TestExecutionService {
  private testConfig: any;

  constructor(testConfig: any) {
    this.testConfig = testConfig;
  }

  async executeTest(testMethod: TestMethod): Promise<TestExecutionResult> {
    const result: TestExecutionResult = {
      testId: testMethod.id,
      className: testMethod.className,
      methodName: testMethod.methodName,
      status: 'running',
      startTime: new Date(),
      logs: []
    };

    try {
      // Debug logging
      console.log(`🔍 Debug - testMethod.className: "${testMethod.className}"`);
      console.log(`🔍 Debug - testMethod.methodName: "${testMethod.methodName}"`);
      console.log(`🔍 Debug - testConfig.mavenCommand: "${this.testConfig.mavenCommand}"`);
      
      // Build real Maven command with proper flags
      const testClass = `${testMethod.className}#${testMethod.methodName}`;
      const headlessFlag = this.testConfig.headlessMode ? '-Dheadless=true' : '-Dheadless=false';
      
      // Clean up the Maven command template
      let mavenCmd = this.testConfig.mavenCommand.trim();
      
      // Remove any existing test class from the command template
      if (mavenCmd.includes('#')) {
        mavenCmd = mavenCmd.split(' ')[0] + ' ' + mavenCmd.split(' ').slice(1).filter(part => !part.includes('#')).join(' ');
      }
      
      // Ensure Maven command template ends with = and doesn't have extra spaces
      if (!mavenCmd.endsWith('=')) {
        if (mavenCmd.includes('-Dtest=')) {
          // Already has -Dtest=, just ensure it ends with =
          mavenCmd = mavenCmd.replace(/-Dtest=.*$/, '-Dtest=');
        } else {
          // Add -Dtest= 
          mavenCmd += mavenCmd.endsWith(' ') ? '-Dtest=' : ' -Dtest=';
        }
      }
      
      const command = `${mavenCmd}${testClass} ${headlessFlag} ${this.testConfig.testRunnerFlags || ''}`.trim();
      
      console.log(`🚀 k.ai: Starting real test execution...`);
      console.log(`📋 Final Command: ${command}`);
      console.log(`📂 Working Directory: ${this.testConfig.testRootPath}`);
      console.log(`🌐 Browser Mode: ${this.testConfig.headlessMode ? 'Headless' : 'Headed (Visible)'}`);
      
      result.logs?.push(`🚀 k.ai: Initializing test execution`);
      result.logs?.push(`📋 Maven Command: ${command}`);
      result.logs?.push(`📂 Test Root: ${this.testConfig.testRootPath}`);
      result.logs?.push(`🌐 Browser: ${this.testConfig.headlessMode ? 'Headless' : 'Headed'}`);
      
      // Execute actual Maven command
      const executionResult = await this.executeActualCommand(command, result);
      
      result.status = executionResult.success ? 'success' : 'failure';
      result.endTime = new Date();
      
      if (!executionResult.success) {
        result.error = executionResult.error || 'Test execution failed';
        result.logs?.push(`❌ Test Failed: ${result.error}`);
        console.log(`❌ Test FAILED: ${testMethod.className}.${testMethod.methodName}`);
        console.log(`🔍 Error: ${result.error}`);
      } else {
        result.logs?.push(`✅ Test Passed Successfully`);
        console.log(`✅ Test PASSED: ${testMethod.className}.${testMethod.methodName}`);
      }
      
      const duration = result.endTime.getTime() - result.startTime.getTime();
      console.log(`⏱️ Execution Duration: ${duration / 1000}s`);
      result.logs?.push(`⏱️ Duration: ${duration / 1000}s`);
      
      return result;
    } catch (error) {
      result.status = 'failure';
      result.endTime = new Date();
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      result.logs?.push(`💥 Exception: ${result.error}`);
      console.error(`💥 Test execution failed:`, error);
      
      return result;
    }
  }

  private async executeActualCommand(command: string, result: TestExecutionResult): Promise<{success: boolean, error?: string}> {
    try {
      result.logs?.push(`🚀 Executing command: ${command}`);
      console.log(`🚀 Executing command: ${command}`);
      
      // Create a backend API call to execute the command
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command,
          workingDirectory: this.testConfig.testRootPath,
          outputDirectory: this.testConfig.testOutputDir
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const executionResult = await response.json();
      
      // Log the command output
      if (executionResult.stdout) {
        result.logs?.push(`📋 Output: ${executionResult.stdout}`);
        console.log(`📋 Command Output:`, executionResult.stdout);
      }
      
      if (executionResult.stderr) {
        result.logs?.push(`⚠️ Stderr: ${executionResult.stderr}`);
        console.log(`⚠️ Command Stderr:`, executionResult.stderr);
      }
      
      return {
        success: executionResult.exitCode === 0,
        error: executionResult.exitCode !== 0 ? executionResult.stderr || 'Command failed' : undefined
      };
      
    } catch (error) {
      console.error('Error executing command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      result.logs?.push(`💥 Command execution failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async simulateRealExecution(result: TestExecutionResult, testMethod: TestMethod): Promise<void> {
    const steps = [
      { message: '🔧 Setting up WebDriver...', delay: 1000 },
      { message: '🌐 Launching browser...', delay: 2000 },
      { message: '📝 Loading test page...', delay: 1500 },
      { message: `🎯 Executing ${testMethod.methodName}...`, delay: 3000 },
      { message: '🔍 Validating results...', delay: 1000 },
      { message: '🧹 Cleaning up resources...', delay: 500 }
    ];

    for (const step of steps) {
      result.logs?.push(step.message);
      console.log(`k.ai: ${step.message}`);
      await new Promise(resolve => setTimeout(resolve, step.delay));
    }
  }

  private simulateTestExecution(testMethod: TestMethod): boolean {
    // Simulate more realistic failure scenarios based on test patterns
    if (testMethod.keywords.some(k => k.includes('create'))) {
      return Math.random() > 0.15; // 85% success rate for creation tests
    }
    if (testMethod.keywords.some(k => k.includes('delete'))) {
      return Math.random() > 0.25; // 75% success rate for deletion tests
    }
    if (testMethod.keywords.some(k => k.includes('edit'))) {
      return Math.random() > 0.20; // 80% success rate for edit tests
    }
    return Math.random() > 0.20; // 80% general success rate
  }

  private generateRealisticError(testMethod: TestMethod): string {
    const errors = [
      'Element not found: Unable to locate element by xpath "//input[@id=\'customer-name\']"',
      'Timeout waiting for page to load after 10 seconds',
      'WebDriverException: Chrome browser failed to start - check browser installation',
      'NoSuchElementException: Cannot locate element with id "submit-button"',
      'TimeoutException: Timed out waiting for element to be clickable',
      'StaleElementReferenceException: Element is no longer attached to DOM',
      'AssertionError: Expected "Success" but found "Error" in page title',
      'ConnectionException: Unable to connect to test application at configured URL'
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }
}
