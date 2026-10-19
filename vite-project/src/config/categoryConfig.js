export const getCategoryFromPathname = (pathname) => {
  if (pathname === "/") return "home";
  if (pathname === "/categories") return "categories";
  if (pathname.includes("electronics")) return "electronics";
  if (pathname.includes("beauty")) return "beauty";
  if (pathname.includes("pharmacy")) return "pharmacy";
  if (pathname.includes("decor")) return "decor";
  if (pathname.includes("kids")) return "kids";
  if (pathname.includes("gift")) return "gift";
  return "default";
};

export const categoryRouteMap = {
  // Fresh & Grocery
  "fresh-vegetables": "The Veggie Store",
  "fresh-fruits": "The Fruit Store",
  "dairy-bread-eggs": "Dairy, Bread & Eggs",
  "dairy-bread-and-eggs": "Dairy, Bread & Eggs",
  "meat-seafood": "Meat and Seafood",
  "meat-and-seafood": "Meat and Seafood",
  "atta-rice-and-dal": "Atta, Rice and Dal",
  "atta-rice-dal": "Atta, Rice and Dal",
  "masalas": "Masalas",
  "oils-and-ghee": "Oils and Ghee",
  "oil-ghee": "Oils and Ghee",
  "cereals-breakfast": "Cereals & Breakfast",
  "breakfast": "Cereals & Breakfast",

  // Snacks & Drinks
  "drinks-juice-and-more": "Drinks, Juice & More",
  "drinks-juice-more": "Drinks, Juice & More",
  "cold-drinks-juices": "Beverages",
  "cold-drinks-and-juices": "Beverages",
  "chips-namkeens": "Chips and Namkeens",
  "chips-and-namkeens": "Chips and Namkeens",
  "snacks": "Snacks",
  "ice-cream": "Ice Creams & Desserts",
  "ice-creams-frozen-desserts": "Ice Creams & Desserts",
  "ice-creams-and-desserts": "Ice Creams & Desserts",
  "chocolates": "Chocolates",
  "noodles-pasta-vermicelli": "Noodles & Pasta",
  "noodles-and-pasta": "Noodles & Pasta",
  "frozen-food": "Frozen Foods",
  "frozen-foods": "Frozen Foods",
  "sweet-corner": "Sweet Corner",
  "paan-corner": "Pan Centre",
  "pan-centre": "Pan Centre",
  "cake-corner": "Cake Corner",
  "biscuits-and-cakes": "Biscuits and Cakes",
  "tea-coffee-drinks": "Tea, Coffee & Drinks",
  "tea-coffee": "Tea, Coffee & Drinks",
  "sauces-and-spreads": "Sauces and Spreads",
  "premium-pickles": "Premium Pickles",

  // Beauty & Wellness
  "bath-body": "Bath and Body",
  "bath-and-body": "Bath and Body",
  "hair-care": "Hair Care",
  "skin-care": "Skincare",
  "skincare": "Skincare",
  "makeup": "Makeups",
  "makeups": "Makeups",
  "oral-care": "Oral Care",
  "grooming": "Grooming",
  "baby-care": "Baby Care",
  "fragrances": "Perfumes",
  "perfumes": "Perfumes",
  "protein-supplements": "Proteins",
  "feminine-hygiene": "Female Hygiene",
  "sexual-wellness": "Sexual Wellness",
  "health-pharma": "Health and Pharma",
  "health-and-pharma": "Health and Pharma",

  // Household & Lifestyle
  "home-furnishing": "House Holds",
  "home-and-kitchen": "Home and Kitchen",
  "home-kitchen": "Home and Kitchen",
  "kitchen-dining": "Home and Kitchen",
  "cleaning-essentials": "Cleaners & Repellents",
  "cleaners-repellents": "Cleaners & Repellents",
  "clothing": "Clothing Section",
  "mobiles-electronics": "Electronics & Appliances",
  "appliances": "Electronics & Appliances",
  "electronics-appliances": "Electronics & Appliances",
  "books-stationery": "Stationary",
  "stationery": "Stationary",
  "jewellery-accessories": "Grooming",

  // Electronics & Appliances
  "puja": "Puja Store",
  "puja-store": "Puja Store",
  "toys-games": "Toys and Games",
  "sports-fitness": "Sports Equipment",
  "pet-supplies": "Pet Shop",
  "hostel-essentials": "Hostel Essentials",

  // Shop By Store
  "book-store": "Stationary",
  "the-noice-store": "The Noice Store",
  "health-hub": "Health Hub",
  "sports-and-fitness-store": "Sports Equipment",
  "instadrops-store": "Instadrops Store",
  "summer-store": "Summer Store",
  "gourmet-store": "Gourmet Store",
  "travel-store": "Travel Store"
};

