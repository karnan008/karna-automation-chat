
import { ParsedTestMethod } from './JavaTestParser';

export interface TestMethod {
  id: string;
  name: string;
  description: string;
  className: string;
  methodName: string;
  keywords: string[];
  lastRun?: Date;
  lastStatus?: 'success' | 'failure' | 'running';
  packageName?: string;
  filePath?: string;
}

export class MavenTestScanner {
  private testConfig: any;
  private uploadedMethods: ParsedTestMethod[] = [];

  constructor(testConfig: any) {
    this.testConfig = testConfig;
    this.loadUploadedMethods();
  }

  private loadUploadedMethods() {
    const savedMethods = localStorage.getItem('uploadedTestMethods');
    if (savedMethods) {
      try {
        this.uploadedMethods = JSON.parse(savedMethods);
      } catch (error) {
        console.error('Error loading uploaded test methods:', error);
      }
    }
  }

  async scanTestMethods(): Promise<TestMethod[]> {
    try {
      // If we have uploaded methods, use those instead of mock data
      if (this.uploadedMethods.length > 0) {
        return this.uploadedMethods.map(method => ({
          id: method.id,
          name: method.name,
          description: method.description,
          className: method.className,
          methodName: method.methodName,
          keywords: method.keywords,
          packageName: method.packageName,
          filePath: method.filePath
        }));
      }

      // Fallback to empty array if no uploaded methods
      console.log('No uploaded test methods found. Please upload your Java project in the Admin panel.');
      return [];
    } catch (error) {
      console.error('Error scanning test methods:', error);
      return [];
    }
  }

  async executeTest(className: string, methodName: string): Promise<boolean> {
    try {
      const command = `${this.testConfig.mavenCommand}${className}#${methodName}`;
      console.log(`Executing Maven command: ${command}`);
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return random success/failure for demo
      return Math.random() > 0.3;
    } catch (error) {
      console.error('Error executing test:', error);
      return false;
    }
  }

  setUploadedMethods(methods: ParsedTestMethod[]) {
    this.uploadedMethods = methods;
  }
}
