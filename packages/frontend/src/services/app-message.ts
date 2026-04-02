import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

type MessageMethod = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'open';

const fallback = (method: MessageMethod, payload: unknown) => {
  const content =
    typeof payload === 'string'
      ? payload
      : typeof payload === 'object' && payload !== null && 'content' in payload
        ? String((payload as { content?: unknown }).content ?? '')
        : '';

  if (content) {
    const logger = method === 'error' ? console.error : console.log;
    logger(`[message.${method}] ${content}`);
  }
};

const invoke = <T extends MessageMethod>(
  method: T,
  ...args: Parameters<MessageInstance[T]>
) => {
  if (messageApi) {
    return (messageApi[method] as (...innerArgs: Parameters<MessageInstance[T]>) => unknown)(...args);
  }

  fallback(method, args[0]);
  return Promise.resolve();
};

export const setAppMessageApi = (api: MessageInstance) => {
  messageApi = api;
};

export const appMessage = {
  success: (...args: Parameters<MessageInstance['success']>) => invoke('success', ...args),
  error: (...args: Parameters<MessageInstance['error']>) => invoke('error', ...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => invoke('warning', ...args),
  info: (...args: Parameters<MessageInstance['info']>) => invoke('info', ...args),
  loading: (...args: Parameters<MessageInstance['loading']>) => invoke('loading', ...args),
  open: (...args: Parameters<MessageInstance['open']>) => invoke('open', ...args),
};
