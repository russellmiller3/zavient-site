import { WorkerEntrypoint } from 'cloudflare:workers';

export { default } from './index.js';

// Pages can call this named entrypoint through a private service binding.
export class AskAiTranscriptEmail extends WorkerEntrypoint {
  async sendCopy(email, transcript, clientIp) {
    if (typeof clientIp !== 'string' || !/^[\da-f.:]{3,45}$/i.test(clientIp)) return false;
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email) ||
        typeof transcript !== 'string' || !transcript || transcript.length > 30000) {
      throw new Error('Invalid transcript email');
    }
    const { success } = await this.env.ASK_AI_LEAD_LIMIT.limit({ key: clientIp });
    if (!success) return false;
    await this.env.ASK_AI_EMAIL.send({
      from: this.env.ASK_AI_EMAIL_FROM,
      to: email,
      subject: 'Your Zarlent Ask AI transcript',
      text: transcript,
    });
    return true;
  }
}
