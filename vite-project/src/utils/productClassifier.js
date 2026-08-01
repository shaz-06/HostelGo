const categoryMap = {
  "Fresh Vegetables": ["vegetables", "vegetable", "veggies", "veggie", "fresh vegetables", "fresh vegetable"],
  "Fresh Fruits": ["fruits", "fruit", "fresh fruits", "fresh fruit"],
  "Dairy, Bread & Eggs": ["dairy", "bread", "egg", "eggs", "milk", "cheese", "butter", "paneer", "yogurt", "ghee", "curd"],
  "Meat & Seafood": ["meat", "seafood", "fish", "chicken", "mutton", "prawn"],
  "Cold Drinks & Juices": ["beverage", "beverages", "drink", "drinks", "juice", "juices", "soda", "cold drinks"],
  "Ice Creams & Frozen Desserts": ["ice cream", "icecream", "frozen dessert", "frozen desserts", "kulfi"],
  "Chocolates": ["chocolate", "chocolates", "choco", "candy"],
  "Noodles, Pasta & Vermicelli": ["noodles", "noodle", "pasta", "vermicelli", "maggi", "ramen"],
  "Frozen Food": ["frozen food", "frozen foods", "frozen"],
  "Sweet Corner": ["sweet", "sweets", "mithai", "halwa", "laddu", "gulab jamun"],
  "Paan Corner": ["paan", "cigarette", "cigarettes", "lighter", "matches", "matchbox"],
  "Mobiles & Electronics": ["electronics", "electronic", "mobile", "mobiles", "phone", "phones", "laptop", "laptops", "earbud", "earbuds", "charger", "chargers", "smart watch", "smartwatch"],
  "Books & Stationery": ["books", "book", "stationery", "pen", "pens", "notebook", "notebooks", "file", "files", "pencil"],
  "Clothing": ["clothing", "clothes", "fashion", "apparel", "t-shirt", "tshirt", "shirt", "jeans", "hoodie", "hoodies"],
  "Cleaning Essentials": ["clean", "cleaning", "repellent", "repellents", "detergent", "surf excel", "harpic", "lizol"],
  "Bath & Body": ["soap", "soaps", "body wash", "shower gel", "dettol"],
  "Hair Care": ["shampoo", "shampoos", "conditioner", "conditioners", "hair oil", "hair care"],
  "Skin Care": ["skin care", "skincare", "moisturizer", "face wash", "cream", "sunscreen"],
  "Makeup": ["makeup", "lipstick", "kajal", "foundation", "eyeliner"],
  "Fragrances": ["fragrance", "fragrances", "perfume", "perfumes", "deo", "deodorant", "deodorants"],
  "Sexual Wellness": ["sexual wellness", "sexual", "condom", "condoms", "lube", "lubricant", "durex"],
  "Health & Pharma": ["health", "pharma", "medicine", "medicines", "tablet", "tablets", "paracetamol", "vaporub", "cough"],
  "Chips & Namkeens": ["chips", "namkeen", "kurkure", "bingo", "lays", "lay's", "pringles", "wafer", "snack"]
};

const checkField = (val) => {
  if (!val) return null;
  const lower = val.toLowerCase().trim();
  
  // Try exact or word matches first
  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const kw of keywords) {
      if (lower === kw || lower.includes(" " + kw) || lower.includes(kw + " ") || lower.startsWith(kw + "s") || lower === kw + "s") {
        return category;
      }
    }
  }
  
  // fallback to simple includes
  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }
  
  return null;
};