export const CATEGORY_SUBCATEGORIES = {
  "dairy-bread-eggs": [
    "Show All",
    "Milk",
    "Eggs",
    "Curd and Yogurts",
    "Fresh Bakery",
    "Butter",
    "Bread and Buns",
    "Cheese",
    "Batters & Chutneys",
    "Lassi & Buttermilk",
    "Milkshakes & More",
    "Indian Breads",
    "Dairy Alternatives",
    "Paneer and Tofu",
    "Top Deals"
  ],
  "meat-seafood": [
    "Show All",
    "Fresh Chicken",
    "Fresh Seafood",
    "Fresh Mutton",
    "Ready to Cook",
    "Meat Combos",
    "Frozen Food",
    "Plant Based Meat",
    "Eggs",
    "Cold Cuts"
  ],
  "atta-rice-dal": [
    "Show All",
    "Atta",
    "Rice",
    "Toor, Moong & Urad",
    "High Protein Atta",
    "Basmati Rice",
    "Besan, Sooji & Maida",
    "Rajma, Chola & Others",
    "Poha & Puffed Rice",
    "Premium Brands",
    "Soya Chunk & Badi",
    "Other Flours",
    "Millets & Daliya",
    "Ready to Cook Flour Mix",
    "Top Deals"
  ],
  "masalas": [
    "Show All",
    "Whole Spices",
    "Sugar & Jaggery",
    "Cold Grind",
    "Powdered Spices",
    "Salt",
    "Ready Masala",
    "Pickles & Chutney",
    "Herbs & Seasoning",
    "Paste & Puree",
    "Top Deals"
  ],
  "oils-ghee": [
    "Show All",
    "Mustard Oil",
    "Refined Sunflower",
    "Cow Ghee",
    "Olive & Canola",
    "Coconut Oil",
    "Other Oils",
    "Top Deals"
  ],
  "cereals-breakfast": [
    "Show All",
    "Oats & Muesli",
    "Flakes",
    "Granola",
    "Kids Cereals",
    "Breakfast Mixes",
    "Poha & Vermicelli",
    "Top Deals"
  ],
  "drinks-juice-and-more": [
    "Show All",
    "Soft Drinks",
    "Fruit Juices",
    "Zero Sugar"
  ],
  "drinks-juice-more": [
    "Show All",
    "Soft Drinks",
    "Fruit Juices",
    "Zero Sugar"
  ],
  "cold-drinks-juices": [
    "Show All",
    "Soft Drinks",
    "Fruit Juices",
    "Energy Drinks",
    "Coconut Water",
    "Soda & Mixers",
    "Ice Tea",
    "Top Deals"
  ],
  "ice-creams-desserts": [
    "Show All",
    "Tubs",
    "Cones & Cups",
    "Kulfi",
    "Gourmet Desserts",
    "Ice Cream Cakes",
    "Waffles",
    "Top Deals"
  ],
  "chips-namkeens": [
    "Show All",
    "Potato Chips",
    "Namkeen & Bhujia",
    "Nachos & Tortilla",
    "Puffs & Popcorn",
    "Healthy Snacks",
    "Top Deals"
  ],
  "chocolates": [
    "Show All",
    "Milk Chocolates",
    "Dark Chocolates",
    "Gift Packs",
    "Bars & Bites",
    "Wafer Chocolates",
    "Top Deals"
  ],
  "biscuits-cakes": [
    "Show All",
    "Cookies",
    "Cream Biscuits",
    "Digestive Biscuits",
    "Tea-time Biscuits",
    "Cakes & Muffins",
    "Rusk & Khari",
    "Top Deals"
  ],
  "tea-coffee-drinks": [
    "Show All",
    "Tea Leaves",
    "Green Tea",
    "Instant Coffee",
    "Filter Coffee",
    "Health Drinks",
    "Milk Additives",
    "Top Deals"
  ],
  "sauces-spreads": [
    "Show All",
    "Ketchup & Sauce",
    "Mayonnaise & Dips",
    "Jams & Honey",
    "Chocolate Spreads",
    "Salad Dressings",
    "Chinese Sauces",
    "Top Deals"
  ],
  "sweet-corner": [
    "Show All",
    "Traditional Sweets",
    "Gulab Jamun & Rasgulla",
    "Soan Papdi",
    "Halwa & Kheer",
    "Sugar-Free Sweets",
    "Top Deals"
  ],
  "bath-body": [
    "Show All",
    "Soaps",
    "Body Wash",
    "Hand Wash",
    "Body Lotion",
    "Deodorants",
    "Talcom Powder",
    "Top Deals"
  ],
  "hair-care": [
    "Show All",
    "Shampoo",
    "Conditioner",
    "Hair Oil",
    "Hair Serum",
    "Hair Color",
    "Styling Gel",
    "Top Deals"
  ],
  "skincare": [
    "Show All",
    "Face Wash",
    "Moisturizers",
    "Sunscreen",
    "Face Scrubs & Masks",
    "Lip Care",
    "Serums",
    "Top Deals"
  ],
  "health-pharma": [
    "Show All",
    "Pain Relief",
    "Digestive Care",
    "Bandages & Antiseptics",
    "Sexual Wellness",
    "Multivitamins",
    "Daily Wellness",
    "Top Deals"
  ],
  "home-kitchen": [
    "Show All",
    "Kitchenware",
    "Containers & Bottles",
    "Cleaning Tools",
    "Garbage Bags",
    "Tissues & Napkins",
    "Top Deals"
  ],
  "puja-store": [
    "Show All",
    "Agarbatti & Dhoop",
    "Puja Oil & Ghee",
    "Camphor (Kapoor)",
    "Puja Utensils",
    "Matchboxes",
    "Top Deals"
  ],
  "cleaners-repellents": [
    "Show All",
    "Floor Cleaners",
    "Toilet Cleaners",
    "Dishwashers",
    "Mosquito Repellents",
    "Air Freshners",
    "Top Deals"
  ],
  "electronics-appliances": [
    "Show All",
    "Earphones",
    "Cables & Chargers",
    "Power Banks",
    "Batteries",
    "Kitchen Appliances",
    "Top Deals"
  ],

    "gift": [
    "Show All",
    "Birthday Gifts",
    "Anniversary Gifts",
    "Gift Hampers",
    "Personalized Gifts",
    "Chocolate Gifts",
    "Flowers & Plants",
    "Top Deals"
  ]
};

