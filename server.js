import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// API endpoint to execute commands
app.post('/api/execute-command', (req, res) => {
  const { command, workingDirectory, outputDirectory } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  console.log(`🚀 Executing command: ${command}`);
  console.log(`📂 Working directory: ${workingDirectory}`);
  console.log(`📁 Output directory: ${outputDirectory}`);
  
  // Set the working directory
  const execOptions = {
    cwd: workingDirectory || process.cwd(),
    timeout: 300000, // 5 minutes timeout
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  };
  
  // Create output directory if it doesn't exist
  if (outputDirectory) {
    try {
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }
  
  // Execute the command
  exec(command, execOptions, (error, stdout, stderr) => {
    const result = {
      command: command,
      workingDirectory: execOptions.cwd,
      exitCode: error ? error.code || 1 : 0,
      stdout: stdout || '',
      stderr: stderr || '',
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      console.error(`❌ Command failed with exit code ${error.code || 1}`);
      console.error(`Error: ${error.message}`);
      console.error(`Stderr: ${stderr}`);
    } else {
      console.log(`✅ Command executed successfully`);
      console.log(`Stdout: ${stdout}`);
    }
    
    res.json(result);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Command execution API available at http://localhost:${PORT}/api/execute-command`);
});