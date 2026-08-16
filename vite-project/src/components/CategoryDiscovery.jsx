import React from "react";
import { useNavigate } from "react-router-dom";
import { classifyProduct, canonicalCategory } from "../utils/productClassifier";

const generateSlug = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}; const getCategoryGradient = (name, isStore = false) => {
  const lower = name.toLowerCase();

  // Shop by Store specific themes
  if (lower.includes("book store"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(235,220,180,.30), transparent 35%), linear-gradient(135deg, #FFFDF8 0%, #FBF6EA 35%, #F7EDD8 70%, #F2E4C5 100%)`;

  if (lower.includes("noice store"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(180,220,255,.30), transparent 35%), linear-gradient(135deg, #F6FBFF 0%, #ECF6FF 35%, #DDEEFF 70%, #D2E9FF 100%)`;

  if (lower.includes("health hub"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(190,235,200,.30), transparent 35%), linear-gradient(135deg, #F6FFF9 0%, #ECFFF3 35%, #E2FAEC 70%, #D8F5E5 100%)`;

  if (lower.includes("sports & fitness"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(205,235,170,.35), transparent 35%), linear-gradient(135deg, #F9FDF8 0%, #F3FDEE 35%, #ECF9DE 70%, #E2F3CF 100%)`;

  if (lower.includes("gourmet store"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,215,170,.30), transparent 35%), linear-gradient(135deg, #FFF9F2 0%, #FFF1E6 35%, #FFE6D4 70%, #FFDCC4 100%)`;

  if (lower.includes("travel store"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(185,220,255,.30), transparent 35%), linear-gradient(135deg, #F7FBFF 0%, #EEF6FF 35%, #E3F0FF 70%, #D9EAFF 100%)`;

  if (isStore) {
    return "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)";
  }

  // Grocery & Kitchen
  if (lower.includes("vegetable"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(205,235,170,.35), transparent 35%), linear-gradient(135deg, #F9FDF8 0%, #F3FDEE 35%, #F0FAEB 70%, #EAF8E2 100%)`;

  if (lower.includes("fruit"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,221,180,.35), transparent 35%), linear-gradient(135deg, #FFFDF8 0%, #FFF5EA 35%, #FFEFD9 70%, #FFE7CC 100%)`;

  if (lower.includes("dairy"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,241,186,.35), transparent 35%), linear-gradient(135deg, #FFFEF8 0%, #FFFBEA 35%, #FFF7D9 70%, #FFF3C8 100%)`;

  if (
    lower.includes("meat") ||
    lower.includes("seafood")
  )
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(247,205,205,.35), transparent 35%), linear-gradient(135deg, #FFF9F9 0%, #FFF1F1 35%, #FCE5E5 70%, #F8DCDC 100%)`;

  // Snacks & Drinks
  if (lower.includes("cold drink") || lower.includes("juice"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(180,225,255,.30), transparent 35%), linear-gradient(135deg, #F2FAFF 0%, #E8F6FF 35%, #DFF2FF 70%, #D7EEFF 100%)`;

  if (lower.includes("ice cream") || lower.includes("frozen dessert"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(225,210,255,.30), transparent 35%), linear-gradient(135deg, #F8F5FF 0%, #F2ECFF 35%, #ECE3FF 70%, #E7DBFF 100%)`;

  if (lower.includes("chips") || lower.includes("namkeen"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,205,150,.30), transparent 35%), linear-gradient(135deg, #FFF9EF 0%, #FFF2DD 35%, #FFE9CC 70%, #FFE1B8 100%)`;

  if (lower.includes("chocolate"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(230,195,160,.30), transparent 35%), linear-gradient(135deg, #FFF8F1 0%, #FFF2E7 35%, #F7E7D4 70%, #F1D8BE 100%)`;

  if (lower.includes("noodle") || lower.includes("pasta") || lower.includes("vermicelli"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,235,170,.30), transparent 35%), linear-gradient(135deg, #FFFEF8 0%, #FFFBEA 35%, #FFF6D8 70%, #FFF1C5 100%)`;

  if (lower.includes("frozen food"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(190,225,255,.30), transparent 35%), linear-gradient(135deg, #F7FCFF 0%, #EEF8FF 35%, #E4F2FF 70%, #DCEEFF 100%)`;

  if (lower.includes("cake"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,210,225,.30), transparent 35%), linear-gradient(135deg, #FFF9FA 0%, #FFF2F5 35%, #FFE8EF 70%, #FFE0EB 100%)`;

  if (lower.includes("paan"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(185,235,200,.30), transparent 35%), linear-gradient(135deg, #F5FFF7 0%, #ECFDF1 35%, #E3FAE9 70%, #DDF7E6 100%)`;

  // Beauty & Wellness
  if (lower.includes("bath"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(205,235,170,.35), transparent 35%), linear-gradient(135deg, #F9FDF8 0%, #F3FDEE 35%, #F0FAEB 70%, #EAF8E2 100%)`;

  if (lower.includes("hair"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,225,185,.30), transparent 35%), linear-gradient(135deg, #FFFBF7 0%, #FFF4E8 35%, #FDEBD8 70%, #F8E3CB 100%)`;

  if (lower.includes("skin"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(185,235,235,.30), transparent 35%), linear-gradient(135deg, #F5FEFE 0%, #ECFBFB 35%, #DDF7F7 70%, #D2F2F2 100%)`;

  if (lower.includes("makeup"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,205,220,.30), transparent 35%), linear-gradient(135deg, #FFF9FB 0%, #FFF2F6 35%, #FFE7EF 70%, #FFDDE8 100%)`;

  if (lower.includes("oral"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(190,225,255,.30), transparent 35%), linear-gradient(135deg, #F6FCFF 0%, #EDF8FF 35%, #E2F2FF 70%, #D8ECFF 100%)`;

  if (lower.includes("grooming"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(195,225,195,.30), transparent 35%), linear-gradient(135deg, #F8FCF8 0%, #EEF8EF 35%, #E5F3E5 70%, #DBEFDC 100%)`;

  if (lower.includes("baby"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(195,220,255,.30), transparent 35%), linear-gradient(135deg, #F7FBFF 0%, #EEF6FF 35%, #E3F0FF 70%, #D9EAFF 100%)`;

  if (lower.includes("perfume") || lower.includes("fragrance"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(220,205,255,.30), transparent 35%), linear-gradient(135deg, #FBF9FF 0%, #F4F0FF 35%, #ECE5FF 70%, #E4DBFF 100%)`;

  if (lower.includes("protein"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(235,220,180,.30), transparent 35%), linear-gradient(135deg, #FFFDF8 0%, #FBF6EA 35%, #F7EDD8 70%, #F2E4C5 100%)`;

  if (lower.includes("female") || lower.includes("feminine"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,210,225,.30), transparent 35%), linear-gradient(135deg, #FFF9FA 0%, #FFF2F5 35%, #FFE8EF 70%, #FFE0EA 100%)`;

  if (lower.includes("sexual"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,200,190,.30), transparent 35%), linear-gradient(135deg, #FFF9F7 0%, #FFF1ED 35%, #FFE4DD 70%, #FFD8CF 100%)`;

  if (lower.includes("health"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(180,235,210,.30), transparent 35%), linear-gradient(135deg, #F6FFF9 0%, #ECFFF3 35%, #E2FAEC 70%, #D8F5E5 100%)`;

  // Household & Lifestyle
  if (lower.includes("home"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,230,195,.30), transparent 35%), linear-gradient(135deg, #FFFDF9 0%, #FFF6ED 35%, #FDEEDD 70%, #F8E7D1 100%)`;

  if (lower.includes("kitchen") || lower.includes("cooking"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,210,170,.30), transparent 35%), linear-gradient(135deg, #FFF9F4 0%, #FFF2E6 35%, #FFE8D3 70%, #FFDFC4 100%)`;

  if (lower.includes("clean"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(180,235,240,.30), transparent 35%), linear-gradient(135deg, #F5FEFF 0%, #ECFCFD 35%, #E1F8F8 70%, #D5F3F3 100%)`;

  if (lower.includes("cloth"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(190,220,255,.30), transparent 35%), linear-gradient(135deg, #F8FBFF 0%, #EEF6FF 35%, #E4F0FF 70%, #D9EAFF 100%)`;

  if (lower.includes("stationery") || lower.includes("book"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(220,210,255,.30), transparent 35%), linear-gradient(135deg, #FBF9FF 0%, #F4F0FF 35%, #ECE5FF 70%, #E4DCFF 100%)`;

  // Electronics & Appliances
  if (lower.includes("pooja") || lower.includes("puja"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(255,220,150,.30), transparent 35%), linear-gradient(135deg, #FFFDF7 0%, #FFF7E8 35%, #FFEFD1 70%, #FFE6B8 100%)`;

  if (lower.includes("toy"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(225,210,255,.30), transparent 35%), linear-gradient(135deg, #FBF9FF 0%, #F4F0FF 35%, #ECE5FF 70%, #E4DCFF 100%)`;

  if (lower.includes("sports"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(205,235,170,.35), transparent 35%), linear-gradient(135deg, #F9FDF8 0%, #F3FDEE 35%, #ECF9DE 70%, #E2F3CF 100%)`;

  if (lower.includes("pet"))
    return `radial-gradient(circle at 25% 20%, rgba(255,255,255,.55), transparent 30%), radial-gradient(circle at 80% 85%, rgba(190,220,255,.30), transparent 35%), linear-gradient(135deg, #F8FBFF 0%, #EEF6FF 35%, #E4F0FF 70%, #D9EAFF 100%)`;

  if (
    lower.includes("snack") ||
    lower.includes("sweet")
  )
    return "linear-gradient(180deg,#FFF7E8,#FFE9BF)";

  return "linear-gradient(180deg,#F7FDEB,#EAF7D7)";
};

const getCategoryBorder = (name) => {
  const lower = name.toLowerCase();
  // Grocery & Kitchen
  if (lower.includes("vegetable")) return "#D5E9BF";
  if (lower.includes("fruit")) return "#F5D7A4";
  if (lower.includes("dairy")) return "#F5E2A8";
  if (lower.includes("meat") || lower.includes("seafood")) return "#EFC8C8";

  // Snacks & Drinks
  if (lower.includes("cold drink") || lower.includes("juice")) return "#C9E8FF";
  if (lower.includes("ice cream") || lower.includes("frozen dessert")) return "#DCCEFF";
  if (lower.includes("chips") || lower.includes("namkeen")) return "#FFD19A";
  if (lower.includes("chocolate")) return "#E6C6A4";
  if (lower.includes("noodle") || lower.includes("pasta") || lower.includes("vermicelli")) return "#F5E3A4";
  if (lower.includes("frozen food")) return "#CFE5FF";
  if (lower.includes("cake")) return "#F4C8D7";
  if (lower.includes("paan")) return "#C7EACF";

  // Beauty & Wellness
  if (lower.includes("bath")) return "#D5E9BF";
  if (lower.includes("hair")) return "#EFD7B6";
  if (lower.includes("skin")) return "#CBECEC";
  if (lower.includes("makeup")) return "#F3CAD8";
  if (lower.includes("oral")) return "#CAE4FF";
  if (lower.includes("grooming")) return "#D2E7D2";
  if (lower.includes("baby")) return "#D1E5FF";
  if (lower.includes("perfume") || lower.includes("fragrance")) return "#D9CCFF";
  if (lower.includes("protein")) return "#E7D7AF";
  if (lower.includes("female") || lower.includes("feminine")) return "#F5CBD8";
  if (lower.includes("sexual")) return "#F3C7BB";
  if (lower.includes("health")) return "#CBEBD8";

  // Household & Lifestyle
  if (lower.includes("home")) return "#EDD7BA";
  if (lower.includes("kitchen") || lower.includes("cooking")) return "#F3D0A6";
  if (lower.includes("clean")) return "#CBECEC";
  if (lower.includes("cloth")) return "#D0E4FF";
  if (lower.includes("stationery") || lower.includes("book")) return "#D9CDFF";

  // Electronics & Appliances
  if (lower.includes("pooja") || lower.includes("puja")) return "#F5D59A";
  if (lower.includes("toy")) return "#D9CDFF";
  if (lower.includes("sports")) return "#D5E9BF";
  if (lower.includes("pet")) return "#D0E4FF";

  // Shop by Store specific borders
  if (lower.includes("book store")) return "#E7D7AF";
  if (lower.includes("noice store")) return "#CBE0FF";
  if (lower.includes("health hub")) return "#CBEBD8";
  if (lower.includes("sports & fitness")) return "#D5E9BF";
  if (lower.includes("gourmet store")) return "#F2D2AF";
  if (lower.includes("travel store")) return "#D0E4FF";

  return "rgba(49, 134, 22, 0.08)";
};

const getCategoryBadge = (name, isStore = false) => {
  if (isStore) return "Best Seller";

  const lower = name.toLowerCase();

  if (lower.includes("vegetable")) return "Organic";
  if (lower.includes("fruit")) return "Fresh";
  if (lower.includes("dairy")) return "Daily";
  if (
    lower.includes("meat") ||
    lower.includes("seafood")
  )
    return "Premium";
  if (lower.includes("sweet")) return "Trending";
  if (lower.includes("drink")) return "Chilled";
  if (lower.includes("paan")) return "New";

  return "Popular";
};

const discoverySections = [
  {
    title: "Grocery & Kitchen",
    items: [
      { name: "Fresh Vegetables", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243224/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3_qoyjgq.png" },
      { name: "Fresh Fruits", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243231/09a3ae13-6792-479b-a564-bf116f84b317_068761a9-938f-4c18-bb9e-8e190bf57a45_wucu2q.png" },
      { name: "Dairy, Bread & Eggs", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243236/ceb53190-72a3-466b-a892-8989615788c9_fe00456c-3b5a-4e74-80e2-c274a4c9f818_gxviej.png" },
      { name: "Meat & Seafood", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243317/9c48b537-eef1-4047-becb-ddb7e79c373d_72aac542-4cef-4cf9-a9dd-5f1b862165c1_dxk14f.png" },
    ]
  },
  {
    title: "Snacks & Drinks",
    items: [
      { name: "Cold Drinks & Juices", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243351/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a_uftkev.png" },
      { name: "Ice Creams & Frozen Desserts", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243355/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240_jnbnil.png" },
      { name: "Chips & Namkeens", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243360/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898_mijtiv.png" },
      { name: "Chocolates", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243365/405730cd-115c-4530-8f32-74e50c09f378_1dab5493-a168-4485-a66f-da4bc7510de3_sr2cdg.png" },
      { name: "Noodles, Pasta & Vermicelli", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243370/6a51d704-b2cc-4787-aced-162fae80a0ce_042fb322-f6db-412d-ba43-f83d090aa463_wiaglo.png" },
      { name: "Frozen Food", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243375/bf978cbc-ab49-4a43-b23e-41352f4fe33d_dd569df9-8e7b-4e55-bc88-ef692b4d471f_juxpmp.png" },
      { name: "Cake Corner", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243380/baa03922-9920-4588-b397-a5faad7f4ff5_b2be157f-a054-402a-b5e6-dbb8eff8ae4a_f7elox.png" },
      { name: "Paan Corner", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243385/822a816f-42b1-44ea-a605-98936352f195_2cf4e5c9-61eb-4c20-91d3-5a3b04af44e8_b07nhs.png" },
    ]
  },
  {
    title: "Beauty & Wellness",
    items: [
      { name: "Bath & Body", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243391/46b1b550-1e5f-423e-967b-e1cf3a608bb8_13bc4f93-eab7-4263-a592-54f144d0eec6_ch3gzv.png" },
      { name: "Hair Care", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243395/73dd2be1-fd81-4540-8286-02db395de0e5_5da6d646-978e-4b00-bfd4-63cbe897c0b2_swk6ti.png" },
      { name: "Skin Care", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243400/d6930a4e-6a3c-44c9-8b6b-86f63e20434a_0c08d4e2-6423-4a9e-ad4b-35b339a149b0_jgix4i.png" },
      { name: "Makeup", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243405/7c05fd2b-1ea8-4ce4-9b9e-0ba402d3f698_b802ea7a-3d08-44f0-ac8e-4793e4806f67_umsbw1.png" },
      { name: "Oral Care", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243410/d753ff8d-4cdb-4548-bba2-b10e480cc6b2_28cfcd55-1e7f-4333-a5d5-15c023b8b58d_dnl5uz.png" },
      { name: "Grooming", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243416/6fd76e5f-016b-4810-94fd-252eab4245a6_2edc9535-9e14-49cf-a05e-25fa4ca45cb8_cme6hr.png" },
      { name: "Baby Care", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243421/838ef0d0-8687-447a-8520-95b6700b70f6_a08f1496-3e1f-425f-bdd5-90d1e2bfce5d_qgcvpf.png" },
      { name: "Perfumes", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243426/d0f1c0f3-5dc4-422e-9120-222c0afc4043_2588dd56-663e-43f0-a14b-1a537b8301a9_o6xokw.png" },
      { name: "Protein & Supplements", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243431/15c3c8f7-74df-4077-b436-bf499ddc1987_1472c5c1-badd-4a53-adef-74be13e84abc_n2qzfr.png" },
      { name: "Female Hygiene", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243436/f9937881-a78c-4f8e-a381-e10a4fa26fde_b49bb726-58bd-4d38-b4d4-252d152c0b3e_qgzslz.png" },
      { name: "Sexual Wellness", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243440/9961e13f-8231-419b-b36f-5a07bd1ddaed_4b1fd87f-e585-494a-88d0-fc87bdc10a6e_ivc8p1.png" },
      { name: "Health & Pharma", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243445/e0c08b1d-acf8-4f07-b8b6-5195392cda43_2f75a368-330a-4237-afb8-30571efe666a_qztp09.png" },
    ]
  },
  {
    title: "Household & Lifestyle",
    items: [
      { name: "Home Holds", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245595/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2_sbqlin.png" },
      { name: "Kitchen & Cooking", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png" },
      { name: "Cleaning Essentials", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245604/b332fa4a-4a15-4c32-8bb8-f46b34ef13d5_ff40260d-3a00-40e7-b019-69ecebed8a91_oio0of.png" },
      { name: "Clothing Section", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245609/93cce7bf-96cc-4ff6-adfc-a248c2a8cb94_783cd072-3e52-4daf-996a-4652d000d943_nuejlo.png" },
      { name: "Stationery", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245625/e1e37212-1b34-4711-927e-bce563247de7_60934c30-e762-4a81-ba56-8bf6f30b6766_aypair.png" },
    ]
  },
  {
    title: "Electronics & Appliances",
    items: [
      { name: "Pooja Essentials", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245634/965c898a-bc67-4fe8-8fd4-d13e1eb79772_c38285f9-727d-422b-ad77-e1e22d4d251d_us2el2.png" },
      { name: "Toys & Games", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245639/79f943d8-2977-4753-bab0-1a74f582d6b8_7a341dcf-099f-4617-a44f-d28c55de560a_sjvrrs.png" },
      { name: "Sports", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245644/06414bae-6149-4a26-8ca5-a5afffb3f753_171a212b-1edd-4a68-a424-46e240270a3b_grkd9i.png" },
      { name: "Pet Essentials", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245650/b936925b-340a-4d1a-a423-0ecbc989d8ee_f70daa6c-8b2f-45d5-86e5-ced16b437ce4_axdbed.png" },
    ]
  },
  {
    title: "Shop by Store",
    isStore: true,
    items: [
      { name: "Book Store", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256637/812dcf2d-fe8d-4be2-9705-ade4ca80387d_ShopbystoreBookStore_tdk79i.png" },
      { name: "The Noice Store", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256647/e9381438-2434-438e-a7b8-2fdce75c6000_noicestore107x1371_rrklqf.png" },
      { name: "Health Hub", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256663/3e54b1bf-5cc1-4a48-a84b-43590c499654_Healthhub107x1371_bow0by.png" },
      { name: "Sports & Fitness Store", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256666/d127e038-f957-4f94-a558-5439a1846e20_SBS_y9o95u.png" },
      { name: "Gourmet Store", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256678/78b18fba-289d-43ef-8ff9-1c1c66b363b0_GourmetStore107x137_bz8q18.png" },
      { name: "Travel Store", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783256684/437bc09c-3277-438a-afbd-93639c3c7a9e_TravelStore107x137_zkebgm.png" },
    ]
  }
];

const leftBanners = [
  {
    image: "/images/buyto_banner.png",
    alt: "Buyto Special",
    link: "/category/"
  }
];

const rightBanners = [
  {
    image: "/images/buy.png",
    alt: "Monsoon Deals",
    link: "/category/electronics-appliances"
  }
];

function CategoryDiscovery({ products = [] }) {
  const navigate = useNavigate();


  const handleCardClick = (name) => {
    const slug = generateSlug(name);
    console.log("Category Discovery Clicked:", name, "Slug:", slug);
    navigate(`/category/${slug}`);
  };

  const dynamicSections = React.useMemo(() => {
    return discoverySections.map(section => {
      const updatedItems = section.items.map(item => {
        const itemCanonical = canonicalCategory(item.name);

        // Find all products matching this item
        const matchingProducts = (products || []).filter(p => {
          const classified = p._classifiedCategory || canonicalCategory(classifyProduct(p));
          return classified === itemCanonical;
        });

        // Curated category image OR fallback to first available product image
        const dynamicImage = item.image
          ? item.image
          : (matchingProducts.length > 0 && matchingProducts[0].image ? matchingProducts[0].image : "");

        return {
          ...item,
          image: dynamicImage,
          count: matchingProducts.length
        };
      });

      return {
        ...section,
        items: updatedItems
      };
    });
  }, [products]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "24px",
        padding: "20px 0",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        marginBottom: "24px"
      }}
    >
      {dynamicSections.map((section) => {
        const isPremium = section.title === "Grocery & Kitchen" || section.title === "Snacks & Drinks" || section.title === "Beauty & Wellness" || section.title === "Household & Lifestyle" || section.title === "Electronics & Appliances";
        return (
          <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "900",
                color: "#111827",
                margin: 0,
                paddingLeft: "4px"
              }}
            >
              {section.title}
            </h2>
            <div className="category-discovery-grid">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleCardClick(item.name)}
                  className="category-discovery-item group"
                >
                  <div
                    className="category-discovery-card"
                    style={{
                      background: getCategoryGradient(item.name, section.isStore),
                      border: `1px solid ${getCategoryBorder(item.name)}`,
                      ...(section.isStore ? { overflow: "visible" } : {})
                    }}
                  >
                    <div
                      className="category-discovery-image-wrapper"
                      style={section.isStore ? { width: "100%", height: "100%", transform: "scale(1.25)", transformOrigin: "center center" } : {}}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="category-discovery-img"
                        loading="lazy"
                        style={section.isStore ? { width: "100%", height: "100%", objectFit: "contain" } : {}}
                      />
                    </div>
                  </div>
                  <h3 className="category-discovery-text">{item.name}</h3>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Static promotion banners: two images in a single row side-by-side */}
      <div
        style={{
          padding: "0 4px",
          marginTop: "16px",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          {/* Left Banner */}
          <div
            onClick={() => navigate(leftBanners[0].link)}
            style={{
              flex: 1,
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              aspectRatio: "1.65/1",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <img
              src={leftBanners[0].image}
              alt={leftBanners[0].alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center"
              }}
            />
          </div>

          {/* Right Banner */}
          <div
            onClick={() => navigate(rightBanners[0].link)}
            style={{
              flex: 1,
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              aspectRatio: "1.65/1",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <img
              src={rightBanners[0].image}
              alt={rightBanners[0].alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center"
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .category-discovery-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: 22px;
          row-gap: 22px;
        }

        .category-discovery-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          box-sizing: border-box;
          text-decoration: none;
        }

        .category-discovery-card {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          background-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 300ms ease;
          box-sizing: border-box;
          overflow: hidden;
          border: none;
          position: relative;
        }

        .dark .category-discovery-card {
          background-color: transparent !important;
          border-color: transparent !important;
        }

        .category-discovery-item:hover .category-discovery-card {
          transform: translateY(-4px);
        }

        .category-discovery-image-wrapper {
          width: 90%;
          height: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 300ms ease;
        }

        .category-discovery-item:hover .category-discovery-image-wrapper {
          transform: scale(1.05);
        }

        .category-discovery-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .category-discovery-text {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.25;
          text-align: center;
          margin: 6px 0 0 0;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 32px;
        }

        .dark .category-discovery-text {
          color: #f3f4f6 !important;
        }

        @media (min-width: 768px) {
          .category-discovery-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            column-gap: 20px;
            row-gap: 28px;
          }
          .category-discovery-card {
            border-radius: 20px;
          }
          .category-discovery-text {
            font-size: 17.5px;
            margin-top: 10px;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
}

export default React.memo(CategoryDiscovery);
