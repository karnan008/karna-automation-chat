
export interface TestReportData {
  testResults: Array<{
    name: string;
    status: 'success' | 'failure';
    duration?: number;
    error?: string;
  }>;
  summary: string;
  executionDate: Date;
  companyLogo?: string;
}

export class PDFReportService {
  static async generatePDFReport(data: TestReportData): Promise<void> {
    // Create HTML content for the PDF
    const htmlContent = this.generateHTMLReport(data);
    
    // Convert to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  }

  static async downloadPDFReport(data: TestReportData): Promise<void> {
    const htmlContent = this.generateHTMLReport(data);
    
    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${data.executionDate.toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static generateHTMLReport(data: TestReportData): string {
    const passedTests = data.testResults.filter(t => t.status === 'success');
    const failedTests = data.testResults.filter(t => t.status === 'failure');
    const passRate = data.testResults.length > 0 ? 
      Math.round((passedTests.length / data.testResults.length) * 100) : 0;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>k.ai Test Execution Report</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            max-height: 60px;
            margin-bottom: 20px;
        }
        .content {
            padding: 30px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .card.success {
            border-left-color: #28a745;
        }
        .card.failure {
            border-left-color: #dc3545;
        }
        .card-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .card-label {
            color: #666;
            font-size: 0.9rem;
        }
        .chart-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .pie-chart {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: conic-gradient(
                #28a745 0deg ${passRate * 3.6}deg,
                #dc3545 ${passRate * 3.6}deg 360deg
            );
            margin: 20px auto;
            position: relative;
        }
        .pie-chart::after {
            content: '${passRate}%';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
        }
        .test-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-failure {
            background: #f8d7da;
            color: #721c24;
        }
        .ai-summary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            color: #666;
            padding: 20px;
            border-top: 1px solid #eee;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${data.companyLogo ? `<img src="${data.companyLogo}" alt="Company Logo" class="logo">` : ''}
            <h1>k.ai Test Execution Report</h1>
            <p>Automated Test Results - ${data.executionDate.toLocaleDateString()}</p>
        </div>
        
        <div class="content">
            <div class="summary-cards">
                <div class="card">
                    <div class="card-value">${data.testResults.length}</div>
                    <div class="card-label">Total Tests</div>
                </div>
                <div class="card success">
                    <div class="card-value">${passedTests.length}</div>
                    <div class="card-label">Passed</div>
                </div>
                <div class="card failure">
                    <div class="card-value">${failedTests.length}</div>
                    <div class="card-label">Failed</div>
                </div>
                <div class="card">
                    <div class="card-value">${passRate}%</div>
                    <div class="card-label">Success Rate</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Test Results Distribution</h3>
                <div class="pie-chart"></div>
            </div>
            
            <div class="ai-summary">
                <h3>🤖 k.ai Analysis Summary</h3>
                <p>${data.summary}</p>
            </div>
            
            <div class="test-details">
                <h3>Detailed Test Results</h3>
                ${data.testResults.map(test => `
                    <div class="test-item">
                        <div>
                            <strong>${test.name}</strong>
                            ${test.error ? `<br><small style="color: #dc3545;">${test.error}</small>` : ''}
                        </div>
                        <div>
                            ${test.duration ? `<span style="margin-right: 10px;">${test.duration.toFixed(1)}s</span>` : ''}
                            <span class="status-badge status-${test.status}">${test.status.toUpperCase()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by k.ai - Commusoft Automation Platform</p>
            <p>Powered by Karna Technologies</p>
        </div>
    </div>
</body>
</html>`;
  }
}
