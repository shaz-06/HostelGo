const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");

const products = [
  {
    "id": "fr1",
    "name": "Premium Robusta Banana",
    "category": "The Fruit Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 29,
    "originalPrice": 36,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500"
  },
  {
    "id": "DBE1",
    "name": "Nandini Curd",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 27,
    "originalPrice": 28,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr2",
    "name": "Fresh Mango",
    "category": "The Fruit Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 199,
    "originalPrice": 250,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg1",
    "name": "Potato (Aloo Gadde)",
    "category": "The Veggie Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 28,
    "originalPrice": 35,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg2",
    "name": "Green Chilli (Hasiru Menasinakaayi)",
    "category": "The Veggie Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 14,
    "originalPrice": 18,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg3",
    "name": "Hybrid Tomato (Gulabi Tomato)",
    "category": "The Veggie Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 32,
    "originalPrice": 40,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr3",
    "name": "Premium Robusta Banana (Baalehannu)",
    "category": "The Fruit Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 35,
    "originalPrice": 44,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr4",
    "name": "Baby Yelakki Banana (Yelakki Baalehannu)",
    "category": "The Fruit Store",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 55,
    "originalPrice": 69,
    "weight": "10 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE2",
    "name": "Fesh Eggs White eggs",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "price": 51,
    "originalPrice": 75,
    "weight": "6 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE3",
    "name": "Gold Winner Refined Sunflower Oil",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "1 Ltr x 2",
        "price": 356,
        "originalPrice": 410
      },
      {
        "weight": "1 Ltr",
        "price": 178,
        "originalPrice": 205
      }
    ],
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE4",
    "name": "Amul Jambo Chcolate Brownie Ice Cream",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "125 ml",
        "price": 35,
        "originalPrice": 50,
        "stock": 30
      },
      {
        "weight": "250 ml * 6",
        "price": 210,
        "originalPrice": 300,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "S1",
    "name": "Bingo Original Style Chilli Sprinkled Potato Chips",
    "category": "Snacks",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "45.9 g",
        "price": 19,
        "originalPrice": 20,
        "stock": 30
      },
      {
        "weight": "45.9 g * 2",
        "price": 36,
        "originalPrice": 40,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "C1",
    "name": "Sprite Soft Drinks Bottle",
    "category": "Beverages",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "750 ml",
        "price": 39,
        "originalPrice": 40,
        "stock": 30
      },
      {
        "weight": "750 ml * 2",
        "price": 76,
        "originalPrice": 80,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE5",
    "name": "Kwality Wali's Cornetto Double Chocolate icecream",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "weight": "105 ml",
    "price": 35,
    "originalPrice": 40,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE6",
    "name": "Cadbury Chocobakes Choc Layered Cake",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "weight": "19 g",
    "price": 10,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "S2",
    "name": "Bingo Tedhe Medhe Masala Tadka",
    "category": "Snacks",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "80 g",
        "price": 16,
        "originalPrice": 20
      },
      {
        "weight": "80 g * 2",
        "price": 30,
        "originalPrice": 40
      },
      {
        "weight": "80 g * 3",
        "price": 42,
        "originalPrice": 60
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "S3",
    "name": "MAGGI 2-Minute Instant Noodles, Masala",
    "category": "Snacks",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "300 g",
        "price": 58,
        "stock": 30
      },
      {
        "weight": "300 g * 2",
        "price": 116,
        "stock": 30
      },
      {
        "weight": "300 g * 4",
        "price": 232,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "S4",
    "name": "Lay's (West Indies Hot 'n' Sweet Chilli) Potato Chips",
    "category": "Snacks",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "52.9 g",
        "price": 25,
        "stock": 30
      },
      {
        "weight": "52.9 g * 2",
        "price": 50,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE7",
    "name": "Cadbury Shots",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "16 g",
        "price": 10,
        "stock": 30
      },
      {
        "weight": "16 g * 2",
        "price": 20,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "C2",
    "name": "Coca Cola Soft Drinks Bottle",
    "category": "Beverages",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "750 ml",
        "price": 39,
        "originalPrice": 40,
        "stock": 30
      },
      {
        "weight": "750 ml * 2",
        "price": 70,
        "originalPrice": 80,
        "stock": 30
      },
      {
        "weight": "750 ml * 12",
        "price": 362,
        "originalPrice": 480,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE8",
    "name": "Hide & Seek Parle Chocolate Chips Cookies",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "115.5 g",
        "price": 27,
        "originalPrice": 30,
        "stock": 30
      },
      {
        "weight": "115.5 g * 2",
        "price": 54,
        "originalPrice": 60,
        "stock": 30
      },
      {
        "weight": "115.5 g * 3",
        "price": 81,
        "originalPrice": 90,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE9",
    "name": "Amul Ice Cream Pista Malai Kulfi",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "60 ml",
        "price": 30,
        "stock": 30
      },
      {
        "weight": "60 ml * 2",
        "price": 60,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE10",
    "name": "Bisleri Water Can",
    "category": "Beverages",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "weight": "10 Ltr",
    "price": 125,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE11",
    "name": "Parle Hide & Seek Choco Chip Cookies",
    "category": "Dairy, Bread & Eggs",
    "tags": [
      "Trending Near You"
    ],
    "isTrending": true,
    "variants": [
      {
        "weight": "70 g",
        "price": 16,
        "stock": 30
      },
      {
        "weight": "70 g * 2",
        "price": 30,
        "stock": 30
      },
      {
        "weight": "70 g * 4",
        "price": 58,
        "stock": 30
      },
      {
        "weight": "70 g * 6",
        "price": 84,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE12",
    "name": "Amul Chocolate Magic Ice Cream Sundae Tub",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "variants": [
      {
        "weight": "1 Ltr",
        "price": 215,
        "originalPrice": 220,
        "stock": 30
      },
      {
        "weight": "1 Ltr * 2",
        "price": 430,
        "originalPrice": 435,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE13",
    "name": "NIC Ice Cream Mango Ice Cream Cup",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "100 ml",
    "price": 84,
    "originalPrice": 90,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE14",
    "name": "Kwality Wall's Cornetto Oreo Frozen Desert",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "110 ml",
    "price": 70,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE15",
    "name": "Amul Rajbhog Ice Cream Tub",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "1 Ltr",
    "price": 270,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE16",
    "name": "Arun Butterscotch Ice Cream Cone",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "100 ml",
    "price": 60,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE17",
    "name": "Kwality Wall's Choco Brownie Fudge Ice Cream Tub",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "700 ml",
    "price": 265,
    "originalPrice": 295,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE18",
    "name": "Magnum Almond Ice Cream Stick by Kwality Wall's",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "62 g",
    "price": 80,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "DBE19",
    "name": "Kwality Wall's Chocochips Ice Cream Tub",
    "category": "Dairy, Bread & Eggs",
    "isTrending": true,
    "weight": "700 ml",
    "price": 199,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr5",
    "name": "Kiran Watermelon (Kallangadi)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "1 Medium",
    "price": 99,
    "originalPrice": 124,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr6",
    "name": "Tender Coconut (Elaneer)",
    "category": "The Fruit Store",
    "isTrending": true,
    "variants": [
      {
        "weight": "1 Piece",
        "price": 75,
        "originalPrice": 94,
        "stock": 30
      },
      {
        "weight": "1 Piece * 3",
        "price": 219,
        "originalPrice": 282,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr7",
    "name": "Jamun (Nerale Hannu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "200 g",
    "price": 99,
    "originalPrice": 124,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr8",
    "name": "Muskmelon (Karbuja)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "1 Piece",
    "price": 59,
    "originalPrice": 74,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr9",
    "name": "Sweet Royal Gala Apple(Sebu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "2 Piece",
    "price": 129,
    "originalPrice": 161,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr10",
    "name": "Red Banana (Baalehannu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "4 Piece",
    "price": 69,
    "originalPrice": 86,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr11",
    "name": "Pomegranate (Dalimbe Hannu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "2 Piece",
    "price": 155,
    "originalPrice": 194,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr12",
    "name": "Daily Juice Sweet Lime (Mosambi)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "500 g",
    "price": 59,
    "originalPrice": 74,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr13",
    "name": "Daily Apple (Sebu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "2 Piece",
    "price": 115,
    "originalPrice": 144,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "fr14",
    "name": "Lady Red Papaya Family Size",
    "category": "The Fruit Store",
    "isTrending": true,
    "weight": "1 Large",
    "price": 65,
    "originalPrice": 81,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg4",
    "name": "Onion (Eerulli)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 kg",
    "price": 28,
    "originalPrice": 35,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg5",
    "name": "Coriander Leaves (Kottambari Soppu)",
    "category": "The Fruit Store",
    "isTrending": true,
    "variants": [
      {
        "weight": "1 Bunch",
        "price": 14,
        "originalPrice": 20,
        "stock": 30
      },
      {
        "weight": "1 Bunch * 2",
        "price": 26,
        "originalPrice": 40,
        "stock": 30
      }
    ],
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg6",
    "name": "Lady's Finger (Bende Kaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 17,
    "originalPrice": 21,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg7",
    "name": "Ginger (Shunti)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "200 g",
    "price": 38,
    "originalPrice": 48,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg8",
    "name": "Mint Leaves (Pudina)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Bunch",
    "price": 13,
    "originalPrice": 16,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg9",
    "name": "Curry Leaves (Karibevu Soppu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 bunch",
    "price": 12,
    "originalPrice": 15,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg10",
    "name": "Garlic (Bellulli)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "200 g",
    "price": 49,
    "originalPrice": 61,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg11",
    "name": "Cabbage (YeleKosu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Medium",
    "price": 43,
    "originalPrice": 54,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg12",
    "name": "Raw Mango (Mavinakayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "2 Piece",
    "price": 20,
    "originalPrice": 25,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg13",
    "name": "Spinach (Palak Soppu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Bunch",
    "price": 44,
    "originalPrice": 55,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg14",
    "name": "Ooty Carrot",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 30,
    "originalPrice": 38,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg15",
    "name": "Sweet Potato (Sihi Genasu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "500 g",
    "price": 25,
    "originalPrice": 31,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg16",
    "name": "Bottle Gaurd (Sorekaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Medium",
    "price": 25,
    "originalPrice": 31,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg17",
    "name": "Bharta Purple Brinjal (Badanekaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Piece",
    "price": 14,
    "originalPrice": 18,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg18",
    "name": "Fenugreek (Menthya Soppu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Bunch",
    "price": 24,
    "originalPrice": 53,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg19",
    "name": "White Radish (Moolangi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "2 Pieces x 2",
    "price": 46,
    "originalPrice": 60,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg30",
    "name": "Sambar Onion (Sambar Eerulli)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 28,
    "originalPrice": 35,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg31",
    "name": "Spring Onion (Hasiru Eerulli)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Bunch",
    "price": 12,
    "originalPrice": 44,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg32",
    "name": "Totapuri Raw Mango (Mavinahannu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Piece",
    "price": 16,
    "originalPrice": 20,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg20",
    "name": "Haricot Beans (Hurulikayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 32,
    "originalPrice": 39,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg21",
    "name": "Broad Beans (Huralikaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g x 2",
    "price": 54,
    "originalPrice": 70,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg22",
    "name": "Raw Banana (Baalekayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "2 Piece",
    "price": 34,
    "originalPrice": 43,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg23",
    "name": "Kateri Brinjal (Geeru Gundu Badanekaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 15,
    "originalPrice": 19,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg24",
    "name": "Coconut (Thenginakayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Medium",
    "price": 50,
    "originalPrice": 63,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg25",
    "name": "Carrot",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "500 g",
    "price": 42,
    "originalPrice": 53,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg26",
    "name": "French Beans (Bili Hurulikaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "250 g",
    "price": 39,
    "originalPrice": 48,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg27",
    "name": "Ridge Gourd (Herekaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "2 Medium",
    "price": 31,
    "originalPrice": 38,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg28",
    "name": "Green Capsicum (Dappa Menasinakaayi)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "2 Medium",
    "price": 18,
    "originalPrice": 21,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "veg29",
    "name": "Cauliflower (Hoo Kosu)",
    "category": "The Veggie Store",
    "isTrending": true,
    "weight": "1 Medium",
    "price": 32,
    "originalPrice": 40,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "S5",
    "name": "Kurkure Masala Munch",
    "category": "Snacks",
    "isTrending": true,
    "weight": "82 g",
    "price": 20,
    "originalPrice": 20,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1600957244633-c976d9004f40?w=500"
  },
  {
    "id": "S6",
    "name": "Haldiram Bhujia Sev",
    "category": "Snacks",
    "isTrending": true,
    "weight": "150 g",
    "price": 35,
    "originalPrice": 40,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500"
  },
  {
    "id": "S7",
    "name": "Act II Golden Sizzle Popcorn",
    "category": "Snacks",
    "isTrending": true,
    "weight": "60 g",
    "price": 15,
    "originalPrice": 20,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500"
  },
  {
    "id": "S8",
    "name": "Oreo Sandwich Chocolate Creme Biscuit",
    "category": "Snacks",
    "isTrending": true,
    "weight": "120 g",
    "price": 30,
    "originalPrice": 35,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500"
  },
  {
    "id": "C3",
    "name": "Thums Up Soft Drink Bottle",
    "category": "Beverages",
    "isTrending": true,
    "weight": "750 ml",
    "price": 39,
    "originalPrice": 40,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500"
  },
  {
    "id": "C4",
    "name": "Red Bull Energy Drink",
    "category": "Beverages",
    "isTrending": true,
    "weight": "250 ml",
    "price": 125,
    "originalPrice": 125,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500"
  },
  {
    "id": "C5",
    "name": "Tropicana Mixed Fruit Juice",
    "category": "Beverages",
    "isTrending": true,
    "weight": "1 Ltr",
    "price": 110,
    "originalPrice": 130,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "C6",
    "name": "Amul Kool Cafe Milk Drink",
    "category": "Beverages",
    "isTrending": true,
    "weight": "200 ml",
    "price": 30,
    "originalPrice": 35,
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500"
  },
  {
    "id": "ED1",
    "name": "Dukes Waffy Chocolate Wafer Rolls",
    "category": "Exclusive Deals",
    "price": 99,
    "originalPrice": 180,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500"
  },
  {
    "id": "ED2",
    "name": "Amul India Twilight Tryst Single Origin Dark Chocolate",
    "category": "Exclusive Deals",
    "price": 144,
    "originalPrice": 200,
    "weight": "125 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1548907040-4d42b52115ca?w=500"
  },
  {
    "id": "ED3",
    "name": "Bingo No Rulz Masala Curlz Corn Puffs",
    "category": "Exclusive Deals",
    "price": 52,
    "originalPrice": 100,
    "weight": "80 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500"
  },
  {
    "id": "ED4",
    "name": "Yumfills Chocolate Pie by Sunfeast Dark Fantasy",
    "category": "Exclusive Deals",
    "price": 81,
    "originalPrice": 170,
    "weight": "242 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500"
  },
  {
    "id": "ED5",
    "name": "Supreme Harvest Cashew Whole",
    "category": "Exclusive Deals",
    "price": 215,
    "originalPrice": 360,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=500"
  },
  {
    "id": "ED6",
    "name": "Piknik Classic Tomato Chilli",
    "category": "Exclusive Deals",
    "price": 84,
    "originalPrice": 120,
    "weight": "50 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1621447509373-3f1212440eff?w=500"
  },
  {
    "id": "ED7",
    "name": "Supreme Harvest Indian Raisins",
    "category": "Exclusive Deals",
    "price": 121,
    "originalPrice": 230,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1595855759920-86582396756a?w=500"
  },
  {
    "id": "ED8",
    "name": "Real Activ Water - 100% Tender Coconut Water",
    "category": "Exclusive Deals",
    "price": 89,
    "originalPrice": 178,
    "weight": "1 ltr",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1543157148-f68f2ea22776?w=500"
  },
  {
    "id": "MR1",
    "name": "Hit Anti Mosquito Racquet Rechargeable",
    "category": "Cleaners & Repellents",
    "price": 471,
    "originalPrice": 499,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR2",
    "name": "All Out Ultra Mosquito Repellent Liquid Vaporiser (6 Refills)",
    "category": "Cleaners & Repellents",
    "price": 425,
    "originalPrice": 485,
    "weight": "270 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR3",
    "name": "Goodknight Mosquito Repellent Fabric Roll-On",
    "category": "Cleaners & Repellents",
    "price": 83,
    "originalPrice": 85,
    "weight": "8 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR4",
    "name": "Mortein Smart Device + Refill Box",
    "category": "Cleaners & Repellents",
    "price": 95,
    "originalPrice": 100,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR5",
    "name": "All Out Ultra Mosquito Repellent Refill (Floral)",
    "category": "Cleaners & Repellents",
    "price": 160,
    "originalPrice": 165,
    "weight": "90 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR6",
    "name": "All Out Sattva Mosquito Repellent Liquid Vaporiser",
    "category": "Cleaners & Repellents",
    "price": 96,
    "originalPrice": 100,
    "weight": "45 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR7",
    "name": "Goodknight Flash Liquid Vaporiser - Machine + Refill",
    "category": "Cleaners & Repellents",
    "price": 165,
    "originalPrice": 165,
    "weight": "90 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "MR8",
    "name": "Goodknight Liquid Vaporiser - 2 Refills",
    "category": "Cleaners & Repellents",
    "price": 279,
    "originalPrice": 335,
    "weight": "180 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500"
  },
  {
    "id": "BS1",
    "name": "Amul Pasteurised Butter",
    "category": "The Bread Store",
    "price": 60,
    "originalPrice": 60,
    "weight": "100 g",
    "variants": [
      {
        "weight": "100 g",
        "price": 60,
        "originalPrice": 60
      },
      {
        "weight": "500 g",
        "price": 295,
        "originalPrice": 295
      }
    ],
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500"
  },
  {
    "id": "BS2",
    "name": "Modern Supreme Sandwich Bread",
    "category": "The Bread Store",
    "price": 60,
    "originalPrice": 60,
    "weight": "400 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"
  },
  {
    "id": "BS3",
    "name": "Amul Pasteurised Butter (Large)",
    "category": "The Bread Store",
    "price": 295,
    "originalPrice": 295,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500"
  },
  {
    "id": "BS4",
    "name": "Amul Garlic & Herbs Butter",
    "category": "The Bread Store",
    "price": 70,
    "originalPrice": 70,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500"
  },
  {
    "id": "BS5",
    "name": "Modern 100% Whole Wheat Bread (Zero Maida)",
    "category": "The Bread Store",
    "price": 65,
    "originalPrice": 65,
    "weight": "400 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"
  },
  {
    "id": "BS6",
    "name": "Amul Cheese Cubes",
    "category": "The Bread Store",
    "price": 135,
    "originalPrice": 135,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500"
  },
  {
    "id": "BS7",
    "name": "Amul Diced Cheese Blend Mozzarella & Cheddar",
    "category": "The Bread Store",
    "price": 125,
    "originalPrice": 125,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500"
  },
  {
    "id": "BS8",
    "name": "Amul Processed Cheese Block",
    "category": "The Bread Store",
    "price": 129,
    "originalPrice": 129,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500"
  },
  {
    "id": "PK1",
    "name": "The little farm co. Homemade Red chilli Pickle/achar",
    "category": "Premium Pickles",
    "price": 207,
    "originalPrice": 235,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=500"
  },
  {
    "id": "PK2",
    "name": "The little farm co. Homemade Mango Pickle",
    "category": "Premium Pickles",
    "price": 207,
    "originalPrice": 235,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=500"
  },
  {
    "id": "PK3",
    "name": "The little farm co. Homemade Lemon Khatta Meetha Pickle",
    "category": "Premium Pickles",
    "price": 207,
    "originalPrice": 235,
    "weight": "300 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=500"
  },
  {
    "id": "PK4",
    "name": "The little farm co. Homemade Green Chilli Pickle/Achar",
    "category": "Premium Pickles",
    "price": 207,
    "originalPrice": 235,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=500"
  },
  {
    "id": "PK5",
    "name": "Homemade Love Punjabi Aam Ka Achaar",
    "category": "Premium Pickles",
    "price": 258,
    "originalPrice": 280,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=500"
  },
  {
    "id": "SW1",
    "name": "Bold Care Extend Long Last Spray for Men",
    "category": "Sexual Wellness",
    "price": 269,
    "originalPrice": 309,
    "weight": "20 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW2",
    "name": "Durex Intense Vibe Ring For Extra Pleasure",
    "category": "Sexual Wellness",
    "price": 495,
    "originalPrice": 799,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW3",
    "name": "Skore Duo Max Condom Pack of 10",
    "category": "Sexual Wellness",
    "price": 195,
    "originalPrice": 300,
    "weight": "10 pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW4",
    "name": "Skore Skin Thin Condoms",
    "category": "Sexual Wellness",
    "price": 148,
    "originalPrice": 180,
    "weight": "10 pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW5",
    "name": "Durex Intense Lube - Tingling Lubricant",
    "category": "Sexual Wellness",
    "price": 359,
    "originalPrice": 399,
    "weight": "50 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW6",
    "name": "Plush Lubricant Water Based Non-Sticky for Men and Women",
    "category": "Sexual Wellness",
    "price": 292,
    "originalPrice": 449,
    "weight": "50 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW7",
    "name": "Durex Mutual Climax Condom - Long-Lasting",
    "category": "Sexual Wellness",
    "price": 169,
    "originalPrice": 174,
    "weight": "3 pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "SW8",
    "name": "Bold Care Delay Condoms",
    "category": "Sexual Wellness",
    "price": 140,
    "originalPrice": 300,
    "weight": "10 pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
  },
  {
    "id": "dairy_milk_1",
    "name": "Milking A2 pasteurised milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 35,
    "originalPrice": 45,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_2",
    "name": "Nandini Pasteurised Toned Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 24,
    "originalPrice": 24,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 24
      },
      {
        "weight": "1 Ltr",
        "price": 46
      }
    ]
  },
  {
    "id": "dairy_milk_3",
    "name": "Nandini Shubham Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 27,
    "originalPrice": 27,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 27
      },
      {
        "weight": "1 Ltr",
        "price": 52
      }
    ]
  },
  {
    "id": "dairy_milk_4",
    "name": "Arokya Full Cream Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 36,
    "originalPrice": 36,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_5",
    "name": "Nandini Toned Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 46,
    "originalPrice": 46,
    "weight": "1 Ltr",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_6",
    "name": "Nandini Pasteurised Cow Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 26,
    "originalPrice": 26,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_7",
    "name": "Heritage Daily Health Toned Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 26,
    "originalPrice": 26,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 26
      },
      {
        "weight": "1 Ltr",
        "price": 50
      }
    ]
  },
  {
    "id": "dairy_milk_8",
    "name": "Nandini Pasteurised Toned Milk 500 ml + Nandini Curd 500 g",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 52,
    "originalPrice": 52,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_9",
    "name": "Arokya Toned Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 26,
    "originalPrice": 26,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 26
      },
      {
        "weight": "1 Ltr",
        "price": 50
      }
    ]
  },
  {
    "id": "dairy_milk_10",
    "name": "Nandini GoodLife Toned Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 68,
    "originalPrice": 68,
    "weight": "1 Ltr",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_11",
    "name": "Akshayakalpa Amrutha Farm Fresh Organic Cow Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 53,
    "originalPrice": 53,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 53
      },
      {
        "weight": "1 Ltr",
        "price": 99
      }
    ]
  },
  {
    "id": "dairy_milk_12",
    "name": "Amul Gold Pasteurised Full Cream Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 34,
    "originalPrice": 34,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 34
      },
      {
        "weight": "1 Ltr",
        "price": 66
      }
    ]
  },
  {
    "id": "dairy_milk_13",
    "name": "Amul Taaza Milky Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 116,
    "originalPrice": 116,
    "weight": "500 ml x 4",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_14",
    "name": "Amul Taaza Tetra",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 17,
    "originalPrice": 17,
    "weight": "200 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_milk_15",
    "name": "Heritage Happy Full Cream Milk",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 35,
    "originalPrice": 36,
    "weight": "500 ml",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 ml",
        "price": 35,
        "originalPrice": 36
      },
      {
        "weight": "1 Ltr",
        "price": 68
      }
    ]
  },
  {
    "id": "dairy_egg_1",
    "name": "Fresh Eggs White (Premium Pack)",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 51,
    "originalPrice": 75,
    "weight": "6 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_curd_1",
    "name": "Nandini Curd (Fresh Cup)",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 27,
    "originalPrice": 28,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_butter_1",
    "name": "Amul Butter (Salted)",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 56,
    "originalPrice": 56,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "dairy_bread_1",
    "name": "Premium Sliced Bread (White)",
    "category": "Dairy, Bread & Eggs",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 30,
    "weight": "400 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_1",
    "name": "South Alphonso Mango (Karnataka Badami) (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 39,
    "originalPrice": 49,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_2",
    "name": "Banganapalli / Safeda Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 45,
    "originalPrice": 56,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "1 Piece",
        "price": 45,
        "originalPrice": 56
      },
      {
        "weight": "3 Pieces",
        "price": 130,
        "originalPrice": 160
      }
    ]
  },
  {
    "id": "mango_3",
    "name": "Raspuri Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 29,
    "originalPrice": 36,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "1 Piece",
        "price": 29,
        "originalPrice": 36
      },
      {
        "weight": "4 Pieces",
        "price": 110,
        "originalPrice": 140
      }
    ]
  },
  {
    "id": "mango_4",
    "name": "Mango Mallika (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 135,
    "originalPrice": 169,
    "weight": "3 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1628557008169-d4508933b9aa?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_5",
    "name": "Chinna Rasalu Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 44,
    "originalPrice": 55,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_6",
    "name": "Raspuri Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 95,
    "originalPrice": 119,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_7",
    "name": "Mini Kesar Mango (Maharashtra) (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 115,
    "originalPrice": 144,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_8",
    "name": "Alphonso Mango (Hapus) (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 225,
    "originalPrice": 281,
    "weight": "3 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "3 Pieces",
        "price": 225,
        "originalPrice": 281
      },
      {
        "weight": "6 Pieces",
        "price": 440,
        "originalPrice": 550
      }
    ]
  },
  {
    "id": "mango_9",
    "name": "Mango Totapuri Ripe (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 25,
    "originalPrice": 31,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1569870499742-7f3d8e52b21a?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_10",
    "name": "Totapuri Raw Mango (Mavinahannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 16,
    "originalPrice": 20,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1569870499742-7f3d8e52b21a?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_11",
    "name": "Himayath / Imam Pasand Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 125,
    "originalPrice": 156,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_12",
    "name": "Mango Lalbagh Sindhura (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 89,
    "originalPrice": 111,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_13",
    "name": "Kesar Mango (South) (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 65,
    "originalPrice": 81,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_14",
    "name": "South Dasheri Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 69,
    "originalPrice": 86,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_15",
    "name": "Bhoomi Farms Organically Grown Banganapalli Mango",
    "category": "The Fruit Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 202,
    "originalPrice": 253,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_16",
    "name": "Bhoomi Farms Organically Grown Mallika Mango",
    "category": "The Fruit Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 169,
    "originalPrice": 211,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1628557008169-d4508933b9aa?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_17",
    "name": "Premium Kesar Mango (Maharashtra) (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 59,
    "originalPrice": 74,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "mango_18",
    "name": "Gujarat Kesar Mango (Mavina Hannu)",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 55,
    "originalPrice": 69,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "fruit_1",
    "name": "Premium Royal Gala Apples",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 139,
    "originalPrice": 179,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "fruit_2",
    "name": "Pomegranate (Anar) Premium",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 110,
    "originalPrice": 140,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "fruit_3",
    "name": "Imported Kiwi Green",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 120,
    "weight": "3 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1585059895524-72359e061381?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "fruit_4",
    "name": "Red Dragon Fruit",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 79,
    "originalPrice": 99,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "fruit_5",
    "name": "Fresh Mixed Cut Fruit Bowl",
    "category": "The Fruit Store",
    "tags": [],
    "isTrending": false,
    "price": 79,
    "originalPrice": 99,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_atta_1",
    "name": "Aashirvaad Chakki Khapli Atta, Ancient Wheat Flour",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 149,
    "originalPrice": 240,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_atta_2",
    "name": "Aashirvaad Select Sharbati Atta",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 344,
    "originalPrice": 406,
    "weight": "5 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "5 kg",
        "price": 344,
        "originalPrice": 406
      },
      {
        "weight": "1 kg",
        "price": 72,
        "originalPrice": 84
      }
    ]
  },
  {
    "id": "grocery_atta_3",
    "name": "ITC Right Shift Multigrain+ Atta, 5Kg | 0% Maida| High Protein Flour | High Fibre Atta | Low GI Atta | 30% More Protein | Multi...",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 277,
    "originalPrice": 449,
    "weight": "5 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_atta_4",
    "name": "Aashirvaad Superior MP Atta, 100 % Whole Wheat Flour, 0% Maida",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 64,
    "originalPrice": 74,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "1 kg",
        "price": 64,
        "originalPrice": 74
      },
      {
        "weight": "2 kg",
        "price": 125,
        "originalPrice": 133
      },
      {
        "weight": "5 kg",
        "price": 306,
        "originalPrice": 358
      },
      {
        "weight": "10 kg",
        "price": 535,
        "originalPrice": 644
      }
    ]
  },
  {
    "id": "grocery_atta_5",
    "name": "Aashirvaad Atta High Protein",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 325,
    "originalPrice": 420,
    "weight": "5 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "5 kg",
        "price": 325,
        "originalPrice": 420
      },
      {
        "weight": "1 kg",
        "price": 55,
        "originalPrice": 86
      }
    ]
  },
  {
    "id": "grocery_atta_6",
    "name": "Pillsbury Chakki Fresh Atta",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 250,
    "originalPrice": 355,
    "weight": "5 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "5 kg",
        "price": 250,
        "originalPrice": 355
      },
      {
        "weight": "1 kg",
        "price": 61,
        "originalPrice": 73
      }
    ]
  },
  {
    "id": "grocery_atta_7",
    "name": "Fortune Chakki Fresh Atta",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 51,
    "originalPrice": 107,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "1 kg",
        "price": 51,
        "originalPrice": 107
      }
    ]
  },
  {
    "id": "grocery_atta_8",
    "name": "Aashirvaad Multigrains Atta",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 73,
    "originalPrice": 84,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_atta_9",
    "name": "24 Mantra Wholewheat Atta",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 61,
    "originalPrice": 90,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_rice_1",
    "name": "India Gate Super Basmati Rice",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 110,
    "originalPrice": 140,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_rice_2",
    "name": "Daawat Rozana Super Basmati Rice",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 85,
    "originalPrice": 105,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "grocery_dal_1",
    "name": "Tata Sampann Premium Toor Dal",
    "category": "Atta, Rice and Dal",
    "tags": [],
    "isTrending": false,
    "price": 165,
    "originalPrice": 190,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1596790011460-9d89e51d0342?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_1",
    "name": "Alburyani Cardamom Rich & Aromatic( Elaichi)",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 149,
    "originalPrice": 149,
    "weight": "20 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_2",
    "name": "Lotus Spices Elaichi Green",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 74,
    "originalPrice": 80,
    "weight": "15 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_3",
    "name": "Safe Harvest Seedless Tamarind",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 164,
    "originalPrice": 270,
    "weight": "200 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "200 g x 2",
        "price": 164,
        "originalPrice": 270
      },
      {
        "weight": "200 g",
        "price": 85,
        "originalPrice": 135
      }
    ]
  },
  {
    "id": "masalas_4",
    "name": "Supreme Harvest Mustard Small Whole",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 31,
    "originalPrice": 46,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "100 g",
        "price": 31,
        "originalPrice": 46
      },
      {
        "weight": "200 g",
        "price": 58,
        "originalPrice": 85
      }
    ]
  },
  {
    "id": "masalas_5",
    "name": "Lotus Spices Lawang",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 37,
    "originalPrice": 40,
    "weight": "15 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_6",
    "name": "Tata Sampann Kasuri Methi with Natural Oils",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 31,
    "originalPrice": 32,
    "weight": "25 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_7",
    "name": "Tata Sampann Whole Spices Coriander Seed",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 35,
    "originalPrice": 45,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_8",
    "name": "Supreme Harvest Black Pepper Whole Spice",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 78,
    "originalPrice": 138,
    "weight": "25 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_9",
    "name": "Lotus Spices Black Pepper Whole",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 37,
    "originalPrice": 40,
    "weight": "25 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_10",
    "name": "Popular Essentials Tamarind",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 90,
    "originalPrice": 180,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_11",
    "name": "Catch Jeera Whole",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 86,
    "originalPrice": 140,
    "weight": "100 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_12",
    "name": "Organeekz Organic Saunf /Fennel",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 120,
    "originalPrice": 120,
    "weight": "100 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_13",
    "name": "Popular Essentials Poppy Seeds (Khus Khus)",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 160,
    "originalPrice": 180,
    "weight": "50 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_14",
    "name": "Popular Essentials Black Pepper",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 130,
    "originalPrice": 180,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_15",
    "name": "Supreme Harvest White Sesame Seeds",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 62,
    "originalPrice": 130,
    "weight": "100 g x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_16",
    "name": "Supreme Harvest Green Cardamom Whole (Elaichi Green)",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 113,
    "originalPrice": 163,
    "weight": "25 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_17",
    "name": "Popular Essentials Byadagi Chilli Stemless",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 175,
    "originalPrice": 195,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "masalas_18",
    "name": "Supreme Harvest Fenugreek Seeds (Methi)",
    "category": "Masalas",
    "tags": [],
    "isTrending": false,
    "price": 42,
    "originalPrice": 57,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "200 g",
        "price": 42,
        "originalPrice": 57
      },
      {
        "weight": "100 g",
        "price": 23,
        "originalPrice": 32
      }
    ]
  },
  {
    "id": "meat_1",
    "name": "Nandus Chicken Curry Cut - Skinless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 164,
    "originalPrice": 175,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_2",
    "name": "Nandus Chicken Breast Boneless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 249,
    "originalPrice": 259,
    "weight": "450 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_3",
    "name": "Nandus Chicken Curry Cut - with Skin",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 155,
    "originalPrice": 165,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_4",
    "name": "Nandus Chicken Drumstick",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 229,
    "originalPrice": 229,
    "weight": "450 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_5",
    "name": "FreshtoHome Premium Chicken Boneless Breast Fillet",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 255,
    "originalPrice": 263,
    "weight": "400 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_6",
    "name": "Nandus Chicken Leg Boneless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 239,
    "originalPrice": 239,
    "weight": "450 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1606728035253-49e196721186?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_7",
    "name": "Nandus Chicken Mince/Keema",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 249,
    "originalPrice": 249,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1588168333986-50786401586a?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_8",
    "name": "Licious Chicken Curry Cut (Small Pieces) - Skinless 450g and Classic Eggs 6 Pieces",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 236,
    "originalPrice": 254,
    "weight": "1 Combo",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_9",
    "name": "TenderCuts Chicken Curry cut Skinless 450g + Fresh Eggs White eggs 6 Pieces",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 192,
    "originalPrice": 254,
    "weight": "1 Combo",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_10",
    "name": "TenderCuts Chicken Curry cut with Skin",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 129,
    "originalPrice": 169,
    "weight": "450 g",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_11",
    "name": "Licious Chicken Curry Cut (Large Pieces) - Skinless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 161,
    "originalPrice": 179,
    "weight": "450 g",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_12",
    "name": "TenderCuts Chicken Drumsticks",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 139,
    "weight": "2 Pieces",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_13",
    "name": "Nandus Chicken Liver 500g",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 218,
    "originalPrice": 218,
    "weight": "500 g x 2",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_14",
    "name": "TenderCuts Chicken Drumsticks 2 Pieces + Fresh Eggs White eggs 6 Pieces",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 152,
    "originalPrice": 214,
    "weight": "1 Combo",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_15",
    "name": "TenderCuts Chicken Breast Boneless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 209,
    "originalPrice": 259,
    "weight": "400 g",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_16",
    "name": "Licious Chicken Breast Boneless",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 265,
    "originalPrice": 295,
    "weight": "400 g",
    "stock": 0,
    "image": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_17",
    "name": "Fresh Seer Fish Steaks (Surmai)",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 399,
    "originalPrice": 450,
    "weight": "500 g",
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "meat_18",
    "name": "Premium Tender Mutton Curry Cut",
    "category": "Meat and Seafood",
    "tags": [],
    "isTrending": false,
    "price": 449,
    "originalPrice": 499,
    "weight": "500 g",
    "stock": 15,
    "image": "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_1",
    "name": "Fortune Premium Kachi Ghani Mustard Oil",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 165,
    "originalPrice": 195,
    "weight": "1 Ltr",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "1 Ltr",
        "price": 165,
        "originalPrice": 195
      },
      {
        "weight": "5 Ltr",
        "price": 799,
        "originalPrice": 950
      }
    ]
  },
  {
    "id": "oil_ghee_2",
    "name": "Fortune Soya Health Refined Oil",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 125,
    "originalPrice": 140,
    "weight": "1 Ltr",
    "stock": 45,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_3",
    "name": "Anveshan Wood Pressed Yellow Mustard Oil",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 390,
    "originalPrice": 420,
    "weight": "1 Ltr",
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_4",
    "name": "Aashirvaad Svasti Pure Cow Ghee",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 690,
    "originalPrice": 750,
    "weight": "1 Ltr",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1589733901241-5e534273f6b6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_5",
    "name": "Amul Pure Ghee",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 650,
    "originalPrice": 670,
    "weight": "1 Ltr",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1589733901241-5e534273f6b6?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_6",
    "name": "Borges Canola Oil",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 299,
    "originalPrice": 350,
    "weight": "1 Ltr",
    "stock": 15,
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "oil_ghee_7",
    "name": "Parachute Pure Coconut Oil",
    "category": "Oils and Ghee",
    "tags": [],
    "isTrending": false,
    "price": 180,
    "originalPrice": 200,
    "weight": "500 ml",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_1",
    "name": "Kellogg's Rolled Oats",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 149,
    "originalPrice": 185,
    "weight": "1 kg",
    "stock": 35,
    "image": "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_2",
    "name": "Kellogg's Corn Flakes",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 185,
    "originalPrice": 210,
    "weight": "500 g",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_3",
    "name": "Quaker Instant Oats",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 120,
    "weight": "400 g",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_4",
    "name": "Baggry's Premium Muesli Fruit & Nut",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 350,
    "originalPrice": 420,
    "weight": "750 g",
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_5",
    "name": "MTR Rava Idli Mix",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 80,
    "originalPrice": 95,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cereal_6",
    "name": "Bambino Roasted Vermicelli",
    "category": "Cereals & Breakfast",
    "tags": [],
    "isTrending": false,
    "price": 45,
    "originalPrice": 50,
    "weight": "450 g",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cold_drink_1",
    "name": "Coca-Cola Soft Drink",
    "category": "Cold Drinks and Juices",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 45,
    "weight": "750 ml",
    "stock": 100,
    "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "750 ml",
        "price": 40,
        "originalPrice": 45
      },
      {
        "weight": "1.25 Ltr",
        "price": 65,
        "originalPrice": 75
      },
      {
        "weight": "2 Ltr",
        "price": 95,
        "originalPrice": 110
      }
    ]
  },
  {
    "id": "cold_drink_2",
    "name": "Sprite Lemon Lime Soda",
    "category": "Cold Drinks and Juices",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 45,
    "weight": "750 ml",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1543257580-7269da773bf5?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cold_drink_3",
    "name": "Real Fruit Power Mixed Fruit Juice",
    "category": "Cold Drinks and Juices",
    "tags": [],
    "isTrending": false,
    "price": 110,
    "originalPrice": 130,
    "weight": "1 Ltr",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cold_drink_4",
    "name": "Red Bull Energy Drink",
    "category": "Cold Drinks and Juices",
    "tags": [],
    "isTrending": false,
    "price": 125,
    "originalPrice": 130,
    "weight": "250 ml",
    "stock": 120,
    "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cold_drink_5",
    "name": "Paper Boat Pure Coconut Water",
    "category": "Cold Drinks and Juices",
    "tags": [],
    "isTrending": false,
    "price": 50,
    "originalPrice": 60,
    "weight": "200 ml",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "ice_cream_1",
    "name": "Amul Vanilla Magic Tub",
    "category": "Ice Creams & Desserts",
    "tags": [],
    "isTrending": false,
    "price": 150,
    "originalPrice": 180,
    "weight": "1 Ltr",
    "stock": 25,
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "ice_cream_2",
    "name": "Kwality Walls Double Chocolate Cone",
    "category": "Ice Creams & Desserts",
    "tags": [],
    "isTrending": false,
    "price": 45,
    "originalPrice": 50,
    "weight": "110 ml",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "ice_cream_3",
    "name": "Amul Kesar Pista Shrikhand",
    "category": "Ice Creams & Desserts",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 70,
    "weight": "500 g",
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "ice_cream_4",
    "name": "Havmor Premium Rajbhog Ice Cream Tub",
    "category": "Ice Creams & Desserts",
    "tags": [],
    "isTrending": false,
    "price": 250,
    "originalPrice": 300,
    "weight": "1 Ltr",
    "stock": 15,
    "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chips_1",
    "name": "Lay's Classic Salted Potato Chips",
    "category": "Chips and Namkeens",
    "tags": [],
    "isTrending": false,
    "price": 20,
    "originalPrice": 20,
    "weight": "50 g",
    "stock": 120,
    "image": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "50 g",
        "price": 20
      },
      {
        "weight": "90 g",
        "price": 38
      },
      {
        "weight": "150 g",
        "price": 60
      }
    ]
  },
  {
    "id": "chips_2",
    "name": "Haldiram's Premium Aloo Bhujia",
    "category": "Chips and Namkeens",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 50,
    "weight": "150 g",
    "stock": 100,
    "image": "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chips_3",
    "name": "Kurkure Spicy Masala Munch",
    "category": "Chips and Namkeens",
    "tags": [],
    "isTrending": false,
    "price": 20,
    "originalPrice": 20,
    "weight": "80 g",
    "stock": 150,
    "image": "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chips_4",
    "name": "Doritos Nacho Cheese Tortilla Chips",
    "category": "Chips and Namkeens",
    "tags": [],
    "isTrending": false,
    "price": 50,
    "originalPrice": 60,
    "weight": "100 g",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chocolate_1",
    "name": "Cadbury Dairy Milk Silk Chocolate Bar",
    "category": "Chocolates",
    "tags": [],
    "isTrending": false,
    "price": 80,
    "originalPrice": 90,
    "weight": "60 g",
    "stock": 150,
    "image": "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "60 g",
        "price": 80,
        "originalPrice": 90
      },
      {
        "weight": "150 g",
        "price": 170,
        "originalPrice": 190
      }
    ]
  },
  {
    "id": "chocolate_2",
    "name": "Amul Dark Chocolate 75% Cocoa",
    "category": "Chocolates",
    "tags": [],
    "isTrending": false,
    "price": 110,
    "originalPrice": 125,
    "weight": "150 g",
    "stock": 70,
    "image": "https://images.unsplash.com/photo-1548907040-4d42b5212c10?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chocolate_3",
    "name": "Nestlé KitKat Share Finger Bag",
    "category": "Chocolates",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 70,
    "weight": "120 g",
    "stock": 90,
    "image": "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "chocolate_4",
    "name": "Ferrero Rocher Premium Gift Pack",
    "category": "Chocolates",
    "tags": [],
    "isTrending": false,
    "price": 350,
    "originalPrice": 400,
    "weight": "16 Pcs",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "biscuit_1",
    "name": "Britannia Good Day Cashew Cookies",
    "category": "Biscuits and Cakes",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 40,
    "weight": "150 g",
    "stock": 120,
    "image": "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "biscuit_2",
    "name": "Oreo Original Chocolate Sandwich Biscuits",
    "category": "Biscuits and Cakes",
    "tags": [],
    "isTrending": false,
    "price": 35,
    "originalPrice": 40,
    "weight": "120 g",
    "stock": 100,
    "image": "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "biscuit_3",
    "name": "Sunfeast Hide & Seek Chocolate Chip Cookies",
    "category": "Biscuits and Cakes",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 45,
    "weight": "120 g",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "biscuit_4",
    "name": "Britannia Premium Bake Rusk",
    "category": "Biscuits and Cakes",
    "tags": [],
    "isTrending": false,
    "price": 50,
    "originalPrice": 60,
    "weight": "300 g",
    "stock": 70,
    "image": "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "tea_coffee_1",
    "name": "Brooke Bond Red Label Tea",
    "category": "Tea, Coffee & Drinks",
    "tags": [],
    "isTrending": false,
    "price": 180,
    "originalPrice": 220,
    "weight": "500 g",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "500 g",
        "price": 180,
        "originalPrice": 220
      },
      {
        "weight": "1 kg",
        "price": 345,
        "originalPrice": 410
      }
    ]
  },
  {
    "id": "tea_coffee_2",
    "name": "Nescafé Classic Instant Coffee",
    "category": "Tea, Coffee & Drinks",
    "tags": [],
    "isTrending": false,
    "price": 165,
    "originalPrice": 180,
    "weight": "100 g",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "tea_coffee_3",
    "name": "Lipton Green Tea Lemon Bags",
    "category": "Tea, Coffee & Drinks",
    "tags": [],
    "isTrending": false,
    "price": 220,
    "originalPrice": 250,
    "weight": "25 Pcs",
    "stock": 35,
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "tea_coffee_4",
    "name": "Cadbury Bournvita Chocolate Health Drink",
    "category": "Tea, Coffee & Drinks",
    "tags": [],
    "isTrending": false,
    "price": 240,
    "originalPrice": 260,
    "weight": "500 g",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sauce_spread_1",
    "name": "Kissan Fresh Tomato Ketchup",
    "category": "Sauces and Spreads",
    "tags": [],
    "isTrending": false,
    "price": 120,
    "originalPrice": 150,
    "weight": "1 kg",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sauce_spread_2",
    "name": "Dr. Oetker FunFoods Veg Mayonnaise Original",
    "category": "Sauces and Spreads",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 110,
    "weight": "400 g",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sauce_spread_3",
    "name": "Nutella Hazelnut Spread with Cocoa",
    "category": "Sauces and Spreads",
    "tags": [],
    "isTrending": false,
    "price": 350,
    "originalPrice": 380,
    "weight": "350 g",
    "stock": 25,
    "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sauce_spread_4",
    "name": "Dabur 100% Pure Squeezy Honey",
    "category": "Sauces and Spreads",
    "tags": [],
    "isTrending": false,
    "price": 165,
    "originalPrice": 195,
    "weight": "400 g",
    "stock": 45,
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sweet_1",
    "name": "Haldiram's Premium Kaju Katli",
    "category": "Sweet Corner",
    "tags": [],
    "isTrending": false,
    "price": 350,
    "originalPrice": 420,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
    "variants": [
      {
        "weight": "250 g",
        "price": 350,
        "originalPrice": 420
      },
      {
        "weight": "500 g",
        "price": 680,
        "originalPrice": 800
      }
    ]
  },
  {
    "id": "sweet_2",
    "name": "Haldiram's Sweet Gulab Jamun Tin",
    "category": "Sweet Corner",
    "tags": [],
    "isTrending": false,
    "price": 180,
    "originalPrice": 220,
    "weight": "1 kg",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "sweet_3",
    "name": "Bikano Premium Soan Papdi",
    "category": "Sweet Corner",
    "tags": [],
    "isTrending": false,
    "price": 90,
    "originalPrice": 110,
    "weight": "250 g",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "bath_body_1",
    "name": "Dettol Liquid Handwash Refill",
    "category": "Bath and Body",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 120,
    "weight": "750 ml",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "bath_body_2",
    "name": "Dove Cream Beauty Soap Bar",
    "category": "Bath and Body",
    "tags": [],
    "isTrending": false,
    "price": 55,
    "originalPrice": 65,
    "weight": "100 g",
    "stock": 120,
    "image": "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "bath_body_3",
    "name": "Nivea Nourishing Body Milk Lotion",
    "category": "Bath and Body",
    "tags": [],
    "isTrending": false,
    "price": 299,
    "originalPrice": 399,
    "weight": "400 ml",
    "stock": 45,
    "image": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "hair_care_1",
    "name": "L'Oréal Paris Total Repair 5 Shampoo",
    "category": "Hair Care",
    "tags": [],
    "isTrending": false,
    "price": 240,
    "originalPrice": 299,
    "weight": "340 ml",
    "stock": 60,
    "image": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "hair_care_2",
    "name": "Tresemmé Keratin Smooth Conditioner",
    "category": "Hair Care",
    "tags": [],
    "isTrending": false,
    "price": 220,
    "originalPrice": 260,
    "weight": "190 ml",
    "stock": 40,
    "image": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "hair_care_3",
    "name": "Parachute Advansed Jasmine Hair Oil",
    "category": "Hair Care",
    "tags": [],
    "isTrending": false,
    "price": 125,
    "originalPrice": 150,
    "weight": "300 ml",
    "stock": 75,
    "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "skincare_1",
    "name": "Himalaya Purifying Neem Face Wash",
    "category": "Skincare",
    "tags": [],
    "isTrending": false,
    "price": 140,
    "originalPrice": 170,
    "weight": "150 ml",
    "stock": 90,
    "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "skincare_2",
    "name": "Mamaearth Ultra Light Sunscreen SPF 50",
    "category": "Skincare",
    "tags": [],
    "isTrending": false,
    "price": 299,
    "originalPrice": 349,
    "weight": "80 ml",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "skincare_3",
    "name": "Nivea Soft Light Moisturiser Cream",
    "category": "Skincare",
    "tags": [],
    "isTrending": false,
    "price": 95,
    "originalPrice": 120,
    "weight": "100 ml",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "health_pharma_1",
    "name": "ENO Lemon Instant Fruit Salt",
    "category": "Health and Pharma",
    "tags": [],
    "isTrending": false,
    "price": 90,
    "originalPrice": 100,
    "weight": "6 Sachets",
    "stock": 150,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "health_pharma_2",
    "name": "Vicks Vaporub Cold Relief Balm",
    "category": "Health and Pharma",
    "tags": [],
    "isTrending": false,
    "price": 99,
    "originalPrice": 110,
    "weight": "50 g",
    "stock": 100,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "health_pharma_3",
    "name": "Dolo-650 Paracetamol Tablet Strip",
    "category": "Health and Pharma",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 32,
    "weight": "15 Tabs",
    "stock": 200,
    "image": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "home_kitchen_1",
    "name": "Milton Thermosteel Classic Flask Bottle",
    "category": "Home and Kitchen",
    "tags": [],
    "isTrending": false,
    "price": 699,
    "originalPrice": 799,
    "weight": "1 Ltr",
    "stock": 20,
    "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "home_kitchen_2",
    "name": "Scotch-Brite Heavy Duty Sponge Scrub",
    "category": "Home and Kitchen",
    "tags": [],
    "isTrending": false,
    "price": 75,
    "originalPrice": 90,
    "weight": "3 Pack",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "home_kitchen_3",
    "name": "Shalimar Premium Trash Garbage Bags",
    "category": "Home and Kitchen",
    "tags": [],
    "isTrending": false,
    "price": 90,
    "originalPrice": 110,
    "weight": "30 Bags",
    "stock": 100,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "puja_store_1",
    "name": "Cycle Pure Agarbatti Cycle 3-in-1",
    "category": "Puja Store",
    "subCategory": "Pooja & Festive",
    "tags": [],
    "isTrending": false,
    "price": 70,
    "originalPrice": 85,
    "weight": "100 Sticks",
    "stock": 50,
    "image": "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "puja_store_2",
    "name": "Bhimseni Kapoor Pure Camphor Crystals",
    "category": "Puja Store",
    "subCategory": "Pooja & Festive",
    "tags": [],
    "isTrending": false,
    "price": 120,
    "originalPrice": 150,
    "weight": "100 g",
    "stock": 65,
    "image": "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cleaner_1",
    "name": "Lizol Floor Cleaner Disinfectant Citrus",
    "category": "Cleaners & Repellents",
    "tags": [],
    "isTrending": false,
    "price": 120,
    "originalPrice": 145,
    "weight": "975 ml",
    "stock": 80,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "cleaner_2",
    "name": "Vim Lemon Dishwash Liquid Gel",
    "category": "Cleaners & Repellents",
    "tags": [],
    "isTrending": false,
    "price": 115,
    "originalPrice": 135,
    "weight": "750 ml",
    "stock": 90,
    "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "electronics_1",
    "name": "boAt Bassheads 100 Wired Earphones",
    "category": "Electronics & Appliances",
    "tags": [],
    "isTrending": false,
    "price": 399,
    "originalPrice": 599,
    "weight": "1 Pc",
    "stock": 45,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "electronics_2",
    "name": "Duracell Ultra AA Alkaline Batteries",
    "category": "Electronics & Appliances",
    "tags": [],
    "isTrending": false,
    "price": 150,
    "originalPrice": 180,
    "weight": "4 Pack",
    "stock": 120,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
    "variants": []
  },
  {
    "id": "veg33",
    "name": "Bitter Gourd (Haagalakaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 72,
    "originalPrice": 92,
    "weight": "1 Pack x 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500",
    "variants": []
  },
  {
    "id": "veg34",
    "name": "Snake Gourd (Padavalakaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 21,
    "originalPrice": 26,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=500",
    "variants": []
  },
  {
    "id": "veg35",
    "name": "Ash Gourd (Boodu Kumbalakaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 53,
    "originalPrice": 66,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=500",
    "variants": []
  },
  {
    "id": "veg36",
    "name": "Ash Gourd Long",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 131,
    "originalPrice": 164,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=500",
    "variants": []
  },
  {
    "id": "veg37",
    "name": "Baby Ash Gourd",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 140,
    "originalPrice": 175,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=500",
    "variants": []
  },
  {
    "id": "veg38",
    "name": "Cluster Beans (Gorikayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 18,
    "originalPrice": 23,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500",
    "variants": []
  },
  {
    "id": "veg39",
    "name": "Cowpea Beans (Karamani)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 22,
    "originalPrice": 28,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500",
    "variants": []
  },
  {
    "id": "veg40",
    "name": "Organic Certified Ginger (Shunti)",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 47,
    "originalPrice": 59,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500",
    "variants": []
  },
  {
    "id": "veg41",
    "name": "nectr Ginger (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 56,
    "originalPrice": 70,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500",
    "variants": []
  },
  {
    "id": "veg42",
    "name": "English Cucumber (Sowthekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 29,
    "originalPrice": 39,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1604974244764-7c3c07eef848?w=500",
    "variants": []
  },
  {
    "id": "veg43",
    "name": "Baby Lady's Finger (Bendekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 14,
    "originalPrice": 18,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500",
    "variants": []
  },
  {
    "id": "veg44",
    "name": "Organic Certified Lady's Finger (Bendekaayi)",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 33,
    "originalPrice": 41,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500",
    "variants": []
  },
  {
    "id": "veg45",
    "name": "nectr Baby Lady's Finger (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 10,
    "originalPrice": 20,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500",
    "variants": []
  },
  {
    "id": "veg46",
    "name": "Onion, Potato & Desi Tomato",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 114,
    "originalPrice": 142,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
  },
  {
    "id": "veg47",
    "name": "Onion, Potato & Hybrid Tomato",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 120,
    "originalPrice": 150,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
    "variants": []
  },
  {
    "id": "veg48",
    "name": "Spinach & Coriander Leaves",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 56,
    "originalPrice": 73,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500",
    "variants": []
  },
  {
    "id": "veg49",
    "name": "Coccinia (Tondekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 14,
    "originalPrice": 18,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=500",
    "variants": []
  },
  {
    "id": "veg50",
    "name": "Drumstick (Nuggekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 20,
    "originalPrice": 25,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=500",
    "variants": []
  },
  {
    "id": "veg51",
    "name": "Sambar Veg Combo",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 112,
    "originalPrice": 141,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
    "variants": []
  },
  {
    "id": "veg52",
    "name": "nectr Mint Leaves (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 13,
    "originalPrice": 16,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500",
    "variants": []
  },
  {
    "id": "veg53",
    "name": "nectr Potato (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 65,
    "originalPrice": 81,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500",
    "variants": []
  },
  {
    "id": "veg54",
    "name": "Chandramukhi Potato (Aloo Gadde)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 57,
    "originalPrice": 71,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1604974244764-7c3c07eef848?w=500",
    "variants": []
  },
  {
    "id": "veg55",
    "name": "Button Mushroom (Anabe)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 64,
    "originalPrice": 80,
    "weight": "1 Pack",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=500",
    "variants": []
  },
  {
    "id": "veg56",
    "name": "Sweet Corn (Sihi Mekkejola)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 42,
    "originalPrice": 53,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=500",
    "variants": []
  },
  {
    "id": "veg57",
    "name": "Small Coconut (Thenginakayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 48,
    "originalPrice": 60,
    "weight": "1 Small",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg58",
    "name": "Organic Certified Coconut (Thenginakaayi)",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 71,
    "originalPrice": 89,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg59",
    "name": "Colocasia (Arvi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 20,
    "originalPrice": 25,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg60",
    "name": "Beetroot",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 29,
    "originalPrice": 36,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg61",
    "name": "Organic Certified Beetroot",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 34,
    "originalPrice": 43,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg62",
    "name": "Curry Leaves (Karibevu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 12,
    "originalPrice": 15,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg63",
    "name": "Raw Banana (Baalekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 66,
    "originalPrice": 86,
    "weight": "2 Pieces * 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg64",
    "name": "Raw Banana Nendran",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 45,
    "originalPrice": 56,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg65",
    "name": "Sambar Onion (Sambar Eerulli",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 28,
    "originalPrice": 35,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg66",
    "name": "Garlic (Bellulli)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 49,
    "originalPrice": 61,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg67",
    "name": "Organic Certified Garlic (Bellulli)",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 67,
    "originalPrice": 84,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg68",
    "name": "Red Bell Pepper (Kempu Dappa Mensinkaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 39,
    "originalPrice": 49,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg68",
    "name": "Yellow Bell Pepper (Haladi Dappa Mensinkaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 39,
    "originalPrice": 49,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg69",
    "name": "Broccoli",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 58,
    "originalPrice": 73,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg70",
    "name": "Spring Onion (Hasiru Eerulli)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 32,
    "originalPrice": 40,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg71",
    "name": "Green Beans (Beans)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 39,
    "originalPrice": 40,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg72",
    "name": "Knol Khol (Gedde Kosu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 50,
    "originalPrice": 60,
    "weight": "500 g * 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg73",
    "name": "Mixed Lettuce Hydroponically Grown",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 70,
    "originalPrice": 88,
    "weight": "75 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg74",
    "name": "Drumstick Leaves (Nugge Soppu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 23,
    "originalPrice": 29,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg75",
    "name": "Green Zucchini",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 35,
    "originalPrice": 44,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg76",
    "name": "Rosemary",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 12,
    "originalPrice": 30,
    "weight": "10 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg77",
    "name": "Dill Leaves (Sabbasige Soppu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 38,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg78",
    "name": "Baby Bokchoy",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 46,
    "originalPrice": 58,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg79",
    "name": "Kale Leaf",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 17,
    "originalPrice": 21,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg80",
    "name": "Celery",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 36,
    "originalPrice": 45,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg81",
    "name": "Parsley",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 21,
    "originalPrice": 26,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg82",
    "name": "Raw Papaya (Parangaikaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 41,
    "originalPrice": 51,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg83",
    "name": "Nectar Baby Potato (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 33,
    "originalPrice": 41,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg84",
    "name": "Fenugreek (Menthya Soppu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 74,
    "originalPrice": 96,
    "weight": "1 Bunch * 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg85",
    "name": "Nectr Romaine Lettuce (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 45,
    "originalPrice": 56,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg86",
    "name": "Banana Flower (Baale Hoovu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 22,
    "originalPrice": 28,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg87",
    "name": "Baby Potato (Chikka Aloo Gadde)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 28,
    "originalPrice": 35,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg88",
    "name": "Nectr Baby Bok Choy (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 89,
    "originalPrice": 111,
    "weight": "2 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg89",
    "name": "Iceberg Lattuce",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 46,
    "originalPrice": 58,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg90",
    "name": "Green Batavia Lettuce Hydroponically Grown)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 61,
    "originalPrice": 76,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg91",
    "name": "Pluckk Raw Mango Sliced",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 95,
    "originalPrice": 119,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg92",
    "name": "Peeled Sweet Corn by Urban Harvest",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 50,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg93",
    "name": "Bird's Eye Chilli (Menasinakaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 88,
    "originalPrice": 110,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg94",
    "name": "Raw Groundnut (Kadlekaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 190,
    "originalPrice": 240,
    "weight": "500 g * 2",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg95",
    "name": "Nectr Raw Banana (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 75,
    "weight": "3 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg96",
    "name": "Baby Corn Peeled",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 44,
    "originalPrice": 55,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg97",
    "name": "Romaine Lettuce",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 26,
    "originalPrice": 33,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg98",
    "name": "Nectr English Cucumber (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 29,
    "originalPrice": 36,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Pointed Gourd (Parwal)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 32,
    "originalPrice": 40,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Asparagus (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 55,
    "originalPrice": 74,
    "weight": "100 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Iceberg Lettuce (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 71,
    "originalPrice": 89,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Onion - Value Pack (Eerulli)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 81,
    "originalPrice": 101,
    "weight": "3 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Green Butterhead Lettuce Hydroponically Grown",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 75,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Rocket Leaves (Arugula)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 50,
    "originalPrice": 63,
    "weight": "75 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Haricot Beans (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 39,
    "originalPrice": 64,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Red Butterhead Lettuce Hydroponically Grown",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 61,
    "originalPrice": 76,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "KuleKhara Saag",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 43,
    "originalPrice": 54,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Basil",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 14,
    "originalPrice": 18,
    "weight": "50 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Imported Lemon (Nimbe Hannu)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 142,
    "originalPrice": 178,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Rosemary (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 12,
    "originalPrice": 19,
    "weight": "10 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Baby Ooty Carrot",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 18,
    "originalPrice": 23,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Ooty Carrot",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 49,
    "originalPrice": 61,
    "weight": "4 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Peeled Sambar Onion by Urban Harvest",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 53,
    "originalPrice": 66,
    "weight": "200 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Baby Spinach (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 79,
    "originalPrice": 99,
    "weight": "1 Bunch",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Ooty Potato (Aloo Gadde)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 40,
    "originalPrice": 50,
    "weight": "500 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Neem Stem",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 27,
    "originalPrice": 34,
    "weight": "5 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Mixed Microgreens Hydroponically Grown",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 79,
    "originalPrice": 99,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Pumpkin Whole (Disco Pumpkin)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 32,
    "originalPrice": 40,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Cabbage (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 53,
    "originalPrice": 66,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Beetroot",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 32,
    "originalPrice": 82,
    "weight": "2 Pieces",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Small Raw Jackfruit",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 56,
    "originalPrice": 69,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Ridge Gourd (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 37,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Organic Certified Potato (Aloo Gadde)",
    "category": "The Veggie Store",
    "subCategory": "Certified Organics",
    "tags": [],
    "isTrending": false,
    "price": 53,
    "originalPrice": 66,
    "weight": "1 kg",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Sweet Potato (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 30,
    "originalPrice": 37,
    "weight": "500g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "White Onion (Bili Eerulli)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 56,
    "originalPrice": 70,
    "weight": "500g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "English Cucumber - Protected Cultivation",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 29,
    "originalPrice": 36,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Portobello Mushroom (Anabe)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 255,
    "originalPrice": 320,
    "weight": "250g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Coconut (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 75,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Tulasi & Bel Patta",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 105,
    "originalPrice": 132,
    "weight": "1 Combo",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Capsicum Tricolour (Dappa Menasinakaayi)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 90,
    "originalPrice": 115,
    "weight": "3 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Unpeeled Baby Corn",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 25,
    "originalPrice": 35,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Hybrid Tomato (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 60,
    "originalPrice": 75,
    "weight": "1 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Sweet Corn (Chemical Free)",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 55,
    "originalPrice": 70,
    "weight": "2 Piece",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
  {
    "id": "veg99",
    "name": "Nectr Radish",
    "category": "The Veggie Store",
    "tags": [],
    "isTrending": false,
    "price": 27,
    "originalPrice": 34,
    "weight": "250 g",
    "stock": 30,
    "image": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500",
    "variants": []
  },
];

module.exports = products;

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("MongoDB Connected");
      await Product.deleteMany();
      await Product.insertMany(products);
      console.log("Products Added Successfully");
      process.exit();
    })
    .catch((err) => console.log(err));
}