export const getSubcategoryKey = (slug) => {
  if (!slug) return "";
  const norm = slug.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  const map = {
    "dairy-bread-eggs": "dairy-bread-eggs",
    "dairy-bread-and-eggs": "dairy-bread-eggs",
    "meat-and-seafood": "meat-seafood",
    "meat-seafood": "meat-seafood",
    "atta-rice-and-dal": "atta-rice-dal",
    "atta-rice-dal": "atta-rice-dal",
    "drinks-juice-and-more": "drinks-juice-more",
    "drinks-juice-more": "drinks-juice-more",
    "cold-drinks-and-juices": "cold-drinks-juices",
    "cold-drinks-juices": "cold-drinks-juices",
    "ice-creams-and-desserts": "ice-creams-desserts",
    "ice-creams-desserts": "ice-creams-desserts",
    "chips-and-namkeens": "chips-namkeens",
    "chips-namkeens": "chips-namkeens",
    "biscuits-and-cakes": "biscuits-cakes",
    "biscuits-cakes": "biscuits-cakes",
    "tea-coffee-and-drinks": "tea-coffee-drinks",
    "tea-coffee-drinks": "tea-coffee-drinks",
    "sauces-and-spreads": "sauces-spreads",
    "sauces-spreads": "sauces-spreads",
    "bath-and-body": "bath-body",
    "bath-body": "bath-body",
    "health-and-pharma": "health-pharma",
    "health-pharma": "health-pharma",
    "home-and-kitchen": "home-kitchen",
    "home-kitchen": "home-kitchen",
    "cleaners-and-repellents": "cleaners-repellents",
    "cleaners-repellents": "cleaners-repellents",
  };
  return map[norm] || norm;
};

