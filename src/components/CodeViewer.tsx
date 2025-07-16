import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  Save,
  Code,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ParsedTestMethod } from '@/services/JavaTestParser';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  isFromUpload?: boolean;
}

interface CodeViewerProps {
  uploadedTestMethods: ParsedTestMethod[];
}

const CodeViewer = ({ uploadedTestMethods }: CodeViewerProps) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateFileTree();
  }, [uploadedTestMethods]);

  const generateFileTree = () => {
    if (uploadedTestMethods.length === 0) {
      setFileTree([]);
      return;
    }

    // Load real uploaded project files
    const uploadedFiles = localStorage.getItem('uploadedProjectFiles');
    let realFiles: any[] = [];
    
    if (uploadedFiles) {
      try {
        realFiles = JSON.parse(uploadedFiles);
      } catch (error) {
        console.error('Error loading uploaded files:', error);
      }
    }

    const tree: FileNode[] = [
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            name: 'test',
            type: 'folder',
            path: 'src/test',
            children: [
              {
                name: 'java',
                type: 'folder',
                path: 'src/test/java',
                children: generateTestFiles(realFiles)
              }
            ]
          },
          {
            name: 'main',
            type: 'folder',
            path: 'src/main',
            children: [
              {
                name: 'java',
                type: 'folder',
                path: 'src/main/java',
                children: generateMainFiles(realFiles)
              }
            ]
          }
        ]
      },
      {
        name: 'pom.xml',
        type: 'file',
        path: 'pom.xml',
        content: getFileContent(realFiles, 'pom.xml') || generatePomXml(),
        isFromUpload: hasFileInUpload(realFiles, 'pom.xml')
      },
      {
        name: 'testng.xml',
        type: 'file',
        path: 'testng.xml',
        content: getFileContent(realFiles, 'testng.xml') || generateTestNgXml(),
        isFromUpload: hasFileInUpload(realFiles, 'testng.xml')
      }
    ];

    setFileTree(tree);
    setExpandedFolders(new Set(['src', 'src/test', 'src/test/java']));
  };

  const getFileContent = (files: any[], fileName: string): string | null => {
    const file = files.find(f => f.name === fileName || f.path.endsWith(fileName));
    return file?.content || null;
  };

  const hasFileInUpload = (files: any[], fileName: string): boolean => {
    return files.some(f => f.name === fileName || f.path.endsWith(fileName));
  };

  const generateTestFiles = (realFiles: any[]): FileNode[] => {
    const packageFolders: { [key: string]: FileNode } = {};
    
    // First, add real uploaded test files
    const testFiles = realFiles.filter(f => 
      f.path.includes('/test/java/') && f.name.endsWith('.java')
    );

    testFiles.forEach(file => {
      const relativePath = file.path.replace(/.*\/test\/java\//, '');
      const pathParts = relativePath.split('/');
      const fileName = pathParts.pop();
      const packagePath = pathParts.join('/');
      
      if (packagePath && !packageFolders[packagePath]) {
        packageFolders[packagePath] = {
          name: pathParts[pathParts.length - 1] || 'default',
          type: 'folder',
          path: `src/test/java/${packagePath}`,
          children: []
        };
      }
      
      const targetFolder = packagePath ? packageFolders[packagePath] : { children: [] as FileNode[] };
      targetFolder.children?.push({
        name: fileName!,
        type: 'file',
        path: `src/test/java/${relativePath}`,
        content: file.content,
        isFromUpload: true
      });
    });

    // Then add any missing test methods from parsed data
    uploadedTestMethods.forEach(method => {
      const packagePath = method.packageName.replace(/\./g, '/');
      const fullPath = `src/test/java/${packagePath}`;
      
      if (!packageFolders[packagePath]) {
        packageFolders[packagePath] = {
          name: packagePath.split('/').pop() || 'default',
          type: 'folder',
          path: fullPath,
          children: []
        };
      }
      
      const fileName = `${method.className}.java`;
      const existing = packageFolders[packagePath].children?.find(f => f.name === fileName);
      
      if (!existing) {
        const realFileContent = getFileContent(realFiles, fileName);
        packageFolders[packagePath].children?.push({
          name: fileName,
          type: 'file',
          path: `${fullPath}/${fileName}`,
          content: realFileContent || generateJavaFileContent(method),
          isFromUpload: !!realFileContent
        });
      }
    });

    return Object.values(packageFolders);
  };

  const generateMainFiles = (realFiles: any[]): FileNode[] => {
    const mainFiles = realFiles.filter(f => 
      f.path.includes('/main/java/') && f.name.endsWith('.java')
    );

    const packageFolders: { [key: string]: FileNode } = {};
    
    mainFiles.forEach(file => {
      const relativePath = file.path.replace(/.*\/main\/java\//, '');
      const pathParts = relativePath.split('/');
      const fileName = pathParts.pop();
      const packagePath = pathParts.join('/');
      
      if (packagePath && !packageFolders[packagePath]) {
        packageFolders[packagePath] = {
          name: pathParts[pathParts.length - 1] || 'default',
          type: 'folder',
          path: `src/main/java/${packagePath}`,
          children: []
        };
      }
      
      const targetFolder = packagePath ? packageFolders[packagePath] : { children: [] as FileNode[] };
      targetFolder.children?.push({
        name: fileName!,
        type: 'file',
        path: `src/main/java/${relativePath}`,
        content: file.content,
        isFromUpload: true
      });
    });

    return Object.values(packageFolders);
  };

  const generateJavaFileContent = (method: ParsedTestMethod): string => {
    return `package ${method.packageName};

import org.testng.annotations.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

/**
 * ${method.description || 'Test class generated by k.ai'}
 * Generated from uploaded project analysis
 */
public class ${method.className} {
    private WebDriver driver;
    private WebDriverWait wait;
    
    @Test
    public void ${method.methodName}() {
        // k.ai generated test method for: ${method.description || method.methodName}
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        
        try {
            // Test implementation for ${method.description || method.methodName}
            driver.get("https://your-application-url.com");
            
            // Add your test steps here
            // Example: WebElement element = wait.until(ExpectedConditions.elementToBeClickable(By.id("element-id")));
            
        } finally {
            if (driver != null) {
                driver.quit();
            }
        }
    }
}`;
  };

  const generatePomXml = (): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.karna</groupId>
    <artifactId>commusoft-automation</artifactId>
    <version>1.0-SNAPSHOT</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <selenium.version>4.15.0</selenium.version>
        <testng.version>7.8.0</testng.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>
        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>\${testng.version}</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
            </plugin>
        </plugins>
    </build>
</project>`;
  };

  const generateTestNgXml = (): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<suite name="CommusoftAutomationSuite">
    <test name="CommusoftTest">
        <classes>
${uploadedTestMethods.map(m => `            <class name="${m.packageName}.${m.className}"/>`).join('\n')}
        </classes>
    </test>
</suite>`;
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      if (hasUnsavedChanges) {
        const confirmDiscard = window.confirm('You have unsaved changes. Do you want to discard them?');
        if (!confirmDiscard) return;
      }
      
      setSelectedFile(file);
      setFileContent(file.content || '');
      setHasUnsavedChanges(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
  };

  const saveFile = () => {
    if (selectedFile) {
      // Update the file content in the tree
      const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === selectedFile.path) {
            return { ...node, content: fileContent };
          }
          if (node.children) {
            return { ...node, children: updateFileInTree(node.children) };
          }
          return node;
        });
      };
      
      setFileTree(updateFileInTree(fileTree));
      setHasUnsavedChanges(false);
      
      toast({
        title: "File Saved",
        description: `${selectedFile.name} has been saved successfully.`,
      });
    }
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0): React.ReactNode => {
    return nodes
      .filter(node => 
        searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center py-1 px-2 hover:bg-muted cursor-pointer ${
              selectedFile?.path === node.path ? 'bg-muted' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => node.type === 'folder' ? toggleFolder(node.path) : selectFile(node)}
          >
            {node.type === 'folder' ? (
              <>
                {expandedFolders.has(node.path) ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                {expandedFolders.has(node.path) ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                )}
              </>
            ) : (
              <>
                {node.name.endsWith('.java') ? (
                  <FileCode className="h-4 w-4 mr-2 ml-5 text-orange-500" />
                ) : node.name.endsWith('.xml') ? (
                  <FileText className="h-4 w-4 mr-2 ml-5 text-green-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-2 ml-5 text-gray-600" />
                )}
                {node.isFromUpload && (
                  <FileCheck className="h-3 w-3 mr-1 text-green-500" />
                )}
              </>
            )}
            <span className="text-sm">{node.name}</span>
            {node.isFromUpload && (
              <span className="text-xs text-green-600 ml-2">📁</span>
            )}
          </div>
          {node.type === 'folder' && expandedFolders.has(node.path) && node.children && (
            <div>
              {renderFileTree(node.children, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="flex h-full">
      {/* File Explorer Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-5 w-5" />
            <span className="font-semibold">Project Explorer</span>
            {uploadedTestMethods.length > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {uploadedTestMethods.length} tests
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {fileTree.length > 0 ? (
              renderFileTree(fileTree)
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No project uploaded</p>
                <p className="text-xs">Upload your Java project in Admin panel</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                {selectedFile.name.endsWith('.java') ? (
                  <FileCode className="h-4 w-4 text-orange-500" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="font-medium">{selectedFile.name}</span>
                {hasUnsavedChanges && <span className="text-orange-500">•</span>}
                <span className="text-xs text-muted-foreground">
                  {selectedFile.path}
                </span>
                {selectedFile.isFromUpload && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Uploaded
                  </span>
                )}
              </div>
              <Button size="sm" onClick={saveFile} disabled={!hasUnsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <div className="flex-1 p-3">
              <Textarea
                value={fileContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full resize-none font-mono text-sm"
                placeholder="File content will appear here..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a file to edit</h3>
              <p className="text-sm">
                Choose a file from the project explorer to view and edit its contents
              </p>
              {uploadedTestMethods.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  📁 Upload your Java TestNG project in the Admin panel to see real files
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeViewer;
