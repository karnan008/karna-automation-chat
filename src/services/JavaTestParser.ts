
export interface ParsedTestMethod {
  id: string;
  name: string;
  description: string;
  className: string;
  methodName: string;
  keywords: string[];
  filePath: string;
  packageName: string;
}

export class JavaTestParser {
  private static extractPackageName(content: string): string {
    const packageMatch = content.match(/package\s+([a-zA-Z_$][a-zA-Z\d_$]*(?:\.[a-zA-Z_$][a-zA-Z\d_$]*)*)\s*;/);
    return packageMatch ? packageMatch[1] : '';
  }

  private static extractClassName(content: string, fileName: string): string {
    const classMatch = content.match(/(?:public\s+)?class\s+([A-Za-z_$][A-Za-z\d_$]*)/);
    return classMatch ? classMatch[1] : fileName.replace('.java', '');
  }

  private static extractTestMethods(content: string, className: string): ParsedTestMethod[] {
    const methods: ParsedTestMethod[] = [];
    
    // Enhanced regex to find @Test annotated methods with better matching
    const testMethodRegex = /@Test(?:\s*\([^)]*\))?\s*(?:\/\/.*\n)*\s*(?:\/\*[\s\S]*?\*\/\s*)*\s*(?:public|private|protected)?\s+void\s+([a-zA-Z_$][a-zA-Z\d_$]*)\s*\([^)]*\)\s*(?:throws\s+[^{]*?)?\s*\{/g;
    
    let match;
    while ((match = testMethodRegex.exec(content)) !== null) {
      const methodName = match[1];
      
      // Extract method description from comments above the method
      const methodStart = match.index;
      const beforeMethod = content.substring(0, methodStart);
      const lines = beforeMethod.split('\n');
      
      let description = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/**')) {
          const comment = line.replace(/^(\/\/|\*|\/\*\*)\s*/, '');
          description = comment + ' ' + description;
        } else if (line === '' || line.startsWith('@')) {
          continue;
        } else {
          break;
        }
      }

      // Generate keywords from method name and description
      const keywords = this.generateKeywords(methodName, description, className);
      
      methods.push({
        id: `${className}_${methodName}`,
        name: this.formatMethodName(methodName),
        description: description.trim() || `Test method: ${methodName}`,
        className,
        methodName,
        keywords,
        filePath: '',
        packageName: ''
      });
    }
    
    return methods;
  }

  private static formatMethodName(methodName: string): string {
    // Convert camelCase to readable format
    return methodName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static generateKeywords(methodName: string, description: string, className: string): string[] {
    const keywords: string[] = [];
    
    // Add method name variations
    keywords.push(methodName.toLowerCase());
    
    // Split camelCase method name
    const methodWords = methodName.split(/(?=[A-Z])/).map(word => word.toLowerCase()).filter(word => word.length > 0);
    keywords.push(...methodWords);
    
    // Add description words
    if (description) {
      const descWords = description.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      keywords.push(...descWords);
    }
    
    // Add class name variations
    const className_clean = className.replace(/Tests?$/, '').replace(/Test$/, '');
    const classWords = className_clean.split(/(?=[A-Z])/).map(word => word.toLowerCase()).filter(word => word.length > 0);
    keywords.push(...classWords);
    
    // Add business domain keywords based on common patterns
    const businessKeywords = this.extractBusinessKeywords(methodName, className);
    keywords.push(...businessKeywords);
    
    // Remove duplicates and common words
    const commonWords = ['test', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'should', 'will', 'can', 'this', 'that'];
    return [...new Set(keywords)].filter(keyword => !commonWords.includes(keyword) && keyword.length > 1);
  }

  private static extractBusinessKeywords(methodName: string, className: string): string[] {
    const keywords: string[] = [];
    const combined = (methodName + ' ' + className).toLowerCase();
    
    // Common business domain keywords
    const domainKeywords = {
      customer: ['customer', 'client', 'user', 'account'],
      job: ['job', 'task', 'work', 'order', 'appointment'],
      invoice: ['invoice', 'bill', 'payment', 'charge'],
      create: ['create', 'add', 'new', 'insert'],
      edit: ['edit', 'update', 'modify', 'change'],
      delete: ['delete', 'remove', 'cancel'],
      complete: ['complete', 'finish', 'done', 'close'],
      schedule: ['schedule', 'book', 'plan'],
      quote: ['quote', 'estimate', 'proposal']
    };
    
    Object.entries(domainKeywords).forEach(([key, variants]) => {
      if (variants.some(variant => combined.includes(variant))) {
        keywords.push(key);
        keywords.push(...variants.filter(v => combined.includes(v)));
      }
    });
    
    return keywords;
  }

  static async parseJavaFiles(files: FileList): Promise<ParsedTestMethod[]> {
    const allMethods: ParsedTestMethod[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only process Java files
      if (!file.name.endsWith('.java')) {
        continue;
      }
      
      try {
        const content = await this.readFileContent(file);
        const packageName = this.extractPackageName(content);
        const className = this.extractClassName(content, file.name);
        const methods = this.extractTestMethods(content, className);
        
        // Update methods with file info
        methods.forEach(method => {
          method.filePath = file.webkitRelativePath || file.name;
          method.packageName = packageName;
        });
        
        allMethods.push(...methods);
        
        if (methods.length > 0) {
          console.log(`Extracted ${methods.length} test methods from ${file.name}:`, methods.map(m => m.methodName));
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
      }
    }
    
    console.log(`Total extracted test methods: ${allMethods.length}`);
    return allMethods;
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}
