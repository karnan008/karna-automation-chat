
export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export class SlackService {
  private botToken: string;
  private defaultChannel: string;

  constructor(botToken: string, defaultChannel: string) {
    this.botToken = botToken;
    this.defaultChannel = defaultChannel;
  }

  async postMessage(message: string, channel?: string): Promise<boolean> {
    if (!this.botToken) {
      throw new Error('Slack bot token is not configured');
    }

    const targetChannel = channel || this.defaultChannel;
    
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: targetChannel,
          text: message,
          username: 'k.ai',
          icon_emoji: ':robot_face:',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('Slack API error:', result.error);
        throw new Error(`Slack API error: ${result.error}`);
      }

      return true;
    } catch (error) {
      console.error('Error posting to Slack:', error);
      throw error;
    }
  }

  async postTestReport(testResults: any[], summary: string, channel?: string): Promise<boolean> {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'success').length;
    const failedTests = totalTests - passedTests;
    
    const reportMessage = `
🤖 *k.ai Test Execution Report*

📊 *Summary:*
• Total Tests: ${totalTests}
• Passed: ✅ ${passedTests}
• Failed: ❌ ${failedTests}
• Success Rate: ${Math.round((passedTests / totalTests) * 100)}%

🧠 *AI Analysis:*
${summary}

📅 *Executed:* ${new Date().toLocaleString()}
    `.trim();

    return this.postMessage(reportMessage, channel);
  }
}
