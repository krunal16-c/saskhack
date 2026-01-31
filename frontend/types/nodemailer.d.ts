declare module "nodemailer" {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user: string; pass: string };
  }

  export interface SendMailOptions {
    from?: string;
    to: string | string[];
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface SentMessageInfo {
    messageId: string;
  }

  export interface Transporter {
    sendMail(
      mailOptions: SendMailOptions,
      callback?: (err: Error | null, info: SentMessageInfo) => void
    ): Promise<SentMessageInfo>;
  }

  export function createTransport(options: TransportOptions): Transporter;
  export function getTestMessageUrl(info: SentMessageInfo): string | false;

  const nodemailer: {
    createTransport: typeof createTransport;
    getTestMessageUrl: typeof getTestMessageUrl;
  };
  export default nodemailer;
}
