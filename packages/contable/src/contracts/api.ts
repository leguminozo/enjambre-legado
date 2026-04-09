export type ApiSuccess<T> = {
  data: T;
  requestId?: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};
