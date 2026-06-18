export const categoryFallbackImages = {
  "Fresh Fruits": "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500",
  "Fresh Vegetables": "https://images.unsplash.com/photo-1566385101042-1a010c129fa6?w=500",
  "Dairy, Bread & Eggs": "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?w=500",
  "Meat & Seafood": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500",
  "Cold Drinks & Juices": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500",
  "Ice Creams & Frozen Desserts": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500",
  "Chocolates": "https://images.unsplash.com/photo-1548907040-4d42b52125e0?w=500",
  "Noodles, Pasta & Vermicelli": "https://images.unsplash.com/photo-1612966608967-302fa54d87da?w=500",
  "Frozen Food": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
  "Sweet Corner": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500",
  "Paan Corner": "https://images.unsplash.com/photo-1600613865688-66a9829f0464?w=500",
  "Mobiles & Electronics": "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500",
  "Books & Stationery": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500",
  "Clothing": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500",
  "Cleaning Essentials": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500",
  "Bath & Body": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500",
  "Hair Care": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
  "Skin Care": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=500",
  "Makeup": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500",
  "Fragrances": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500",
  "Sexual Wellness": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500",
  "Health & Pharma": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500",
  "Chips & Namkeens": "https://images.unsplash.com/photo-1599490659213-e2b9527ec087?w=500",
  "Atta, Rice and Dal": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
  "Default": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500" // Buyto default placeholder
};

export const getFallbackImage = (product) => {
  if (!product) return categoryFallbackImages["Default"];
  
  // Clean / normalize category name using existing product classification
  const category = product.category || "";
  if (categoryFallbackImages[category]) {
    return categoryFallbackImages[category];
  }
  return categoryFallbackImages["Default"];
};
