
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
    
    // Regex to find @Test annotated methods
    const testMethodRegex = /@Test[\s\S]*?(?:public|private|protected)?\s+void\s+([a-zA-Z_$][a-zA-Z\d_$]*)\s*\([^)]*\)\s*\{/g;
    
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
          description = line.replace(/^(\/\/|\*|\/\*\*)\s*/, '') + ' ' + description;
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
    keywords.push(...methodName.split(/(?=[A-Z])/).map(word => word.toLowerCase()).filter(word => word.length > 0));
    
    // Add description words
    if (description) {
      keywords.push(...description.toLowerCase().split(/\s+/).filter(word => word.length > 2));
    }
    
    // Add class name variations
    const classWords = className.replace(/Tests?$/, '').split(/(?=[A-Z])/).map(word => word.toLowerCase());
    keywords.push(...classWords);
    
    // Remove duplicates and common words
    const commonWords = ['test', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return [...new Set(keywords)].filter(keyword => !commonWords.includes(keyword) && keyword.length > 1);
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
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
      }
    }
    
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
