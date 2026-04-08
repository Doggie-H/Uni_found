const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const PRESET_IMAGES = {
  "tai nghe airpods pro": [
    "https://upload.wikimedia.org/wikipedia/commons/8/83/AirPods_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Airpods_4.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Airpods_and_Airpods_Pro_being_displayed_in_electronics_retail_store.jpg",
  ],
  "airpods pro": [
    "https://upload.wikimedia.org/wikipedia/commons/8/83/AirPods_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Airpods_4.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Airpods_and_Airpods_Pro_being_displayed_in_electronics_retail_store.jpg",
  ],
  "vi da den": [
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/WalletMpegMan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/96/I-CLIP_Slim_Wallet_03.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/12/I-CLIP_Slim_Wallet_02.jpg",
  ],
  vi: [
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/WalletMpegMan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/96/I-CLIP_Slim_Wallet_03.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/12/I-CLIP_Slim_Wallet_02.jpg",
  ],
  "laptop dell xps 13": [
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/IBM_Thinkpad_R51.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Schenker_VIA14_Laptop_asv2021-01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/06/Notebook_computer.jpeg",
  ],
  laptop: [
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/IBM_Thinkpad_R51.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Schenker_VIA14_Laptop_asv2021-01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/06/Notebook_computer.jpeg",
  ],
  "mat the sinh vien ued": [
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/International_Student_Identity_Card.png",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Taipei_Nangang_Community_College_student_identity_card_20160805.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/Banaras_Hindu_University_Student_Identity_Card_Old.jpg",
  ],
  "the sinh vien ued": [
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/International_Student_Identity_Card.png",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Taipei_Nangang_Community_College_student_identity_card_20160805.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/Banaras_Hindu_University_Student_Identity_Card_Old.jpg",
  ],
  "mat balo den": [
    "https://upload.wikimedia.org/wikipedia/commons/8/8a/Arcteryx_Alpha_Fast_light_40_black_backpack.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/02/Eastpak_Sugarbush_backpack_black.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Woman_with_black_backpack_in_Paris.jpg",
  ],
  "balo den": [
    "https://upload.wikimedia.org/wikipedia/commons/8/8a/Arcteryx_Alpha_Fast_light_40_black_backpack.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/02/Eastpak_Sugarbush_backpack_black.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Woman_with_black_backpack_in_Paris.jpg",
  ],
  "the xe va chia khoa": [
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Car_Keys.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Keychain_with_text_%22Encryption_is_key%22.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Key_chain_4.jpg",
  ],
  chiakhoa: [
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Car_Keys.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Keychain_with_text_%22Encryption_is_key%22.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Key_chain_4.jpg",
  ],
};

const FALLBACK_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/a/a0/Car_Keys.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3c/WalletMpegMan.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/06/Notebook_computer.jpeg",
];

const buildItemImagePresets = (item) => {
  const titleKey = normalizeText(item?.title);
  const categoryKey = normalizeText(item?.category);
  const titleTokens = titleKey.replace(/[^a-z0-9]+/g, " ").trim();

  if (
    titleTokens.includes("chia khoa") ||
    titleTokens.includes("the xe") ||
    titleTokens === "chìa khoá"
  ) {
    return PRESET_IMAGES["the xe va chia khoa"];
  }

  if (
    titleTokens.includes("vi da den") ||
    titleKey === "vi da den" ||
    categoryKey === "vi/giay to" ||
    categoryKey.includes("giay to")
  ) {
    return PRESET_IMAGES["vi da den"];
  }

  if (titleTokens.includes("balo den") || titleTokens.includes("balo")) {
    return PRESET_IMAGES["mat balo den"];
  }

  if (titleTokens.includes("the sinh vien")) {
    return PRESET_IMAGES["mat the sinh vien ued"];
  }

  return (
    PRESET_IMAGES[titleKey] || PRESET_IMAGES[categoryKey] || FALLBACK_IMAGES
  );
};

module.exports = {
  buildItemImagePresets,
};