export const classifyProduct = (p) => {
  if (!p) return "Other Products";

  // Priority 1: product.subCategory
  if (p.subCategory) {
    const matched = checkField(p.subCategory);
    if (matched) return matched;
  }

  // Priority 2: product.category
  if (p.category) {
    const matched = checkField(p.category);
    if (matched) return matched;
  }

  // Priority 3: product.tags
  if (p.tags) {
    if (Array.isArray(p.tags)) {
      for (const tag of p.tags) {
        const matched = checkField(tag);
        if (matched) return matched;
      }
    } else if (typeof p.tags === "string") {
      const matched = checkField(p.tags);
      if (matched) return matched;
    }
  }

  // Priority 4: product.brandCategory
  if (p.brandCategory) {
    const matched = checkField(p.brandCategory);
    if (matched) return matched;
  }

  // Priority 5: Keyword heuristic from product.name and product.description
  const name = (p.name || "").toLowerCase().trim();
  const desc = (p.description || "").toLowerCase().trim();

  const checkKeywords = (text) => {
    // Fresh Vegetables
    if (text.includes("tomato") || text.includes("onion") || text.includes("potato") || text.includes("carrot") || text.includes("cabbage") || text.includes("lemon") || text.includes("garlic") || text.includes("ginger") || text.includes("chilli") || text.includes("coriander") || text.includes("veggie") || text.includes("vegetable")) {
      return "Fresh Vegetables";
    }
    // Fresh Fruits
    if (text.includes("apple") || text.includes("mango") || text.includes("banana") || text.includes("orange") || text.includes("grape") || text.includes("watermelon") || text.includes("papaya") || text.includes("pomegranate") || text.includes("kiwi") || text.includes("pineapple") || text.includes("fruit")) {
      return "Fresh Fruits";
    }
    // Dairy, Bread & Eggs
    if (text.includes("milk") || text.includes("bread") || text.includes("butter") || text.includes("cheese") || text.includes("eggs") || text.includes("paneer") || text.includes("curd") || text.includes("yogurt") || text.includes("ghee") || text.includes("dairy")) {
      return "Dairy, Bread & Eggs";
    }
    // Meat & Seafood
    if (text.includes("chicken") || text.includes("fish") || text.includes("mutton") || text.includes("prawn") || text.includes("meat") || text.includes("seafood")) {
      return "Meat & Seafood";
    }
    // Cold Drinks & Juices
    if (text.includes("coca cola") || text.includes("coke") || text.includes("pepsi") || text.includes("tropicana") || text.includes("real juice") || text.includes("sprite") || text.includes("fanta") || text.includes("limca") || text.includes("thums up") || text.includes("red bull") || text.includes("sting") || text.includes("soda") || text.includes("monster") || text.includes("beverage") || text.includes("juice") || text.includes("drink")) {
      return "Cold Drinks & Juices";
    }
    // Ice Creams & Frozen Desserts
    if (text.includes("ice cream") || text.includes("cornetto") || text.includes("kulfi") || text.includes("frozen dessert") || text.includes("kwality wall")) {
      return "Ice Creams & Frozen Desserts";
    }
    // Chocolates
    if (text.includes("chocolate") || text.includes("cadbury") || text.includes("dairymilk") || text.includes("kitkat") || text.includes("snickers") || text.includes("5 star") || text.includes("perk") || text.includes("ferrero") || text.includes("choco")) {
      return "Chocolates";
    }
    // Noodles, Pasta & Vermicelli
    if (text.includes("noodle") || text.includes("pasta") || text.includes("vermicelli") || text.includes("maggi") || text.includes("yippee") || text.includes("ramen") || text.includes("koka") || text.includes("ching")) {
      return "Noodles, Pasta & Vermicelli";
    }
    // Frozen Food
    if (text.includes("mccain") || text.includes("yummiez") || text.includes("burger patty") || text.includes("nugget") || text.includes("fries") || text.includes("frozen")) {
      return "Frozen Food";
    }
    // Sweet Corner
    if (text.includes("sweet") || text.includes("halwa") || text.includes("laddu") || text.includes("gulab jamun") || text.includes("peda") || text.includes("soan papdi") || text.includes("kaju katli") || text.includes("mithai")) {
      return "Sweet Corner";
    }
    // Paan Corner
    if (text.includes("lighter") || text.includes("cigarette") || text.includes("nicotex") || text.includes("matchbox") || text.includes("florence") || text.includes("classic") || text.includes("gold flake") || text.includes("paan") || text.includes("tobacco") || text.includes("pan") || text.includes("supari")) {
      return "Paan Corner";
    }
    // Mobiles & Electronics
    if (text.includes("phone") || text.includes("earbud") || text.includes("laptop") || text.includes("smart watch") || text.includes("charger") || text.includes("cable") || text.includes("headphone") || text.includes("power bank") || text.includes("electronic") || text.includes("appliance")) {
      return "Mobiles & Electronics";
    }
    // Books & Stationery
    if (text.includes("book") || text.includes("pen") || text.includes("notebook") || text.includes("file") || text.includes("pencil") || text.includes("eraser") || text.includes("marker") || text.includes("diary") || text.includes("stationery")) {
      return "Books & Stationery";
    }
    // Clothing
    if (text.includes("t-shirt") || text.includes("shirt") || text.includes("jeans") || text.includes("hoodie") || text.includes("sock") || text.includes("trouser") || text.includes("jacket") || text.includes("cloth") || text.includes("fashion")) {
      return "Clothing";
    }
    // Cleaning Essentials
    if (text.includes("harpic") || text.includes("surf excel") || text.includes("lizol") || text.includes("vim") || text.includes("detergent") || text.includes("scrub") || text.includes("insecticide") || text.includes("all out") || text.includes("good knight") || text.includes("clean") || text.includes("repellent")) {
      return "Cleaning Essentials";
    }
    // Bath & Body
    if (text.includes("soap") || text.includes("shower gel") || text.includes("body wash") || text.includes("shampoo") || text.includes("dettol") || text.includes("lifebuoy") || text.includes("pears") || text.includes("fiama")) {
      return "Bath & Body";
    }
    // Hair Care
    if (text.includes("shampoo") || text.includes("conditioner") || text.includes("hair oil") || text.includes("serum") || text.includes("loreal") || text.includes("dove") || text.includes("clinic plus") || text.includes("pantene") || text.includes("parachute")) {
      return "Hair Care";
    }
    // Skin Care
    if (text.includes("face wash") || text.includes("moisturizer") || text.includes("cream") || text.includes("sunscreen") || text.includes("nivea") || text.includes("ponds") || text.includes("cetaphil") || text.includes("garnier")) {
      return "Skin Care";
    }
    // Makeup
    if (text.includes("lipstick") || text.includes("kajal") || text.includes("foundation") || text.includes("eyeliner") || text.includes("compact") || text.includes("lakme") || text.includes("maybelline")) {
      return "Makeup";
    }
    // Fragrances
    if (text.includes("perfume") || text.includes("deo") || text.includes("deodorant") || text.includes("spray") || text.includes("axe") || text.includes("fogg") || text.includes("wild stone") || text.includes("engage")) {
      return "Fragrances";
    }
    // Sexual Wellness
    if (text.includes("condom") || text.includes("lube") || text.includes("lubricant") || text.includes("durex") || text.includes("skore") || text.includes("manforce") || text.includes("sexual")) {
      return "Sexual Wellness";
    }
    // Health & Pharma
    if (text.includes("vaporub") || text.includes("cough") || text.includes("medicine") || text.includes("tablet") || text.includes("paracetamol") || text.includes("band-aid") || text.includes("volini") || text.includes("thermometer") || text.includes("health")) {
      return "Health & Pharma";
    }
    // Chips & Namkeens
    if (text.includes("chips") || text.includes("namkeen") || text.includes("kurkure") || text.includes("bingo") || text.includes("lays") || text.includes("lay's") || text.includes("pringles") || text.includes("wafer") || text.includes("snack")) {
      return "Chips & Namkeens";
    }
    return null;
  };

  const nameMatch = checkKeywords(name);
  if (nameMatch) return nameMatch;

  const descMatch = checkKeywords(desc);
  if (descMatch) return descMatch;

  return "Other Products";
};