export const categoryFilters = {
  "fresh-fruits": {
    "Type": ["Mangoes", "Bananas", "Apples", "Watermelons"],
    "Freshness": ["Organic", "Farm Fresh", "Seasonal"],
    "Price": ["Under ₹50", "₹50-₹100", "₹100+"],
    "Offers": ["10%+ OFF", "20%+ OFF"]
  },
  "fresh-vegetables": {
    "Type": ["Leafy", "Root", "Exotic"],
    "Freshness": ["Organic", "Farm Fresh"],
    "Price": ["Under ₹30", "₹30-₹80", "₹80+"]
  },
  "dairy-bread-eggs": {
    "Type": ["Milk", "Curd", "Cheese", "Butter", "Eggs", "Bread"],
    "Brand": ["Amul", "Nandini", "Britannia"],
    "Offers": ["Combo Packs", "Buy 1 Get 1"]
  },
  "dairy-bread-and-eggs": {
    "Type": ["Milk", "Curd", "Cheese", "Butter", "Eggs", "Bread"],
    "Brand": ["Amul", "Nandini", "Britannia"],
    "Offers": ["Combo Packs", "Buy 1 Get 1"]
  },
  "meat-seafood": {
    "Type": ["Chicken", "Mutton", "Fish", "Prawns"],
    "Cuts": ["Boneless", "Curry Cut", "Whole"],
    "Freshness": ["Fresh Today", "Premium"]
  },
  "meat-and-seafood": {
    "Type": ["Chicken", "Mutton", "Fish", "Prawns"],
    "Cuts": ["Boneless", "Curry Cut", "Whole"],
    "Freshness": ["Fresh Today", "Premium"]
  },
  "chips-namkeens": {
    "Type": ["Chips", "Biscuits", "Chocolates", "Namkeens"],
    "Brand": ["Lays", "Haldiram", "Cadbury"],
    "Offers": ["Combo Offers", "10%+ OFF"]
  },
  "chips-and-namkeens": {
    "Type": ["Chips", "Biscuits", "Chocolates", "Namkeens"],
    "Brand": ["Lays", "Haldiram", "Cadbury"],
    "Offers": ["Combo Offers", "10%+ OFF"]
  },
  "drinks-juice-and-more": {
    "Type": ["Soft Drinks", "Fruit Juices"],
    "Brand": ["Coca-Cola", "Pepsi", "Sprite", "Thums Up", "Appy", "Limca", "Fanta", "Bindu", "Paper Boat", "Mirinda", "Dobra", "Maaza", "Mogu Mogu", "7Up", "Minute Maid", "Slice", "Real", "Poko Loko"]
  },
  "drinks-juice-more": {
    "Type": ["Soft Drinks", "Fruit Juices"],
    "Brand": ["Coca-Cola", "Pepsi", "Sprite", "Thums Up", "Appy", "Limca", "Fanta", "Bindu", "Paper Boat", "Mirinda", "Dobra", "Maaza", "Mogu Mogu", "7Up", "Minute Maid", "Slice", "Real", "Poko Loko"]
  },
  "cold-drinks-juices": {
    "Type": ["Soft Drinks", "Juices", "Energy Drinks", "Water"],
    "Brand": ["Coca-Cola", "Pepsi", "Real", "Red Bull"]
  },
  "cold-drinks-and-juices": {
    "Type": ["Soft Drinks", "Juices", "Energy Drinks", "Water"],
    "Brand": ["Coca-Cola", "Pepsi", "Real", "Red Bull"]
  },
  "baby-care": {
    "Type": ["Diapers", "Wipes", "Baby Food", "Lotion"],
    "Brand": ["Pampers", "Huggies", "Johnson's"]
  },
  "bath-body": {
    "Type": ["Soap", "Shampoo", "Face Wash", "Body Wash"],
    "Brand": ["Dove", "Nivea", "Mamaearth"]
  },
  "bath-and-body": {
    "Type": ["Soap", "Shampoo", "Face Wash", "Body Wash"],
    "Brand": ["Dove", "Nivea", "Mamaearth"]
  }
};
