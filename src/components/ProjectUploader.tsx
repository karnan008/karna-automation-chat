
import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, FileCode, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JavaTestParser, ParsedTestMethod } from '@/services/JavaTestParser';

interface ProjectUploaderProps {
  onTestMethodsExtracted: (methods: ParsedTestMethod[]) => void;
}

const ProjectUploader = ({ onTestMethodsExtracted }: ProjectUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedProject, setUploadedProject] = useState<string | null>(null);
  const [extractedMethods, setExtractedMethods] = useState<ParsedTestMethod[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Extract Java files
      const javaFiles = Array.from(files).filter(file => file.name.endsWith('.java'));
      
      if (javaFiles.length === 0) {
        toast({
          title: "No Java Files Found",
          description: "Please upload a folder containing Java test files.",
          variant: "destructive"
        });
        return;
      }

      // Parse Java files for @Test methods
      const methods = await JavaTestParser.parseJavaFiles(files);
      
      if (methods.length === 0) {
        toast({
          title: "No Test Methods Found",
          description: "No @Test annotated methods were found in the uploaded files.",
          variant: "destructive"
        });
        return;
      }

      // Store in localStorage for persistence
      localStorage.setItem('uploadedTestMethods', JSON.stringify(methods));
      
      setExtractedMethods(methods);
      setUploadedProject(files[0].webkitRelativePath.split('/')[0] || 'Uploaded Project');
      onTestMethodsExtracted(methods);

      toast({
        title: "Project Uploaded Successfully",
        description: `Found ${methods.length} test methods in ${javaFiles.length} Java files.`
      });

    } catch (error) {
      console.error('Error processing project:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process the uploaded project.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearProject = () => {
    setUploadedProject(null);
    setExtractedMethods([]);
    localStorage.removeItem('uploadedTestMethods');
    onTestMethodsExtracted([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Project Cleared",
      description: "Uploaded project data has been removed."
    });
  };

  // Load saved methods on component mount
  React.useEffect(() => {
    const savedMethods = localStorage.getItem('uploadedTestMethods');
    if (savedMethods) {
      try {
        const methods = JSON.parse(savedMethods);
        setExtractedMethods(methods);
        setUploadedProject('Previously Uploaded Project');
        onTestMethodsExtracted(methods);
      } catch (error) {
        console.error('Error loading saved test methods:', error);
      }
    }
  }, [onTestMethodsExtracted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Java TestNG Project Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadedProject ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Java TestNG Project</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select your entire project folder containing Java test files with @Test annotations
              </p>
              <input
                ref={fileInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderUpload}
                className="hidden"
                accept=".java,.xml,.properties"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? 'Processing...' : 'Select Project Folder'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>• Upload your complete Java Selenium TestNG project folder</p>
              <p>• The system will scan for @Test annotated methods</p>
              <p>• Dependencies and configuration files will be preserved</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">{uploadedProject}</div>
                  <div className="text-sm text-muted-foreground">
                    {extractedMethods.length} test methods extracted
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearProject}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Extracted Test Methods ({extractedMethods.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {extractedMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-2 bg-background border rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{method.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {method.className}#{method.methodName}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {method.keywords.slice(0, 2).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectUploader;
