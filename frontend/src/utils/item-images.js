const normalizeImageUrls = (item) => {
  const candidates = [
    ...(Array.isArray(item?.image_urls) ? item.image_urls : []),
    item?.image_url,
  ];

  return Array.from(
    new Set(
      candidates
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  );
};

export const getItemImageUrls = (item) => normalizeImageUrls(item);

export const getPrimaryItemImage = (item) => getItemImageUrls(item)[0] || null;

export const getItemImageCount = (item) => getItemImageUrls(item).length;
