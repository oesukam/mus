import { AsyncLocalStorage } from 'async_hooks';

type RequestContext = {
  logPayload: {
    requestId?: string;
    method?: string;
    url?: string;
    userId?: string;
    origin?: string;
    clientRequestId?: string;
    serviceRequestId?: string;
    ip?: string;
    userAgent?: string;
  };
};

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const RequestContext = {
  run: <T>(context: RequestContext, callback: () => T) => {
    return asyncLocalStorage.run(context, callback);
  },
  get: (): RequestContext | undefined => {
    return asyncLocalStorage.getStore();
  },
  set: (extra: Partial<RequestContext>) => {
    const store = asyncLocalStorage.getStore();
    if (store) {
      Object.assign(store, extra);
    }
  },
};
