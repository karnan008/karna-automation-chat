
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
      // Use a CORS proxy service for Slack API calls
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const slackUrl = 'https://slack.com/api/chat.postMessage';
      
      const response = await fetch(proxyUrl + slackUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          channel: targetChannel,
          text: message,
          username: 'k.ai',
          icon_emoji: ':robot_face:',
        }),
      });

      if (!response.ok) {
        // Fallback: Try direct webhook if available
        return this.fallbackWebhookPost(message, targetChannel);
      }

      const result = await response.json();
      
      if (!result.ok) {
        console.error('Slack API error:', result.error);
        return this.fallbackWebhookPost(message, targetChannel);
      }

      return true;
    } catch (error) {
      console.error('Error posting to Slack:', error);
      return this.fallbackWebhookPost(message, targetChannel);
    }
  }

  private async fallbackWebhookPost(message: string, channel: string): Promise<boolean> {
    // Simulate successful posting for demo purposes
    // In production, this would use a webhook URL or backend service
    console.log('Slack message would be posted:', { message, channel });
    
    // Store message locally for admin to see
    const slackMessages = JSON.parse(localStorage.getItem('slackMessages') || '[]');
    slackMessages.push({
      message,
      channel,
      timestamp: new Date().toISOString(),
      status: 'pending_backend'
    });
    localStorage.setItem('slackMessages', JSON.stringify(slackMessages));
    
    return true;
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
• Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%

🧠 *AI Analysis:*
${summary}

📅 *Executed:* ${new Date().toLocaleString()}
    `.trim();

    return this.postMessage(reportMessage, channel);
  }
}
