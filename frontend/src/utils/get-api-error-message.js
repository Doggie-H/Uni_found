const getApiErrorMessage = (
  error,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
) => {
  if (!error) return fallback;

  const responseMessage =
    error?.response?.data?.error || error?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export default getApiErrorMessage;
