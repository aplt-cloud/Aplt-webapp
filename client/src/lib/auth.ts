import * as Sentry from "@sentry/react";

export const handleAuthError = (error: any, context: string) => {
  console.error(`Auth Error [${context}]:`, error);
  Sentry.captureException(error, {
    extra: { context }
  });
  return error.message || 'An unexpected error occurred';
};

// Wrappers for auth operations can be added here if needed,
// but often we use them directly in components or hooks.
