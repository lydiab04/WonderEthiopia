export function formatError(error: any, status: number = 500) {
  const requestId = crypto.randomUUID?.();
  console.error(`[${requestId}] Error (${status}):`, error);
  return {
    error: error.message || "Server error",
    details: {
      name: error.name,
      stack: error.stack,
      code: error.code,
      requestId,
    },
    status,
  };
}