export const canonicalCategory = (name) => {
  if (!name) return "";
  const lower = name.toLowerCase().trim();
  
  if (lower === "the fruit store" || lower === "fresh fruits" || lower === "fruits" || lower === "fruit store") {
    return "Fresh Fruits";
  }
  if (lower === "the veggie store" || lower === "fresh vegetables" || lower === "vegetables" || lower === "veggie store" || lower === "veggies") {
    return "Fresh Vegetables";
  }
  if (lower === "dairy, bread & eggs" || lower === "dairy, bread and eggs" || lower === "dairy bread & eggs" || lower === "dairy") {
    return "Dairy, Bread & Eggs";
  }
  if (lower === "cold drinks & juices" || lower === "cold drinks and juices" || lower === "beverages" || lower === "drinks" || lower === "beverage") {
    return "Cold Drinks & Juices";
  }
  if (lower === "mobiles & electronics" || lower === "mobiles and electronics" || lower === "electronics & appliances" || lower === "electronics" || lower === "tech") {
    return "Mobiles & Electronics";
  }
  if (lower === "books & stationery" || lower === "books and stationery" || lower === "stationery" || lower === "book store") {
    return "Books & Stationery";
  }
  if (lower === "clothing" || lower === "fashion" || lower === "clothes") {
    return "Clothing";
  }
  if (lower === "meat and seafood" || lower === "meat & seafood" || lower === "meat") {
    return "Meat & Seafood";
  }
  if (lower === "snacks" || lower === "chips & namkeens" || lower === "chips and namkeens") {
    return "Chips & Namkeens";
  }
  if (lower === "cleaners & repellents" || lower === "cleaning essentials") {
    return "Cleaning Essentials";
  }
  if (lower === "atta, rice and dal" || lower === "atta, rice & dal" || lower === "atta rice & dal" || lower === "grocery") {
    return "Atta, Rice and Dal";
  }
  if (lower === "ice cream" || lower === "icecream" || lower === "ice-cream" || lower === "ice creams & desserts" || lower === "ice creams & frozen desserts" || lower === "ice-creams-frozen-desserts") {
    return "Ice Creams & Frozen Desserts";
  }
  if (lower === "noodles & pasta" || lower === "noodles, pasta & vermicelli" || lower === "noodles" || lower === "pasta" || lower === "noodles-pasta-vermicelli") {
    return "Noodles, Pasta & Vermicelli";
  }
  if (lower === "frozen foods" || lower === "frozen food" || lower === "frozen" || lower === "frozen-food") {
    return "Frozen Food";
  }
  if (lower === "cake corner" || lower === "cakes" || lower === "cake" || lower === "cake-corner") {
    return "Cake Corner";
  }
  if (lower === "pan centre" || lower === "paan corner" || lower === "paan" || lower === "pan center" || lower === "paan-corner") {
    return "Paan Corner";
  }
  if (lower === "other" || lower === "other products") {
    return "Other Products";
  }
  
  return name.charAt(0).toUpperCase() + name.slice(1);
};
