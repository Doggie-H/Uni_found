const getBackendOrigin = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const defaultOrigin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";

  if (typeof apiBaseUrl === "string" && /^https?:\/\//i.test(apiBaseUrl)) {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return defaultOrigin;
    }
  }

  return defaultOrigin;
};

export const normalizeImageUrl = (value) => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed;

  const backendOrigin = getBackendOrigin();
  const cleaned = trimmed.replace(/^\.\//, "");

  if (cleaned.startsWith("/api/uploads/")) {
    return `${backendOrigin}${cleaned.replace(/^\/api/, "")}`;
  }

  if (cleaned.startsWith("/uploads/") || cleaned.startsWith("uploads/")) {
    return `${backendOrigin}/${cleaned.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(cleaned);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `${backendOrigin}${parsed.pathname}`;
    }
    return parsed.toString();
  } catch {
    if (cleaned.includes("uploads/")) {
      const relative = cleaned.replace(/^\/+/, "");
      return `${backendOrigin}/${relative}`;
    }
    return cleaned;
  }
};

const normalizeImageUrls = (item) => {
  const candidates = [
    ...(Array.isArray(item?.image_urls) ? item.image_urls : []),
    item?.image_url,
  ];

  return Array.from(
    new Set(
      candidates.map((value) => normalizeImageUrl(value)).filter(Boolean),
    ),
  );
};

export const getItemImageUrls = (item) => normalizeImageUrls(item);

export const getPrimaryItemImage = (item) => getItemImageUrls(item)[0] || null;

export const getItemImageCount = (item) => getItemImageUrls(item).length;
