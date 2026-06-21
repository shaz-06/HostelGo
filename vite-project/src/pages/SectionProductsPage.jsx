import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../ProductCard";
import { cachedFetch } from "../utils/apiCache";
import { usePerfLogger } from "../utils/perfLogger";

const DAIRY_PRODUCTS = [
  {
    _id: "dairy_milk_1",
    name: "Milking A2 pasteurised milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Milking",
    price: 35,
    originalPrice: 45,
    weight: "500 ml",
    description: "Milking A2 pasteurized fresh milk sourced from healthy pasture cows.",
    stock: 30,
    eta: "29 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_2",
    name: "Nandini Pasteurised Toned Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 24,
    weight: "500 ml",
    description: "Pure toned milk from Nandini, packed with nutrients.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 24 },
      { weight: "1 Ltr", price: 46 }
    ]
  },
  {
    _id: "dairy_milk_3",
    name: "Nandini Shubham Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 27,
    weight: "500 ml",
    description: "Fresh milk from Nandini's trusted dairy network",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 27 },
      { weight: "1 Ltr", price: 52 }
    ]
  },
  {
    _id: "dairy_milk_4",
    name: "Arokya Full Cream Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Arokya",
    price: 36,
    weight: "500 ml",
    description: "Pasteurized, Homogenised Full Cream Milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_5",
    name: "Nandini Toned Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 46,
    weight: "1 Ltr",
    description: "Rich, pure, and fresh toned milk from Nandini's state-of-the-art dairies.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_6",
    name: "Nandini Pasteurised Cow Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 26,
    weight: "500 ml",
    description: "Pure and fresh pasteurized cow milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_7",
    name: "Heritage Daily Health Toned Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Heritage",
    price: 26,
    weight: "500 ml",
    description: "Toned milk for daily health",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 26 },
      { weight: "1 Ltr", price: 50 }
    ]
  },
  {
    _id: "dairy_milk_8",
    name: "Nandini Pasteurised Toned Milk 500 ml + Nandini Curd 500 g",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 52,
    weight: "1 Combo",
    description: "Value bundle containing 500 ml Nandini Pasteurised Toned Milk and 500 g Nandini Curd pack.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_9",
    name: "Arokya Toned Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Arokya",
    price: 26,
    weight: "500 ml",
    description: "Pasteurized, Homogenised Toned Milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 26 },
      { weight: "1 Ltr", price: 50 }
    ]
  },
  {
    _id: "dairy_milk_10",
    name: "Nandini GoodLife Toned Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Nandini",
    price: 68,
    weight: "1 Ltr",
    description: "UHT Sterilized Toned Milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_11",
    name: "Akshayakalpa Amrutha Farm Fresh Organic Cow Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Akshayakalpa",
    price: 53,
    weight: "500 ml",
    description: "100% Organic, farm fresh pasteurized cow milk.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 53 },
      { weight: "1 Ltr", price: 99 }
    ]
  },
  {
    _id: "dairy_milk_12",
    name: "Amul Gold Pasteurised Full Cream Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Amul",
    price: 34,
    weight: "500 ml",
    description: "Rich and creamy full-fat milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 34 },
      { weight: "1 Ltr", price: 66 }
    ]
  },
  {
    _id: "dairy_milk_13",
    name: "Amul Taaza Milky Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Amul",
    price: 116,
    weight: "500 ml x 4",
    description: "Creamier Milk for Tastier Tea and Coffee",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_14",
    name: "Amul Taaza Tetra",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Amul",
    price: 17,
    weight: "200 ml",
    description: "Long-life tetra pack toned milk",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_milk_15",
    name: "Heritage Happy Full Cream Milk",
    category: "Dairy, Bread & Eggs",
    subCategory: "Milk",
    brand: "Heritage",
    price: 35,
    originalPrice: 36,
    weight: "500 ml",
    description: "Full cream milk from Heritage",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1528750955902-5b8219d9b61d?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 ml", price: 35, originalPrice: 36 },
      { weight: "1 Ltr", price: 68 }
    ]
  },
  // Subcategories for completeness
  {
    _id: "dairy_egg_1",
    name: "Fresh Eggs White (Premium Pack)",
    category: "Dairy, Bread & Eggs",
    subCategory: "Eggs",
    brand: "Generic",
    price: 51,
    originalPrice: 75,
    weight: "6 Pieces",
    description: "Freshly packed farm-grade white eggs, rich in protein.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_curd_1",
    name: "Nandini Curd (Fresh Cup)",
    category: "Dairy, Bread & Eggs",
    subCategory: "Curd and Yogurts",
    brand: "Nandini",
    price: 27,
    originalPrice: 28,
    weight: "500 g",
    description: "Delicious, thick, and fresh Nandini curd.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_butter_1",
    name: "Amul Butter (Salted)",
    category: "Dairy, Bread & Eggs",
    subCategory: "Butter",
    brand: "Amul",
    price: 56,
    weight: "100 g",
    description: "Utterly Butterly Delicious salted butter from Amul.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
  },
  {
    _id: "dairy_bread_1",
    name: "Premium Sliced Bread (White)",
    category: "Dairy, Bread & Eggs",
    subCategory: "Bread and Buns",
    brand: "Modern",
    price: 30,
    weight: "400 g",
    description: "Soft, freshly baked sliced sandwich white bread.",
    stock: 30,
    eta: "29 MINS",
    image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=500&auto=format&fit=crop",
  }
];

const FRUIT_PRODUCTS = [
  {
    _id: "mango_1",
    name: "South Alphonso Mango (Karnataka Badami) (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 39,
    originalPrice: 49,
    weight: "1 Piece",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_2",
    name: "Banganapalli / Safeda Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 45,
    originalPrice: 56,
    weight: "1 Piece",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop",
    variants: [
      { weight: "1 Piece", price: 45, originalPrice: 56 },
      { weight: "3 Pieces", price: 130, originalPrice: 160 }
    ]
  },
  {
    _id: "mango_3",
    name: "Raspuri Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 29,
    originalPrice: 36,
    weight: "1 Piece",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
    variants: [
      { weight: "1 Piece", price: 29, originalPrice: 36 },
      { weight: "4 Pieces", price: 110, originalPrice: 140 }
    ]
  },
  {
    _id: "mango_4",
    name: "Mango Mallika (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 135,
    originalPrice: 169,
    weight: "3 Pieces",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1628557008169-d4508933b9aa?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_5",
    name: "Chinna Rasalu Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 44,
    originalPrice: 55,
    weight: "2 Pieces",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_6",
    name: "Raspuri Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 95,
    originalPrice: 119,
    weight: "4 Pieces",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_7",
    name: "Mini Kesar Mango (Maharashtra) (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 115,
    originalPrice: 144,
    weight: "4 Pieces",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_8",
    name: "Alphonso Mango (Hapus) (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 225,
    originalPrice: 281,
    weight: "3 Pieces",
    description: "GI Tagged Alphonso mango, naturally sweet with creamy, smooth, indulgent pulp",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
    variants: [
      { weight: "3 Pieces", price: 225, originalPrice: 281 },
      { weight: "6 Pieces", price: 440, originalPrice: 550 }
    ]
  },
  {
    _id: "mango_9",
    name: "Mango Totapuri Ripe (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 25,
    originalPrice: 31,
    weight: "1 Piece",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1569870499742-7f3d8e52b21a?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_10",
    name: "Totapuri Raw Mango (Mavinahannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 16,
    originalPrice: 20,
    weight: "1 Piece",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1569870499742-7f3d8e52b21a?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_11",
    name: "Himayath / Imam Pasand Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 125,
    originalPrice: 156,
    weight: "1 Piece",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_12",
    name: "Mango Lalbagh Sindhura (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 89,
    originalPrice: 111,
    weight: "4 Pieces",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_13",
    name: "Kesar Mango (South) (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 65,
    originalPrice: 81,
    weight: "2 Pieces",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_14",
    name: "South Dasheri Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 69,
    originalPrice: 86,
    weight: "2 Pieces",
    description: "Aromatic and sweet Dasheri mangoes",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1605000797439-7ab1434893e9?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_15",
    name: "Bhoomi Farms Organically Grown Banganapalli Mango",
    category: "The Fruit Store",
    subCategory: "Certified Organics",
    price: 202,
    originalPrice: 253,
    weight: "2 Pieces",
    description: "Authentic Organic and 100% source traceable",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_16",
    name: "Bhoomi Farms Organically Grown Mallika Mango",
    category: "The Fruit Store",
    subCategory: "Certified Organics",
    price: 169,
    originalPrice: 211,
    weight: "2 Pieces",
    description: "Authentic Organic and 100% source traceable",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1628557008169-d4508933b9aa?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_17",
    name: "Premium Kesar Mango (Maharashtra) (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 59,
    originalPrice: 74,
    weight: "1 Piece",
    description: "Best for immediate consumption",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
  },
  {
    _id: "mango_18",
    name: "Gujarat Kesar Mango (Mavina Hannu)",
    category: "The Fruit Store",
    subCategory: "Mango",
    price: 55,
    originalPrice: 69,
    weight: "1 Piece",
    description: "Carbide Free",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1621961559868-d06900ee6b4e?w=500&auto=format&fit=crop",
  },
  // Additional fruits for completeness
  {
    _id: "fruit_1",
    name: "Premium Royal Gala Apples",
    category: "The Fruit Store",
    subCategory: "Fresh Fruits",
    price: 139,
    originalPrice: 179,
    weight: "4 Pieces",
    description: "Crisp, sweet, and freshly imported Royal Gala apples",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop",
  },
  {
    _id: "fruit_2",
    name: "Pomegranate (Anar) Premium",
    category: "The Fruit Store",
    subCategory: "Fresh Fruits",
    price: 110,
    originalPrice: 140,
    weight: "2 Pieces",
    description: "Rich in antioxidants, ruby-red premium pomegranates",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop",
  },
  {
    _id: "fruit_3",
    name: "Imported Kiwi Green",
    category: "The Fruit Store",
    subCategory: "Exotic Fruits",
    price: 99,
    originalPrice: 120,
    weight: "3 Pieces",
    description: "Zesty, nutrient-dense green kiwis imported from Zespri",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1585059895524-72359e061381?w=500&auto=format&fit=crop",
  },
  {
    _id: "fruit_4",
    name: "Red Dragon Fruit",
    category: "The Fruit Store",
    subCategory: "Exotic Fruits",
    price: 79,
    originalPrice: 99,
    weight: "1 Piece",
    description: "Freshly sourced organic pink-flesh exotic dragon fruit",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop",
  },
  {
    _id: "fruit_5",
    name: "Fresh Mixed Cut Fruit Bowl",
    category: "The Fruit Store",
    subCategory: "Cut Fruits and Juices",
    price: 79,
    originalPrice: 99,
    weight: "250 g",
    description: "Cleanly cut papaya, apple, pineapple, and pomegranate seeds",
    stock: 30,
    eta: "26 MINS",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&auto=format&fit=crop",
  }
];

const GROCERY_PRODUCTS = [
  {
    _id: "grocery_atta_1",
    name: "Aashirvaad Chakki Khapli Atta, Ancient Wheat Flour",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Aashirvaad",
    price: 149,
    originalPrice: 240,
    weight: "1 kg",
    description: "Ancient grain flour for nutrition",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_atta_2",
    name: "Aashirvaad Select Sharbati Atta",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Aashirvaad",
    price: 344,
    originalPrice: 406,
    weight: "5 kg",
    description: "Premium atta from select Sharbati wheat",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    variants: [
      { weight: "5 kg", price: 344, originalPrice: 406 },
      { weight: "1 kg", price: 72, originalPrice: 84 }
    ]
  },
  {
    _id: "grocery_atta_3",
    name: "ITC Right Shift Multigrain+ Atta, 5Kg | 0% Maida| High Protein Flour | High Fibre Atta | Low GI Atta | 30% More Protein | Multi...",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "ITC",
    price: 277,
    originalPrice: 449,
    weight: "5 kg",
    description: "0% Maida | High Protein | High Fibre | Low GI",
    stock: 30,
    eta: "30 MINS",
    isUpgrade: true,
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_atta_4",
    name: "Aashirvaad Superior MP Atta, 100 % Whole Wheat Flour, 0% Maida",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Aashirvaad",
    price: 64,
    originalPrice: 74,
    weight: "1 kg",
    description: "100% whole wheat flour, no maida",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    variants: [
      { weight: "1 kg", price: 64, originalPrice: 74 },
      { weight: "2 kg", price: 125, originalPrice: 133 },
      { weight: "5 kg", price: 306, originalPrice: 358 },
      { weight: "10 kg", price: 535, originalPrice: 644 }
    ]
  },
  {
    _id: "grocery_atta_5",
    name: "Aashirvaad Atta High Protein",
    category: "Atta, Rice and Dal",
    subCategory: "High Protein Atta",
    brand: "Aashirvaad",
    price: 325,
    originalPrice: 420,
    weight: "5 kg",
    description: "High protein whole wheat flour for active lifestyle",
    stock: 30,
    eta: "30 MINS",
    isUpgrade: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    variants: [
      { weight: "5 kg", price: 325, originalPrice: 420 },
      { weight: "1 kg", price: 55, originalPrice: 86 }
    ]
  },
  {
    _id: "grocery_atta_6",
    name: "Pillsbury Chakki Fresh Atta",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Pillsbury",
    price: 250,
    originalPrice: 355,
    weight: "5 kg",
    description: "Traditional stone-ground wheat flour",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
    variants: [
      { weight: "5 kg", price: 250, originalPrice: 355 },
      { weight: "1 kg", price: 61, originalPrice: 73 }
    ]
  },
  {
    _id: "grocery_atta_7",
    name: "Fortune Chakki Fresh Atta",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Fortune",
    price: 51,
    originalPrice: 107,
    weight: "1 kg",
    description: "Classic chakki atta for soft and fluffy rotis",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
    variants: [
      { weight: "1 kg", price: 51, originalPrice: 107 }
    ]
  },
  {
    _id: "grocery_atta_8",
    name: "Aashirvaad Multigrains Atta",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "Aashirvaad",
    price: 73,
    originalPrice: 84,
    weight: "1 kg",
    description: "Multigrain flour for added nutrition and fiber",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_atta_9",
    name: "24 Mantra Wholewheat Atta",
    category: "Atta, Rice and Dal",
    subCategory: "Atta",
    brand: "24 Mantra",
    price: 61,
    originalPrice: 90,
    weight: "1 kg",
    description: "Organic and nutrient-rich wholewheat flour",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_rice_1",
    name: "India Gate Super Basmati Rice",
    category: "Atta, Rice and Dal",
    subCategory: "Basmati Rice",
    brand: "India Gate",
    price: 110,
    originalPrice: 140,
    weight: "1 kg",
    description: "Premium aged basmati rice with long grains and rich aroma",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_rice_2",
    name: "Daawat Rozana Super Basmati Rice",
    category: "Atta, Rice and Dal",
    subCategory: "Rice",
    brand: "Daawat",
    price: 85,
    originalPrice: 105,
    weight: "1 kg",
    description: "Daily basmati rice with great taste and standard aroma",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
  },
  {
    _id: "grocery_dal_1",
    name: "Tata Sampann Premium Toor Dal",
    category: "Atta, Rice and Dal",
    subCategory: "Toor, Moong and Urad",
    brand: "Tata Sampann",
    price: 165,
    originalPrice: 190,
    weight: "1 kg",
    description: "Unpolished premium toor dal, rich in protein and dietary fiber",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1596790011460-9d89e51d0342?w=500&auto=format&fit=crop",
  }
];

const MASALAS_PRODUCTS = [
  {
    _id: "masalas_1",
    name: "Alburyani Cardamom Rich & Aromatic( Elaichi)",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Alburyani",
    price: 149,
    weight: "20 g",
    description: "Cardamom Rich & Aromatic",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_2",
    name: "Lotus Spices Elaichi Green",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Lotus Spices",
    price: 74,
    originalPrice: 80,
    weight: "15 g",
    description: "Green Cardamom / Elaichi",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_3",
    name: "Safe Harvest Seedless Tamarind",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Safe Harvest",
    price: 164,
    originalPrice: 270,
    weight: "200 g x 2",
    description: "Pesticide-free tamarind with rich tangy flavor.",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
    variants: [
      { weight: "200 g x 2", price: 164, originalPrice: 270 },
      { weight: "200 g", price: 85, originalPrice: 135 }
    ]
  },
  {
    _id: "masalas_4",
    name: "Supreme Harvest Mustard Small Whole",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Supreme Harvest",
    price: 31,
    originalPrice: 46,
    weight: "100 g",
    description: "Small whole mustard seeds for seasoning",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    variants: [
      { weight: "100 g", price: 31, originalPrice: 46 },
      { weight: "200 g", price: 58, originalPrice: 85 }
    ]
  },
  {
    _id: "masalas_5",
    name: "Lotus Spices Lawang",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Lotus Spices",
    price: 37,
    originalPrice: 40,
    weight: "15 g",
    description: "Lotus Spices Lawang / Cloves",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_6",
    name: "Tata Sampann Kasuri Methi with Natural Oils",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Tata Sampann",
    price: 31,
    originalPrice: 32,
    weight: "25 g",
    description: "Sun-dried fenugreek with natural oils",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_7",
    name: "Tata Sampann Whole Spices Coriander Seed",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Tata Sampann",
    price: 35,
    originalPrice: 45,
    weight: "100 g",
    description: "Fresh coriander for rich flavor",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_8",
    name: "Supreme Harvest Black Pepper Whole Spice",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Supreme Harvest",
    price: 78,
    originalPrice: 138,
    weight: "25 g x 2",
    description: "Premium whole black pepper seeds",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_9",
    name: "Lotus Spices Black Pepper Whole",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Lotus Spices",
    price: 37,
    originalPrice: 40,
    weight: "25 g",
    description: "Whole Black Pepper / Kali Mirch",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_10",
    name: "Popular Essentials Tamarind",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Popular Essentials",
    price: 90,
    originalPrice: 180,
    weight: "500 g",
    description: "Tangy & Sweet, Culinary Staple.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_11",
    name: "Catch Jeera Whole",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Catch",
    price: 86,
    originalPrice: 140,
    weight: "100 g x 2",
    description: "Jeera Whole / Cumin Seeds",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_12",
    name: "Organeekz Organic Saunf /Fennel",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Organeekz",
    price: 120,
    weight: "100 g x 2",
    description: "Organic Fennel Seeds / Saunf",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_13",
    name: "Popular Essentials Poppy Seeds (Khus Khus)",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Popular Essentials",
    price: 160,
    originalPrice: 180,
    weight: "50 g",
    description: "Aromatic Seeds, Culinary Uses.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_14",
    name: "Popular Essentials Black Pepper",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Popular Essentials",
    price: 130,
    originalPrice: 180,
    weight: "100 g",
    description: "Bold & Aromatic, Culinary Essential.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_15",
    name: "Supreme Harvest White Sesame Seeds",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Supreme Harvest",
    price: 62,
    originalPrice: 130,
    weight: "100 g x 2",
    description: "Nutrient-rich whole white sesame seeds.",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_16",
    name: "Supreme Harvest Green Cardamom Whole (Elaichi Green)",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Supreme Harvest",
    price: 113,
    originalPrice: 163,
    weight: "25 g",
    description: "Aromatic Sweet Spice Pods",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_17",
    name: "Popular Essentials Byadagi Chilli Stemless",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Popular Essentials",
    price: 175,
    originalPrice: 195,
    weight: "200 g",
    description: "Intense Flavor, Authentic Byadagi Chilli.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop",
  },
  {
    _id: "masalas_18",
    name: "Supreme Harvest Fenugreek Seeds (Methi)",
    category: "Masalas",
    subCategory: "Whole Spices",
    brand: "Supreme Harvest",
    price: 42,
    originalPrice: 57,
    weight: "200 g",
    description: "Whole methi seeds used in cooking and pickles",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop",
    variants: [
      { weight: "200 g", price: 42, originalPrice: 57 },
      { weight: "100 g", price: 23, originalPrice: 32 }
    ]
  }
];

const MEAT_PRODUCTS = [
  {
    _id: "meat_1",
    name: "Nandus Chicken Curry Cut - Skinless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 164,
    originalPrice: 175,
    weight: "500 g",
    description: "No Antibiotics",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_2",
    name: "Nandus Chicken Breast Boneless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 249,
    originalPrice: 259,
    weight: "450 g",
    description: "Clean, lean and boneless chicken breast pieces",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_3",
    name: "Nandus Chicken Curry Cut - with Skin",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 155,
    originalPrice: 165,
    weight: "500 g",
    description: "Fresh chicken curry cuts with skin-on",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_4",
    name: "Nandus Chicken Drumstick",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 229,
    weight: "450 g",
    description: "Fresh chicken drumsticks",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_5",
    name: "FreshtoHome Premium Chicken Boneless Breast Fillet",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "FreshtoHome",
    price: 255,
    originalPrice: 263,
    weight: "400 g",
    description: "Premium skinless, boneless chicken breast",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_6",
    name: "Nandus Chicken Leg Boneless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 239,
    weight: "450 g",
    description: "Tender boneless chicken legs",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1606728035253-49e196721186?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_7",
    name: "Nandus Chicken Mince/Keema",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 249,
    weight: "500 g",
    description: "Lean chicken mince from Nandus, freshly packed",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1588168333986-50786401586a?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_8",
    name: "Licious Chicken Curry Cut (Small Pieces) - Skinless 450g and Classic Eggs 6 Pieces",
    category: "Meat and Seafood",
    subCategory: "Meat Combos",
    brand: "Licious",
    price: 236,
    originalPrice: 254,
    weight: "1 Combo",
    description: "Fresh combo of small skinless curry cuts and classic white eggs.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_9",
    name: "TenderCuts Chicken Curry cut Skinless 450g + Fresh Eggs White eggs 6 Pieces",
    category: "Meat and Seafood",
    subCategory: "Meat Combos",
    brand: "TenderCuts",
    price: 192,
    originalPrice: 254,
    weight: "1 Combo",
    description: "Value chicken curry cut combo paired with 6 farm fresh white eggs.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_10",
    name: "TenderCuts Chicken Curry cut with Skin",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "TenderCuts",
    price: 129,
    originalPrice: 169,
    weight: "450 g",
    description: "Fresh curry cut chicken pieces with skin.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_11",
    name: "Licious Chicken Curry Cut (Large Pieces) - Skinless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Licious",
    price: 161,
    originalPrice: 179,
    weight: "450 g",
    description: "Fresh, skinless chicken pieces for curries.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_12",
    name: "TenderCuts Chicken Drumsticks",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "TenderCuts",
    price: 99,
    originalPrice: 139,
    weight: "2 Pieces",
    description: "Juicy TenderCuts drumsticks perfect for grilling or curries.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_13",
    name: "Nandus Chicken Liver 500g",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Nandus",
    price: 218,
    weight: "500 g x 2",
    description: "Fresh chicken liver packed securely.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_14",
    name: "TenderCuts Chicken Drumsticks 2 Pieces + Fresh Eggs White eggs 6 Pieces",
    category: "Meat and Seafood",
    subCategory: "Meat Combos",
    brand: "TenderCuts",
    price: 152,
    originalPrice: 214,
    weight: "1 Combo",
    description: "Tender chicken drumsticks (2pcs) combo with 6 fresh farm-grade white eggs.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_15",
    name: "TenderCuts Chicken Breast Boneless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "TenderCuts",
    price: 209,
    originalPrice: 259,
    weight: "400 g",
    description: "Lean and boneless chicken breast pieces from TenderCuts.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_16",
    name: "Licious Chicken Breast Boneless",
    category: "Meat and Seafood",
    subCategory: "Fresh Chicken",
    brand: "Licious",
    price: 265,
    originalPrice: 295,
    weight: "400 g",
    description: "Fresh boneless chicken breasts from Licious.",
    stock: 0,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&auto=format&fit=crop",
  },
  // Fallbacks for other sidebar tabs
  {
    _id: "meat_17",
    name: "Fresh Seer Fish Steaks (Surmai)",
    category: "Meat and Seafood",
    subCategory: "Fresh Seafood",
    brand: "Generic",
    price: 399,
    originalPrice: 450,
    weight: "500 g",
    description: "Freshly cut premium Seer Fish steaks perfect for pan frying.",
    stock: 20,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=500&auto=format&fit=crop",
  },
  {
    _id: "meat_18",
    name: "Premium Tender Mutton Curry Cut",
    category: "Meat and Seafood",
    subCategory: "Fresh Mutton",
    brand: "Generic",
    price: 449,
    originalPrice: 499,
    weight: "500 g",
    description: "Bone-in tender mutton curry cuts sourced from local farms.",
    stock: 15,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop",
  }
];

const DYNAMIC_CONFIG = {
  "oils-ghee": {
    title: "🧈 Oils and Ghee",
    defaultSidebar: "Mustard Oil",
    defaultQuickFilter: "Mustard Oil",
    sidebarItems: [
      { id: "Mustard Oil", name: "Mustard Oil", emoji: "🪔" },
      { id: "Refined Sunflower Oil", name: "Refined Sunflower", emoji: "🌻" },
      { id: "Cow Ghee", name: "Cow Ghee", emoji: "🧈" },
      { id: "Olive & Canola Oil", name: "Olive & Canola", emoji: "🫒" },
      { id: "Coconut Oil", name: "Coconut Oil", emoji: "🥥" },
      { id: "Other Oils", name: "Other Oils", emoji: "🏺" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Mustard Oil", name: "Mustard Oil" },
      { id: "Cow Ghee", name: "Cow Ghee" },
      { id: "Fortune", name: "Fortune" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "cereals-breakfast": {
    title: "🥣 Cereals & Breakfast",
    defaultSidebar: "Oats & Muesli",
    defaultQuickFilter: "Rolled Oats",
    sidebarItems: [
      { id: "Oats & Muesli", name: "Oats & Muesli", emoji: "🌾" },
      { id: "Flakes", name: "Flakes", emoji: "🥣" },
      { id: "Granola", name: "Granola", emoji: "🍯" },
      { id: "Kids Cereals", name: "Kids Cereals", emoji: "🥣" },
      { id: "Breakfast Mixes", name: "Breakfast Mixes", emoji: "🥞" },
      { id: "Poha & Vermicelli", name: "Poha & Vermicelli", emoji: "🌾" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Rolled Oats", name: "Rolled Oats" },
      { id: "Corn Flakes", name: "Corn Flakes" },
      { id: "Kellogg's", name: "Kellogg's" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "cold-drinks": {
    title: "🥤 Cold Drinks and Juices",
    defaultSidebar: "Soft Drinks",
    defaultQuickFilter: "Coca-Cola",
    sidebarItems: [
      { id: "Soft Drinks", name: "Soft Drinks", emoji: "🥤" },
      { id: "Fruit Juices", name: "Fruit Juices", emoji: "🧃" },
      { id: "Energy Drinks", name: "Energy Drinks", emoji: "⚡" },
      { id: "Coconut Water", name: "Coconut Water", emoji: "🥥" },
      { id: "Soda & Mixers", name: "Soda & Mixers", emoji: "🥂" },
      { id: "Ice Tea", name: "Ice Tea", emoji: "🍋" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Coca-Cola", name: "Coca-Cola" },
      { id: "Sprite", name: "Sprite" },
      { id: "Real Fruit Juice", name: "Real Fruit Juice" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "ice-cream": {
    title: "🍦 Ice Creams & Desserts",
    defaultSidebar: "Tubs",
    defaultQuickFilter: "Vanilla",
    sidebarItems: [
      { id: "Tubs", name: "Tubs", emoji: "🍧" },
      { id: "Cones & Cups", name: "Cones & Cups", emoji: "🍦" },
      { id: "Kulfi", name: "Kulfi", emoji: "🧁" },
      { id: "Gourmet Desserts", name: "Gourmet Desserts", emoji: "🍰" },
      { id: "Ice Cream Cakes", name: "Ice Cream Cakes", emoji: "🎂" },
      { id: "Waffles", name: "Waffles", emoji: "🧇" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Vanilla", name: "Vanilla" },
      { id: "Chocolate", name: "Chocolate" },
      { id: "Amul", name: "Amul" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "chips-namkeens": {
    title: "🍟 Chips and Namkeens",
    defaultSidebar: "Potato Chips",
    defaultQuickFilter: "Lay's",
    sidebarItems: [
      { id: "Potato Chips", name: "Potato Chips", emoji: "🥔" },
      { id: "Namkeen & Bhujia", name: "Namkeen & Bhujia", emoji: "🥜" },
      { id: "Nachos & Tortilla", name: "Nachos & Tortilla", emoji: "📐" },
      { id: "Puffs & Popcorn", name: "Puffs & Popcorn", emoji: "🍿" },
      { id: "Healthy Snacks", name: "Healthy Snacks", emoji: "🍪" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Lay's", name: "Lay's" },
      { id: "Haldiram's", name: "Haldiram's" },
      { id: "Kurkure", name: "Kurkure" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "chocolates": {
    title: "🍫 Chocolates",
    defaultSidebar: "Milk Chocolates",
    defaultQuickFilter: "Cadbury",
    sidebarItems: [
      { id: "Milk Chocolates", name: "Milk Chocolates", emoji: "🍫" },
      { id: "Dark Chocolates", name: "Dark Chocolates", emoji: "📦" },
      { id: "Gift Packs", name: "Gift Packs", emoji: "🎁" },
      { id: "Bars & Bites", name: "Bars & Bites", emoji: "🍬" },
      { id: "Wafer Chocolates", name: "Wafer Chocolates", emoji: "🧇" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Cadbury", name: "Cadbury" },
      { id: "Amul Dark", name: "Amul Dark" },
      { id: "KitKat", name: "KitKat" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "biscuits-cakes": {
    title: "🍪 Biscuits and Cakes",
    defaultSidebar: "Cookies",
    defaultQuickFilter: "Good Day",
    sidebarItems: [
      { id: "Cookies", name: "Cookies", emoji: "🍪" },
      { id: "Cream Biscuits", name: "Cream Biscuits", emoji: "🧁" },
      { id: "Digestive Biscuits", name: "Digestive Biscuits", emoji: "🌾" },
      { id: "Tea-time Biscuits", name: "Tea-time Biscuits", emoji: "☕" },
      { id: "Cakes & Muffins", name: "Cakes & Muffins", emoji: "🍰" },
      { id: "Rusk & Khari", name: "Rusk & Khari", emoji: "🍞" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Good Day", name: "Good Day" },
      { id: "Oreo", name: "Oreo" },
      { id: "Britannia", name: "Britannia" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "tea-coffee": {
    title: "☕ Tea, Coffee & Drinks",
    defaultSidebar: "Tea Leaves",
    defaultQuickFilter: "Red Label",
    sidebarItems: [
      { id: "Tea Leaves", name: "Tea Leaves", emoji: "🍂" },
      { id: "Green Tea", name: "Green Tea", emoji: "🍵" },
      { id: "Instant Coffee", name: "Instant Coffee", emoji: "☕" },
      { id: "Filter Coffee", name: "Filter Coffee", emoji: "🏺" },
      { id: "Health Drinks", name: "Health Drinks", emoji: "🥛" },
      { id: "Milk Additives", name: "Milk Additives", emoji: "🍼" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Red Label", name: "Red Label" },
      { id: "Taj Mahal", name: "Taj Mahal" },
      { id: "Nescafé", name: "Nescafé" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "sauces-spreads": {
    title: "🥫 Sauces and Spreads",
    defaultSidebar: "Ketchup & Tomato Sauce",
    defaultQuickFilter: "Kissan",
    sidebarItems: [
      { id: "Ketchup & Tomato Sauce", name: "Ketchup & Sauce", emoji: "🥫" },
      { id: "Mayonnaise & Dips", name: "Mayonnaise & Dips", emoji: "🥛" },
      { id: "Jams & Honey", name: "Jams & Honey", emoji: "🍯" },
      { id: "Chocolate Spreads", name: "Chocolate Spreads", emoji: "🍫" },
      { id: "Salad Dressings", name: "Salad Dressings", emoji: "🥗" },
      { id: "Chinese Sauces", name: "Chinese Sauces", emoji: "🏺" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Kissan", name: "Kissan" },
      { id: "FunFoods", name: "FunFoods" },
      { id: "Dabur Honey", name: "Dabur Honey" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "sweet-corner": {
    title: "🍬 Sweet Corner",
    defaultSidebar: "Traditional Sweets",
    defaultQuickFilter: "Haldiram's",
    sidebarItems: [
      { id: "Traditional Sweets", name: "Traditional Sweets", emoji: "🍡" },
      { id: "Gulab Jamun & Rasgulla", name: "Gulab Jamun & Rasgulla", emoji: "🫙" },
      { id: "Soan Papdi", name: "Soan Papdi", emoji: "🥮" },
      { id: "Halwa & Kheer", name: "Halwa & Kheer", emoji: "🍲" },
      { id: "Sugar-Free Sweets", name: "Sugar-Free Sweets", emoji: "🍬" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Haldiram's", name: "Haldiram's" },
      { id: "Bikanervala", name: "Bikanervala" },
      { id: "Kaju Katli", name: "Kaju Katli" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "bath-body": {
    title: "🧼 Bath and Body",
    defaultSidebar: "Soaps",
    defaultQuickFilter: "Dettol",
    sidebarItems: [
      { id: "Soaps", name: "Soaps", emoji: "🧼" },
      { id: "Body Wash", name: "Body Wash", emoji: "🚿" },
      { id: "Hand Wash", name: "Hand Wash", emoji: "🧼" },
      { id: "Body Lotion", name: "Body Lotion", emoji: "🧴" },
      { id: "Deodorants", name: "Deodorants", emoji: "🌬️" },
      { id: "Talcom Powder", name: "Talcom Powder", emoji: "❄️" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Dettol", name: "Dettol" },
      { id: "Dove", name: "Dove" },
      { id: "Nivea", name: "Nivea" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "hair-care": {
    title: "🧴 Hair Care",
    defaultSidebar: "Shampoo",
    defaultQuickFilter: "L'Oréal",
    sidebarItems: [
      { id: "Shampoo", name: "Shampoo", emoji: "🧴" },
      { id: "Conditioner", name: "Conditioner", emoji: "💆" },
      { id: "Hair Oil", name: "Hair Oil", emoji: "🌿" },
      { id: "Hair Serum", name: "Hair Serum", emoji: "✨" },
      { id: "Hair Color", name: "Hair Color", emoji: "🎨" },
      { id: "Styling Gel", name: "Styling Gel", emoji: "💈" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "L'Oréal", name: "L'Oréal" },
      { id: "Clinic Plus", name: "Clinic Plus" },
      { id: "Parachute", name: "Parachute" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "skincare": {
    title: "💄 Skincare",
    defaultSidebar: "Face Wash",
    defaultQuickFilter: "Himalaya",
    sidebarItems: [
      { id: "Face Wash", name: "Face Wash", emoji: "🧴" },
      { id: "Moisturizers", name: "Moisturizers", emoji: "🧼" },
      { id: "Sunscreen", name: "Sunscreen", emoji: "☀️" },
      { id: "Face Scrubs & Masks", name: "Face Scrubs & Masks", emoji: "💆" },
      { id: "Lip Care", name: "Lip Care", emoji: "💄" },
      { id: "Serums", name: "Serums", emoji: "✨" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Himalaya", name: "Himalaya" },
      { id: "Nivea Face", name: "Nivea Face" },
      { id: "Neutrogena", name: "Neutrogena" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "health-pharma": {
    title: "💊 Health and Pharma",
    defaultSidebar: "Pain Relief",
    defaultQuickFilter: "ENO",
    sidebarItems: [
      { id: "Pain Relief", name: "Pain Relief", emoji: "🩹" },
      { id: "Digestive Care", name: "Digestive Care", emoji: "🫃" },
      { id: "Bandages & Antiseptics", name: "Bandages & Antiseptics", emoji: "🩹" },
      { id: "Sexual Wellness", name: "Sexual Wellness", emoji: "💝" },
      { id: "Multivitamins", name: "Multivitamins", emoji: "💊" },
      { id: "Daily Wellness", name: "Daily Wellness", emoji: "☀️" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Dolo", name: "Dolo" },
      { id: "Vicks", name: "Vicks" },
      { id: "ENO", name: "ENO" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "home-kitchen": {
    title: "🍳 Home and Kitchen",
    defaultSidebar: "Kitchenware",
    defaultQuickFilter: "Milton",
    sidebarItems: [
      { id: "Kitchenware", name: "Kitchenware", emoji: "🍽️" },
      { id: "Containers & Bottles", name: "Containers & Bottles", emoji: "🏺" },
      { id: "Cleaning Tools", name: "Cleaning Tools", emoji: "🧹" },
      { id: "Garbage Bags", name: "Garbage Bags", emoji: "🛍️" },
      { id: "Tissues & Napkins", name: "Tissues & Napkins", emoji: "🧻" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Milton", name: "Milton" },
      { id: "Cello", name: "Cello" },
      { id: "Scotch-Brite", name: "Scotch-Brite" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "puja-store": {
    title: "🕉️ Puja Store",
    defaultSidebar: "Agarbatti & Dhoop",
    defaultQuickFilter: "Cycle Agarbatti",
    sidebarItems: [
      { id: "Agarbatti & Dhoop", name: "Agarbatti & Dhoop", emoji: "🪔" },
      { id: "Puja Oil & Ghee", name: "Puja Oil & Ghee", emoji: "🧈" },
      { id: "Camphor (Kapoor)", name: "Camphor (Kapoor)", emoji: "🪵" },
      { id: "Puja Utensils", name: "Puja Utensils", emoji: "🔔" },
      { id: "Matchboxes", name: "Matchboxes", emoji: "📦" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Cycle Agarbatti", name: "Cycle Agarbatti" },
      { id: "Mangaldeep", name: "Mangaldeep" },
      { id: "Bhimseni Kapoor", name: "Bhimseni Kapoor" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "cleaners-repellents": {
    title: "🧹 Cleaners & Repellents",
    defaultSidebar: "Floor Cleaners",
    defaultQuickFilter: "Lizol",
    sidebarItems: [
      { id: "Floor Cleaners", name: "Floor Cleaners", emoji: "🧹" },
      { id: "Toilet Cleaners", name: "Toilet Cleaners", emoji: "🚽" },
      { id: "Dishwashers", name: "Dishwashers", emoji: "🧽" },
      { id: "Mosquito Repellents", name: "Mosquito Repellents", emoji: "🦟" },
      { id: "Air Freshners", name: "Air Freshners", emoji: "🌸" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "Lizol", name: "Lizol" },
      { id: "Harpic", name: "Harpic" },
      { id: "Vim", name: "Vim" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
  "electronics-appliances": {
    title: "🎧 Electronics & Appliances",
    defaultSidebar: "Earphones & Headphones",
    defaultQuickFilter: "boAt",
    sidebarItems: [
      { id: "Earphones & Headphones", name: "Earphones", emoji: "🎧" },
      { id: "Cables & Chargers", name: "Cables & Chargers", emoji: "🔌" },
      { id: "Power Banks", name: "Power Banks", emoji: "🔋" },
      { id: "Batteries", name: "Batteries", emoji: "🔋" },
      { id: "Kitchen Appliances", name: "Kitchen Appliances", emoji: "🍳" },
      { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
    ],
    quickFilters: [
      { id: "All", name: "🎛️ Filters" },
      { id: "boAt", name: "boAt" },
      { id: "Mi", name: "Mi" },
      { id: "Duracell", name: "Duracell" },
      { id: "Type", name: "Type ⊽" },
      { id: "Brand", name: "Brand ⊽" },
      { id: "Ratings", name: "Customer Ratings ⊽" },
      { id: "SortBy", name: "Sort By ⊽" },
    ],
  },
};

const DYNAMIC_PRODUCTS = [
  // Oils and Ghee
  {
    _id: "oil_ghee_1",
    section: "oils-ghee",
    name: "Fortune Premium Kachi Ghani Mustard Oil",
    category: "Oils and Ghee",
    subCategory: "Mustard Oil",
    brand: "Fortune",
    price: 165,
    originalPrice: 195,
    weight: "1 Ltr",
    description: "Pure and traditional cold-pressed mustard oil with a strong aroma.",
    stock: 50,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
    variants: [
      { weight: "1 Ltr", price: 165, originalPrice: 195 },
      { weight: "5 Ltr", price: 799, originalPrice: 950 }
    ]
  },
  {
    _id: "oil_ghee_2",
    section: "oils-ghee",
    name: "Fortune Soya Health Refined Oil",
    category: "Oils and Ghee",
    subCategory: "Refined Sunflower Oil",
    brand: "Fortune",
    price: 125,
    originalPrice: 140,
    weight: "1 Ltr",
    description: "Refined soyabean oil rich in Omega-3 and vitamins.",
    stock: 45,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
  },
  {
    _id: "oil_ghee_3",
    section: "oils-ghee",
    name: "Anveshan Wood Pressed Yellow Mustard Oil",
    category: "Oils and Ghee",
    subCategory: "Mustard Oil",
    brand: "Anveshan",
    price: 390,
    originalPrice: 420,
    weight: "1 Ltr",
    description: "Traditionally wood pressed (Kolhu) yellow mustard oil, 100% natural.",
    stock: 20,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
  },
  {
    _id: "oil_ghee_4",
    section: "oils-ghee",
    name: "Aashirvaad Svasti Pure Cow Ghee",
    category: "Oils and Ghee",
    subCategory: "Cow Ghee",
    brand: "Aashirvaad",
    price: 690,
    originalPrice: 750,
    weight: "1 Ltr",
    description: "Delectable aroma and rich granular texture made from pure cow milk.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1589733901241-5e534273f6b6?w=500&auto=format&fit=crop",
  },
  {
    _id: "oil_ghee_5",
    section: "oils-ghee",
    name: "Amul Pure Ghee",
    category: "Oils and Ghee",
    subCategory: "Cow Ghee",
    brand: "Amul",
    price: 650,
    originalPrice: 670,
    weight: "1 Ltr",
    description: "Pure milk fat ghee from the trusted house of Amul.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1589733901241-5e534273f6b6?w=500&auto=format&fit=crop",
  },
  {
    _id: "oil_ghee_6",
    section: "oils-ghee",
    name: "Borges Canola Oil",
    category: "Oils and Ghee",
    subCategory: "Olive & Canola Oil",
    brand: "Borges",
    price: 299,
    originalPrice: 350,
    weight: "1 Ltr",
    description: "Imported premium Canola oil, high in monounsaturated fats.",
    stock: 15,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
  },
  {
    _id: "oil_ghee_7",
    section: "oils-ghee",
    name: "Parachute Pure Coconut Oil",
    category: "Oils and Ghee",
    subCategory: "Coconut Oil",
    brand: "Parachute",
    price: 180,
    originalPrice: 200,
    weight: "500 ml",
    description: "100% pure edible coconut oil made from sun-dried copras.",
    stock: 60,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
  },

  // Cereals & Breakfast
  {
    _id: "cereal_1",
    section: "cereals-breakfast",
    name: "Kellogg's Rolled Oats",
    category: "Cereals & Breakfast",
    subCategory: "Oats & Muesli",
    brand: "Kellogg's",
    price: 149,
    originalPrice: 185,
    weight: "1 kg",
    description: "High in protein and fiber rolled oats perfect for a healthy breakfast.",
    stock: 35,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
  },
  {
    _id: "cereal_2",
    section: "cereals-breakfast",
    name: "Kellogg's Corn Flakes",
    category: "Cereals & Breakfast",
    subCategory: "Flakes",
    brand: "Kellogg's",
    price: 185,
    originalPrice: 210,
    weight: "500 g",
    description: "Original golden crispy corn flakes baked from real corn grains.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop",
  },
  {
    _id: "cereal_3",
    section: "cereals-breakfast",
    name: "Quaker Instant Oats",
    category: "Cereals & Breakfast",
    subCategory: "Oats & Muesli",
    brand: "Quaker",
    price: 99,
    originalPrice: 120,
    weight: "400 g",
    description: "Easy and instant cooking hot oatmeal grains.",
    stock: 50,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
  },
  {
    _id: "cereal_4",
    section: "cereals-breakfast",
    name: "Baggry's Premium Muesli Fruit & Nut",
    category: "Cereals & Breakfast",
    subCategory: "Oats & Muesli",
    brand: "Baggry's",
    price: 350,
    originalPrice: 420,
    weight: "750 g",
    description: "Multigrain muesli with 30% fruits, nuts, and berries.",
    stock: 20,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1521485950395-bcfb507d859e?w=500&auto=format&fit=crop",
  },
  {
    _id: "cereal_5",
    section: "cereals-breakfast",
    name: "MTR Rava Idli Mix",
    category: "Cereals & Breakfast",
    subCategory: "Breakfast Mixes",
    brand: "MTR",
    price: 80,
    originalPrice: 95,
    weight: "500 g",
    description: "Instant rava idli flour mix with cashews, curry leaves, and spices.",
    stock: 30,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop",
  },
  {
    _id: "cereal_6",
    section: "cereals-breakfast",
    name: "Bambino Roasted Vermicelli",
    category: "Cereals & Breakfast",
    subCategory: "Poha & Vermicelli",
    brand: "Bambino",
    price: 45,
    originalPrice: 50,
    weight: "450 g",
    description: "Roasted high-quality wheat semolina vermicelli perfect for sweet payasam or upma.",
    stock: 60,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
  },

  // Cold Drinks and Juices
  {
    _id: "cold_drink_1",
    section: "cold-drinks",
    name: "Coca-Cola Soft Drink",
    category: "Cold Drinks and Juices",
    subCategory: "Soft Drinks",
    brand: "Coca-Cola",
    price: 40,
    originalPrice: 45,
    weight: "750 ml",
    description: "Refreshingly carbonated classic sweet cola beverage.",
    stock: 100,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
    variants: [
      { weight: "750 ml", price: 40, originalPrice: 45 },
      { weight: "1.25 Ltr", price: 65, originalPrice: 75 },
      { weight: "2 Ltr", price: 95, originalPrice: 110 }
    ]
  },
  {
    _id: "cold_drink_2",
    section: "cold-drinks",
    name: "Sprite Lemon Lime Soda",
    category: "Cold Drinks and Juices",
    subCategory: "Soft Drinks",
    brand: "Sprite",
    price: 40,
    originalPrice: 45,
    weight: "750 ml",
    description: "Crisp and clear lemon-lime fizzy soft drink.",
    stock: 80,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1543257580-7269da773bf5?w=500&auto=format&fit=crop",
  },
  {
    _id: "cold_drink_3",
    section: "cold-drinks",
    name: "Real Fruit Power Mixed Fruit Juice",
    category: "Cold Drinks and Juices",
    subCategory: "Fruit Juices",
    brand: "Real",
    price: 110,
    originalPrice: 130,
    weight: "1 Ltr",
    description: "Delicious rich mixed fruit juice packed with natural dietary fiber and vitamin C.",
    stock: 50,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop",
  },
  {
    _id: "cold_drink_4",
    section: "cold-drinks",
    name: "Red Bull Energy Drink",
    category: "Cold Drinks and Juices",
    subCategory: "Energy Drinks",
    brand: "Red Bull",
    price: 125,
    originalPrice: 130,
    weight: "250 ml",
    description: "Vitalizes body and mind with premium taurine, caffeine, and vitamin B complex.",
    stock: 120,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
  },
  {
    _id: "cold_drink_5",
    section: "cold-drinks",
    name: "Paper Boat Pure Coconut Water",
    category: "Cold Drinks and Juices",
    subCategory: "Coconut Water",
    brand: "Paper Boat",
    price: 50,
    originalPrice: 60,
    weight: "200 ml",
    description: "Naturally sweet and highly hydrating fresh Himalayan coconut water.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop",
  },

  // Ice Creams & Desserts
  {
    _id: "ice_cream_1",
    section: "ice-cream",
    name: "Amul Vanilla Magic Tub",
    category: "Ice Creams & Desserts",
    subCategory: "Tubs",
    brand: "Amul",
    price: 150,
    originalPrice: 180,
    weight: "1 Ltr",
    description: "Smooth and creamy vanilla flavor ice cream made with real cow milk fat.",
    stock: 25,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
  },
  {
    _id: "ice_cream_2",
    section: "ice-cream",
    name: "Kwality Walls Double Chocolate Cone",
    category: "Ice Creams & Desserts",
    subCategory: "Cones & Cups",
    brand: "Kwality Walls",
    price: 45,
    originalPrice: 50,
    weight: "110 ml",
    description: "Rich dark chocolate ice cream loaded in a crispy waffle cone.",
    stock: 60,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop",
  },
  {
    _id: "ice_cream_3",
    section: "ice-cream",
    name: "Amul Kesar Pista Shrikhand",
    category: "Ice Creams & Desserts",
    subCategory: "Gourmet Desserts",
    brand: "Amul",
    price: 60,
    originalPrice: 70,
    weight: "500 g",
    description: "Traditional sweet strained yogurt dessert flavored with cardamom, saffron, and pistachios.",
    stock: 20,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
  },
  {
    _id: "ice_cream_4",
    section: "ice-cream",
    name: "Havmor Premium Rajbhog Ice Cream Tub",
    category: "Ice Creams & Desserts",
    subCategory: "Tubs",
    brand: "Havmor",
    price: 250,
    originalPrice: 300,
    weight: "1 Ltr",
    description: "Royal ice cream containing dry fruits, almonds, saffron, and honey syrup.",
    stock: 15,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop",
  },

  // Chips and Namkeens
  {
    _id: "chips_1",
    section: "chips-namkeens",
    name: "Lay's Classic Salted Potato Chips",
    category: "Chips and Namkeens",
    subCategory: "Potato Chips",
    brand: "Lay's",
    price: 20,
    originalPrice: 20,
    weight: "50 g",
    description: "Crispy thinly-sliced potato chips cooked in oil and salted to perfection.",
    stock: 120,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop",
    variants: [
      { weight: "50 g", price: 20 },
      { weight: "90 g", price: 38 },
      { weight: "150 g", price: 60 }
    ]
  },
  {
    _id: "chips_2",
    section: "chips-namkeens",
    name: "Haldiram's Premium Aloo Bhujia",
    category: "Chips and Namkeens",
    subCategory: "Namkeen & Bhujia",
    brand: "Haldiram's",
    price: 40,
    originalPrice: 50,
    weight: "150 g",
    description: "Spicy and tangy potato and gram flour chickpea noodles deep fried.",
    stock: 100,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
  },
  {
    _id: "chips_3",
    section: "chips-namkeens",
    name: "Kurkure Spicy Masala Munch",
    category: "Chips and Namkeens",
    subCategory: "Potato Chips",
    brand: "Kurkure",
    price: 20,
    originalPrice: 20,
    weight: "80 g",
    description: "Spicy and crunchy cornmeal puff twists seasoned with authentic spices.",
    stock: 150,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
  },
  {
    _id: "chips_4",
    section: "chips-namkeens",
    name: "Doritos Nacho Cheese Tortilla Chips",
    category: "Chips and Namkeens",
    subCategory: "Nachos & Tortilla",
    brand: "Doritos",
    price: 50,
    originalPrice: 60,
    weight: "100 g",
    description: "Tangy nacho cheese flavored crunchy corn tortilla triangular chips.",
    stock: 80,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=500&auto=format&fit=crop",
  },

  // Chocolates
  {
    _id: "chocolate_1",
    section: "chocolates",
    name: "Cadbury Dairy Milk Silk Chocolate Bar",
    category: "Chocolates",
    subCategory: "Milk Chocolates",
    brand: "Cadbury",
    price: 80,
    originalPrice: 90,
    weight: "60 g",
    description: "Smooth, velvety, and creamy milk chocolate bar that melts in your mouth.",
    stock: 150,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
    variants: [
      { weight: "60 g", price: 80, originalPrice: 90 },
      { weight: "150 g", price: 170, originalPrice: 190 }
    ]
  },
  {
    _id: "chocolate_2",
    section: "chocolates",
    name: "Amul Dark Chocolate 75% Cocoa",
    category: "Chocolates",
    subCategory: "Dark Chocolates",
    brand: "Amul",
    price: 110,
    originalPrice: 125,
    weight: "150 g",
    description: "Premium rich dark chocolate with high-quality 75% bitter-sweet cocoa.",
    stock: 70,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1548907040-4d42b5212c10?w=500&auto=format&fit=crop",
  },
  {
    _id: "chocolate_3",
    section: "chocolates",
    name: "Nestlé KitKat Share Finger Bag",
    category: "Chocolates",
    subCategory: "Wafer Chocolates",
    brand: "Nestlé",
    price: 60,
    originalPrice: 70,
    weight: "120 g",
    description: "Crisp baked wafer fingers covered in smooth milk chocolate coatings.",
    stock: 90,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
  },
  {
    _id: "chocolate_4",
    section: "chocolates",
    name: "Ferrero Rocher Premium Gift Pack",
    category: "Chocolates",
    subCategory: "Gift Packs",
    brand: "Ferrero Rocher",
    price: 350,
    originalPrice: 400,
    weight: "16 Pcs",
    description: "Premium whole roasted hazelnut filled wafers covered in milk chocolate glaze.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1549007994-cb92ca8a7a72?w=500&auto=format&fit=crop",
  },

  // Biscuits and Cakes
  {
    _id: "biscuit_1",
    section: "biscuits-cakes",
    name: "Britannia Good Day Cashew Cookies",
    category: "Biscuits and Cakes",
    subCategory: "Cookies",
    brand: "Britannia",
    price: 30,
    originalPrice: 40,
    weight: "150 g",
    description: "Crispy cookies loaded with high-quality crunchy cashew nut chips.",
    stock: 120,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
  },
  {
    _id: "biscuit_2",
    section: "biscuits-cakes",
    name: "Oreo Original Chocolate Sandwich Biscuits",
    category: "Biscuits and Cakes",
    subCategory: "Cream Biscuits",
    brand: "Oreo",
    price: 35,
    originalPrice: 40,
    weight: "120 g",
    description: "Classic black chocolate sandwich cookies loaded with sweet vanilla cream filling.",
    stock: 100,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
  },
  {
    _id: "biscuit_3",
    section: "biscuits-cakes",
    name: "Sunfeast Hide & Seek Chocolate Chip Cookies",
    category: "Biscuits and Cakes",
    subCategory: "Cookies",
    brand: "Sunfeast",
    price: 40,
    originalPrice: 45,
    weight: "120 g",
    description: "Premium chocolate chip cookies cooked with real dark cocoa butter grains.",
    stock: 80,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
  },
  {
    _id: "biscuit_4",
    section: "biscuits-cakes",
    name: "Britannia Premium Bake Rusk",
    category: "Biscuits and Cakes",
    subCategory: "Rusk & Khari",
    brand: "Britannia",
    price: 50,
    originalPrice: 60,
    weight: "300 g",
    description: "Twice baked crispy, sweet toast rusk infused with premium cardamom seeds.",
    stock: 70,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f14?w=500&auto=format&fit=crop",
  },

  // Tea, Coffee & Drinks
  {
    _id: "tea_coffee_1",
    section: "tea-coffee",
    name: "Brooke Bond Red Label Tea",
    category: "Tea, Coffee & Drinks",
    subCategory: "Tea Leaves",
    brand: "Brooke Bond",
    price: 180,
    originalPrice: 220,
    weight: "500 g",
    description: "High-quality selected Assam tea leaves creating rich taste and golden color.",
    stock: 50,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
    variants: [
      { weight: "500 g", price: 180, originalPrice: 220 },
      { weight: "1 kg", price: 345, originalPrice: 410 }
    ]
  },
  {
    _id: "tea_coffee_2",
    section: "tea-coffee",
    name: "Nescafé Classic Instant Coffee",
    category: "Tea, Coffee & Drinks",
    subCategory: "Instant Coffee",
    brand: "Nescafé",
    price: 165,
    originalPrice: 180,
    weight: "100 g",
    description: "100% pure instant coffee granules crafted from rich robusta & arabica coffee beans.",
    stock: 60,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
  },
  {
    _id: "tea_coffee_3",
    section: "tea-coffee",
    name: "Lipton Green Tea Lemon Bags",
    category: "Tea, Coffee & Drinks",
    subCategory: "Green Tea",
    brand: "Lipton",
    price: 220,
    originalPrice: 250,
    weight: "25 Pcs",
    description: "Pure green tea bags with zero calories, infused with refreshing lemon extract.",
    stock: 35,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
  },
  {
    _id: "tea_coffee_4",
    section: "tea-coffee",
    name: "Cadbury Bournvita Chocolate Health Drink",
    category: "Tea, Coffee & Drinks",
    subCategory: "Health Drinks",
    brand: "Bournvita",
    price: 240,
    originalPrice: 260,
    weight: "500 g",
    description: "Cereal-based chocolate malt food powder packed with immunity nutrients.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
  },

  // Sauces and Spreads
  {
    _id: "sauce_spread_1",
    section: "sauces-spreads",
    name: "Kissan Fresh Tomato Ketchup",
    category: "Sauces and Spreads",
    subCategory: "Ketchup & Tomato Sauce",
    brand: "Kissan",
    price: 120,
    originalPrice: 150,
    weight: "1 kg",
    description: "Sweet and tangy tomato ketchup made with 100% real juicy vine-ripened tomatoes.",
    stock: 60,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop",
  },
  {
    _id: "sauce_spread_2",
    section: "sauces-spreads",
    name: "Dr. Oetker FunFoods Veg Mayonnaise Original",
    category: "Sauces and Spreads",
    subCategory: "Mayonnaise & Dips",
    brand: "FunFoods",
    price: 99,
    originalPrice: 110,
    weight: "400 g",
    description: "100% vegetarian, smooth, neutral, creamy mayonnaise suited for sandwiches.",
    stock: 50,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop",
  },
  {
    _id: "sauce_spread_3",
    section: "sauces-spreads",
    name: "Nutella Hazelnut Spread with Cocoa",
    category: "Sauces and Spreads",
    subCategory: "Chocolate Spreads",
    brand: "Nutella",
    price: 350,
    originalPrice: 380,
    weight: "350 g",
    description: "Famous sweet chocolate hazelnut spread perfect for toast, waffles, or rotis.",
    stock: 25,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop",
  },
  {
    _id: "sauce_spread_4",
    section: "sauces-spreads",
    name: "Dabur 100% Pure Squeezy Honey",
    category: "Sauces and Spreads",
    subCategory: "Jams & Honey",
    brand: "Dabur",
    price: 165,
    originalPrice: 195,
    weight: "400 g",
    description: "100% pure filtered natural honey sourced from organic hives.",
    stock: 45,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop",
  },

  // Sweet Corner
  {
    _id: "sweet_1",
    section: "sweet-corner",
    name: "Haldiram's Premium Kaju Katli",
    category: "Sweet Corner",
    subCategory: "Traditional Sweets",
    brand: "Haldiram's",
    price: 350,
    originalPrice: 420,
    weight: "250 g",
    description: "Rich traditional Indian sweet made with cashew nut paste and silver leaf coverings.",
    stock: 30,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
    variants: [
      { weight: "250 g", price: 350, originalPrice: 420 },
      { weight: "500 g", price: 680, originalPrice: 800 }
    ]
  },
  {
    _id: "sweet_2",
    section: "sweet-corner",
    name: "Haldiram's Sweet Gulab Jamun Tin",
    category: "Sweet Corner",
    subCategory: "Gulab Jamun & Rasgulla",
    brand: "Haldiram's",
    price: 180,
    originalPrice: 220,
    weight: "1 kg",
    description: "Deep fried khoya dumplings soaked in warm sugary cardamom syrup.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
  },
  {
    _id: "sweet_3",
    section: "sweet-corner",
    name: "Bikano Premium Soan Papdi",
    category: "Sweet Corner",
    subCategory: "Soan Papdi",
    brand: "Bikano",
    price: 90,
    originalPrice: 110,
    weight: "250 g",
    description: "Flaky and sweet chickpea flour cubes flavored with almonds and pistachios.",
    stock: 50,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop",
  },

  // Bath and Body
  {
    _id: "bath_body_1",
    section: "bath-body",
    name: "Dettol Liquid Handwash Refill",
    category: "Bath and Body",
    subCategory: "Hand Wash",
    brand: "Dettol",
    price: 99,
    originalPrice: 120,
    weight: "750 ml",
    description: "Classic antibacterial germ protection liquid hand wash refill pack.",
    stock: 80,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
  },
  {
    _id: "bath_body_2",
    section: "bath-body",
    name: "Dove Cream Beauty Soap Bar",
    category: "Bath and Body",
    subCategory: "Soaps",
    brand: "Dove",
    price: 55,
    originalPrice: 65,
    weight: "100 g",
    description: "Moisturizing beauty soap containing 1/4th hydrating cream formulas.",
    stock: 120,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1607006342456-ba275cd34284?w=500&auto=format&fit=crop",
  },
  {
    _id: "bath_body_3",
    section: "bath-body",
    name: "Nivea Nourishing Body Milk Lotion",
    category: "Bath and Body",
    subCategory: "Body Lotion",
    brand: "Nivea",
    price: 299,
    originalPrice: 399,
    weight: "400 ml",
    description: "Deep moisture serum body milk lotion perfect for dry skin hydration.",
    stock: 45,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
  },

  // Hair Care
  {
    _id: "hair_care_1",
    section: "hair-care",
    name: "L'Oréal Paris Total Repair 5 Shampoo",
    category: "Hair Care",
    subCategory: "Shampoo",
    brand: "L'Oréal",
    price: 240,
    originalPrice: 299,
    weight: "340 ml",
    description: "Keratin-rich daily shampoo fighting the five signs of visible hair damage.",
    stock: 60,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
  },
  {
    _id: "hair_care_2",
    section: "hair-care",
    name: "Tresemmé Keratin Smooth Conditioner",
    category: "Hair Care",
    subCategory: "Conditioner",
    brand: "Tresemmé",
    price: 220,
    originalPrice: 260,
    weight: "190 ml",
    description: "Conditioner enriched with premium argan oil providing frizz control for up to 3 days.",
    stock: 40,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop",
  },
  {
    _id: "hair_care_3",
    section: "hair-care",
    name: "Parachute Advansed Jasmine Hair Oil",
    category: "Hair Care",
    subCategory: "Hair Oil",
    brand: "Parachute",
    price: 125,
    originalPrice: 150,
    weight: "300 ml",
    description: "Non-sticky fragrant coconut hair oil enriched with soothing jasmine extracts.",
    stock: 75,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
  },

  // Skincare
  {
    _id: "skincare_1",
    section: "skincare",
    name: "Himalaya Purifying Neem Face Wash",
    category: "Skincare",
    subCategory: "Face Wash",
    brand: "Himalaya",
    price: 140,
    originalPrice: 170,
    weight: "150 ml",
    description: "Herbal face wash enriched with neem and turmeric preventing acne breakouts.",
    stock: 90,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
  },
  {
    _id: "skincare_2",
    section: "skincare",
    name: "Mamaearth Ultra Light Sunscreen SPF 50",
    category: "Skincare",
    subCategory: "Sunscreen",
    brand: "Mamaearth",
    price: 299,
    originalPrice: 349,
    weight: "80 ml",
    description: "PA+++ certified ultra light daily sun protection gel, safe for all skin types.",
    stock: 50,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
  },
  {
    _id: "skincare_3",
    section: "skincare",
    name: "Nivea Soft Light Moisturiser Cream",
    category: "Skincare",
    subCategory: "Moisturizers",
    brand: "Nivea",
    price: 95,
    originalPrice: 120,
    weight: "100 ml",
    description: "Light and non-greasy moisturizing cream with vitamin E and jojoba oil extracts.",
    stock: 80,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
  },

  // Health and Pharma
  {
    _id: "health_pharma_1",
    section: "health-pharma",
    name: "ENO Lemon Instant Fruit Salt",
    category: "Health and Pharma",
    subCategory: "Digestive Care",
    brand: "ENO",
    price: 90,
    originalPrice: 100,
    weight: "6 Sachets",
    description: "Fast-acting effervescent fruit salt relieving acidity in under 6 seconds.",
    stock: 150,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
  },
  {
    _id: "health_pharma_2",
    section: "health-pharma",
    name: "Vicks Vaporub Cold Relief Balm",
    category: "Health and Pharma",
    subCategory: "Pain Relief",
    brand: "Vicks",
    price: 99,
    originalPrice: 110,
    weight: "50 g",
    description: "Ointment loaded with menthol, camphor, and eucalyptus relieving chest congestion.",
    stock: 100,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
  },
  {
    _id: "health_pharma_3",
    section: "health-pharma",
    name: "Dolo-650 Paracetamol Tablet Strip",
    category: "Health and Pharma",
    subCategory: "Pain Relief",
    brand: "Dolo",
    price: 30,
    originalPrice: 32,
    weight: "15 Tabs",
    description: "Trusted over-the-counter paracetamol strip relieving fever and mild body pains.",
    stock: 200,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
  },

  // Home and Kitchen
  {
    _id: "home_kitchen_1",
    section: "home-kitchen",
    name: "Milton Thermosteel Classic Flask Bottle",
    category: "Home and Kitchen",
    subCategory: "Containers & Bottles",
    brand: "Milton",
    price: 699,
    originalPrice: 799,
    weight: "1 Ltr",
    description: "Double-walled vacuum insulated hot and cold stainless steel thermal flask.",
    stock: 20,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop",
  },
  {
    _id: "home_kitchen_2",
    section: "home-kitchen",
    name: "Scotch-Brite Heavy Duty Sponge Scrub",
    category: "Home and Kitchen",
    subCategory: "Cleaning Tools",
    brand: "Scotch-Brite",
    price: 75,
    originalPrice: 90,
    weight: "3 Pack",
    description: "Durable abrasive sponge scrub perfect for tough dishwashing stains.",
    stock: 80,
    eta: "30 MINS",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
  },
  {
    _id: "home_kitchen_3",
    section: "home-kitchen",
    name: "Shalimar Premium Trash Garbage Bags",
    category: "Home and Kitchen",
    subCategory: "Garbage Bags",
    brand: "Shalimar",
    price: 90,
    originalPrice: 110,
    weight: "30 Bags",
    description: "Leak-proof biodegradable black medium size waste disposal bags.",
    stock: 100,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
  },

  // Puja Store
  {
    _id: "puja_store_1",
    section: "puja-store",
    name: "Cycle Pure Agarbatti Cycle 3-in-1",
    category: "Puja Store",
    subCategory: "Agarbatti & Dhoop",
    brand: "Cycle",
    price: 70,
    originalPrice: 85,
    weight: "100 Sticks",
    description: "Premium meditative floral agarbatti pack for prayer routines.",
    stock: 50,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=500&auto=format&fit=crop",
  },
  {
    _id: "puja_store_2",
    section: "puja-store",
    name: "Bhimseni Kapoor Pure Camphor Crystals",
    category: "Puja Store",
    subCategory: "Camphor (Kapoor)",
    brand: "Bhimseni",
    price: 120,
    originalPrice: 150,
    weight: "100 g",
    description: "100% natural camphor crystals with high smoke purification power.",
    stock: 65,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=500&auto=format&fit=crop",
  },

  // Cleaners & Repellents
  {
    _id: "cleaner_1",
    section: "cleaners-repellents",
    name: "Lizol Floor Cleaner Disinfectant Citrus",
    category: "Cleaners & Repellents",
    subCategory: "Floor Cleaners",
    brand: "Lizol",
    price: 120,
    originalPrice: 145,
    weight: "975 ml",
    description: "Kills 99.9% germs, leaving a fresh citrus fragrance behind.",
    stock: 80,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
  },
  {
    _id: "cleaner_2",
    section: "cleaners-repellents",
    name: "Vim Lemon Dishwash Liquid Gel",
    category: "Cleaners & Repellents",
    subCategory: "Dishwashers",
    brand: "Vim",
    price: 115,
    originalPrice: 135,
    weight: "750 ml",
    description: "Squeaky clean lemon gel removing heavy oil grease from metal plates.",
    stock: 90,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop",
  },

  // Electronics & Appliances
  {
    _id: "electronics_1",
    section: "electronics-appliances",
    name: "boAt Bassheads 100 Wired Earphones",
    category: "Electronics & Appliances",
    subCategory: "Earphones & Headphones",
    brand: "boAt",
    price: 399,
    originalPrice: 599,
    weight: "1 Pc",
    description: "Premium hawk-eye styled wired earphones with deep heavy bass.",
    stock: 45,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
  },
  {
    _id: "electronics_2",
    section: "electronics-appliances",
    name: "Duracell Ultra AA Alkaline Batteries",
    category: "Electronics & Appliances",
    subCategory: "Batteries",
    brand: "Duracell",
    price: 150,
    originalPrice: 180,
    weight: "4 Pack",
    description: "Leak-protected ultra high power AA batteries with 10 years storage guarantee.",
    stock: 120,
    eta: "30 MINS",
    isAd: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
  }
];

const normalizeCategoryName = (cat) => {
  if (!cat) return "";
  return cat.toLowerCase()
    .replace(/&/g, "and")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalize = (value) => normalizeCategoryName(value);

const getCategoryMatch = (productCategory, targetCategory) => {
  if (!productCategory || !targetCategory) return false;
  const normProd = normalizeCategoryName(productCategory);
  const normTarget = normalizeCategoryName(targetCategory);

  const stripS = (str) => str.endsWith("s") ? str.slice(0, -1) : str;
  const prodSingular = stripS(normProd);
  const targetSingular = stripS(normTarget);

  return normProd === normTarget ||
    prodSingular === targetSingular ||
    normProd.includes(targetSingular) ||
    normTarget.includes(prodSingular);
};

const matchCategoryOrSub = (product, target) => {
  if (!target) return false;
  return (
    getCategoryMatch(product.category, target) ||
    getCategoryMatch(product.subCategory, target) ||
    getCategoryMatch(product.subcategory, target) ||
    getCategoryMatch(product.section, target) ||
    (product.name && getCategoryMatch(product.name, target)) ||
    (Array.isArray(product.tags) && product.tags.some(t => getCategoryMatch(t, target)))
  );
};

const getCategorySlug = (cat) => {
  if (!cat) return "";
  return cat.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getTypeCategories = (type) => {
  switch (type) {
    case "fruits": return ["The Fruit Store"];
    case "veggies": return ["The Veggie Store"];
    case "dairy": return ["Dairy, Bread & Eggs", "Dairy, Bread and Eggs", "Dairy Bread & Eggs", "The Bread Store"];
    case "meat": return ["Meat and Seafood", "Meat & Seafood"];
    case "grocery": return ["Atta, Rice and Dal", "Atta, Rice & Dal"];
    case "masalas": return ["Masalas"];
    case "oils-ghee": return ["Oils and Ghee", "Oils & Ghee"];
    case "cereals-breakfast": return ["Cereals & Breakfast", "Cereals and Breakfast"];
    case "cold-drinks": return ["Cold Drinks and Juices", "Cold Drinks & Juices", "Beverages"];
    case "ice-cream": return ["Ice Creams & Desserts", "Ice Creams and Desserts"];
    case "chips-namkeens": return ["Chips and Namkeens", "Chips & Namkeens", "Snacks"];
    case "chocolates": return ["Chocolates", "Snacks"];
    case "biscuits-cakes": return ["Biscuits and Cakes", "Biscuits & Cakes", "Snacks"];
    case "tea-coffee": return ["Tea, Coffee & Drinks", "Tea, Coffee and Drinks", "Beverages"];
    case "sauces-spreads": return ["Sauces and Spreads", "Sauces & Spreads", "Premium Pickles"];
    case "sweet-corner": return ["Sweet Corner"];
    case "bath-body": return ["Bath and Body", "Bath & Body"];
    case "hair-care": return ["Hair Care"];
    case "skincare": return ["Skincare"];
    case "health-pharma": return ["Health and Pharma", "Health & Pharma", "Sexual Wellness"];
    case "home-kitchen": return ["Home and Kitchen", "Home & Kitchen"];
    case "puja-store": return ["Puja Store"];
    case "cleaners-repellents": return ["Cleaners & Repellents", "Cleaners and Repellents"];
    case "electronics-appliances": return ["Electronics & Appliances", "Electronics and Appliances"];
    case "electronics": return ["Electronics & Appliances", "Electronics and Appliances", "Electronics"];
    case "fashion": return ["Fashion"];
    case "hostel-essentials": return ["Hostel Essentials"];
    case "beauty-personal-care": return ["Beauty & Personal Care", "Beauty and Personal Care", "Beauty"];
    case "emergency-items": return ["Emergency Items"];
    case "daily-needs": return ["Daily Needs"];
    default: return [];
  }
};

const matchesType = (product, currentType) => {
  if (!product || !currentType) return false;

  const normType = normalizeCategoryName(currentType);

  // 1. If product has section attribute, check it first
  if (product.section) {
    if (normalizeCategoryName(product.section) === normType) {
      return true;
    }
  }

  // 2. Map type to standard categories
  const targetCategories = getTypeCategories(currentType);

  // 3. Check if product category matches any of the mapped target categories
  if (product.category && targetCategories.some(tc => getCategoryMatch(product.category, tc))) {
    return true;
  }

  // 4. Check if product subCategory matches any of the mapped target categories
  if (product.subCategory && targetCategories.some(tc => getCategoryMatch(product.subCategory, tc))) {
    return true;
  }

  // 5. Check if product subcategory matches any of the mapped target categories
  if (product.subcategory && targetCategories.some(tc => getCategoryMatch(product.subcategory, tc))) {
    return true;
  }

  // 6. Check custom category slug match
  if (product.category && getCategorySlug(product.category) === currentType) {
    return true;
  }

  return false;
};

const fruitsSidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Mango", name: "Mango", emoji: "🥭" },
  { id: "Fresh Fruits", name: "Fresh Fruits", emoji: "🍎" },
  { id: "Exotic Fruits", name: "Exotic Fruits", emoji: "🥝" },
  { id: "Seasonal Fruits", name: "Seasonal Fruits", emoji: "🍉" },
  { id: "Cut Fruits and Juices", name: "Cut Fruits & Juices", emoji: "🥤" },
  { id: "Pooja & Festive", name: "Pooja & Festive", emoji: "🪔" },
  { id: "Premium Produce", name: "Premium Produce", emoji: "🌟" },
  { id: "Certified Organics", name: "Certified Organics", emoji: "📦" },
  { id: "Fresh Vegetables", name: "Fresh Vegetables", emoji: "🥦" },
  { id: "Bouquet & Plants", name: "Bouquet & Plants", emoji: "💐" },
  { id: "Frozen Fruits", name: "Frozen Fruits", emoji: "❄️" },
];

const veggiesSidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Fresh Vegetables", name: "Fresh Vegetables", emoji: "🥦" },
  { id: "Leafy and Seasonings", name: "Leafy & Seasonings", emoji: "🥬" },
  { id: "Exotic Vegetables", name: "Exotic Vegetables", emoji: "🍆" },
  { id: "Certified Organics", name: "Certified Organics", emoji: "📦" },
  { id: "Pooja & Festive", name: "Pooja & Festive", emoji: "🪔" },
];

const dairySidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Milk", name: "Milk", emoji: "🥛" },
  { id: "Eggs", name: "Eggs", emoji: "🥚" },
  { id: "Curd and Yogurts", name: "Curd and Yogurts", emoji: "🥣" },
  { id: "Fresh Bakery", name: "Fresh Bakery", emoji: "🥐" },
  { id: "Butter", name: "Butter", emoji: "🧈" },
  { id: "Bread and Buns", name: "Bread and Buns", emoji: "🍞" },
  { id: "Cheese", name: "Cheese", emoji: "🧀" },
  { id: "Batters and Chutneys", name: "Batters & Chutneys", emoji: "🏺" },
  { id: "Lassi and Buttermilk", name: "Lassi & Buttermilk", emoji: "🥛" },
  { id: "Milkshakes and More", name: "Milkshakes & More", emoji: "🥤" },
  { id: "Indian Breads", name: "Indian Breads", emoji: "🫓" },
  { id: "Dairy Alternatives", name: "Dairy Alternatives", emoji: "🌱" },
  { id: "Paneer and Tofu", name: "Paneer and Tofu", emoji: "🍲" },
  { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
];

const masalasSidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Whole Spices", name: "Whole Spices", emoji: "🥣" },
  { id: "Sugar and Jaggery", name: "Sugar & Jaggery", emoji: "🪵" },
  { id: "Cold Grind", name: "Cold Grind", emoji: "🧂" },
  { id: "Powdered Spices", name: "Powdered Spices", emoji: "🥣" },
  { id: "Salt", name: "Salt", emoji: "🧂" },
  { id: "Ready Masala", name: "Ready Masala", emoji: "🥘" },
  { id: "Pickles & Chutney", name: "Pickles & Chutney", emoji: "🫙" },
  { id: "Herbs & Seasoning", name: "Herbs & Seasoning", emoji: "🌿" },
  { id: "Paste and Puree", name: "Paste & Puree", emoji: "🏺" },
  { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
];

const grocerySidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Atta", name: "Atta", emoji: "🌾" },
  { id: "Rice", name: "Rice", emoji: "🍚" },
  { id: "Toor, Moong and Urad", name: "Toor, Moong & Urad", emoji: "🍲" },
  { id: "High Protein Atta", name: "High Protein Atta", emoji: "🌾" },
  { id: "Basmati Rice", name: "Basmati Rice", emoji: "🍚" },
  { id: "Besan, Sooji and Maida", name: "Besan, Sooji & Maida", emoji: "🥣" },
  { id: "Rajma, Chola and Others", name: "Rajma, Chola & Others", emoji: "🍲" },
  { id: "Poha & Puffed Rice", name: "Poha & Puffed Rice", emoji: "🌾" },
  { id: "Premium Brands", name: "Premium Brands", emoji: "🌟" },
  { id: "Soya Chunk & Badi", name: "Soya Chunk & Badi", emoji: "🫘" },
  { id: "Other Flours", name: "Other Flours", emoji: "🥣" },
  { id: "Millets & Daliya", name: "Millets & Daliya", emoji: "🌾" },
  { id: "Ready to Cook Flour Mix", name: "Ready to Cook Flour Mix", emoji: "🫓" },
  { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
];

const meatSidebar = [
  { id: "All", name: "Show All", emoji: "🛍️" },
  { id: "Fresh Chicken", name: "Fresh Chicken", emoji: "🍗" },
  { id: "Fresh Seafood", name: "Fresh Seafood", emoji: "🍤" },
  { id: "Fresh Mutton", name: "Fresh Mutton", emoji: "🥩" },
  { id: "Ready to Cook", name: "Ready to Cook", emoji: "🍳" },
  { id: "Meat Combos", name: "Meat Combos", emoji: "🍱" },
  { id: "Frozen Food", name: "Frozen Food", emoji: "❄️" },
  { id: "Plant Based Meat", name: "Plant Based Meat", emoji: "🌱" },
  { id: "Eggs", name: "Eggs", emoji: "🥚" },
  { id: "Cold Cuts", name: "Cold Cuts", emoji: "🥓" },
];

const getSidebarItems = (type) => {
  if (DYNAMIC_CONFIG[type]) {
    return DYNAMIC_CONFIG[type].sidebarItems || [];
  }
  if (type === "fruits") return fruitsSidebar;
  if (type === "veggies") return veggiesSidebar;
  if (type === "dairy") return dairySidebar;
  if (type === "masalas") return masalasSidebar;
  if (type === "grocery") return grocerySidebar;
  if (type === "meat") return meatSidebar;

  if (type === "snacks") return [{ id: "All", name: "Show All", emoji: "🍿" }];
  if (type === "beverages") return [{ id: "All", name: "Show All", emoji: "🥤" }];
  if (type === "exclusive-deals") return [{ id: "All", name: "Show All", emoji: "🏷️" }];
  if (type === "mosquitoes") return [{ id: "All", name: "Show All", emoji: "🦟" }];
  if (type === "bread-store") return [{ id: "All", name: "Show All", emoji: "🍞" }];
  if (type === "pickles") return [{ id: "All", name: "Show All", emoji: "🥒" }];
  if (type === "sexual-wellness") return [{ id: "All", name: "Show All", emoji: "💝" }];

  return [];
};

export default function SectionProductsPage({
  cart: propsCart,
  setCart: propsSetCart,
  cartItems: propsCartItems,
  setCartItems: propsSetCartItems,
  addToCart: propsAddToCart,
  removeFromCart: propsRemoveFromCart,
}) {
  usePerfLogger("SectionProductsPage");
  const { type: paramType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const type = paramType || location.pathname.split("/section/")[1] || "";

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Read active cart items from localStorage/props to support cart operations
  const [localCart, setLocalCart] = useState({});
  const [localCartItems, setLocalCartItems] = useState([]);

  const cart = propsCart || localCart;
  const cartItems = propsCartItems || (Object.values(cart || {}).map(item => {
    if (!item.product) return null;
    const variant = item.product.variants?.find(v => v.weight === item.product.selectedWeight);
    const originalPrice = variant ? variant.originalPrice : (item.product.originalPrice || item.product.price);
    const productId = item.product._id || item.product.id;
    return {
      ...item.product,
      id: productId + (item.product.selectedWeight ? `_${item.product.selectedWeight}` : ""),
      _id: productId,
      name: item.product.name,
      weight: item.product.selectedWeight || item.product.weight,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      originalPrice: originalPrice,
    };
  }).filter(Boolean));

  const setCartItems = propsSetCartItems || setLocalCartItems;

  const setCart = (valOrFn) => {
    let updated;
    if (typeof valOrFn === "function") {
      updated = valOrFn(cart);
    } else {
      updated = valOrFn;
    }
    if (propsSetCart) {
      propsSetCart(updated);
    } else {
      setLocalCart(updated);
    }
    localStorage.setItem("hostelgo_cart", JSON.stringify(updated));
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("local-cart-updated"));
  };

  const [activeSidebar, setActiveSidebar] = useState("All");
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterUnder30, setFilterUnder30] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [activeGourmet, setActiveGourmet] = useState(false);

  useEffect(() => {
    // Load local cart state on mount
    const savedCart = localStorage.getItem("hostelgo_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Cart parse failed", err);
      }
    }
  }, []);

  const saveCartToStorage = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("hostelgo_cart", JSON.stringify(updatedCart));
    // Trigger custom event to notify other components/navbar of cart updates
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    console.log("=== SECTION API FETCH INITIATED ===", window.API_BASE_URL + "/api/products");
    cachedFetch(window.API_BASE_URL + "/api/products")
      .then((data) => {
        console.log("=== SECTION API FETCH SUCCESS ===", data.length, "products loaded");
        setProducts(data);
        setApiError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("=== SECTION API FETCH FAILED ===", err);
        setApiError(`Failed to load products: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // Filter products by dynamic section type
  let sectionTitle = "";
  let filtered = [];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const productMatchesSearch = (product, query) => {
    if (!query) return true;
    const searchableValues = [
      product.name,
      product.category,
      product.subCategory,
      product.brand,
      product.weight,
      product.id,
      product._id,
      ...(product.tags || []),
      ...(product.variants || []).map((variant) => variant.weight),
    ];

    return searchableValues
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  };

  if (type === "trending") {
    sectionTitle = "⚡ Trending Near You";
    filtered = products.filter((p) => p.isTrending);
  } else if (type === "fruits") {
    sectionTitle = "🍎 Fresh Fruits";
    let baseFruits = products.filter(p => matchesType(p, "fruits"));

    // Apply Left Sidebar Category Filter
    if (activeSidebar === "Mango") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Mango"));
    } else if (activeSidebar === "Fresh Fruits") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Fresh Fruits") || matchCategoryOrSub(p, "Mango"));
    } else if (activeSidebar === "Exotic Fruits") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Exotic Fruits"));
    } else if (activeSidebar === "Seasonal Fruits") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Seasonal Fruits"));
    } else if (activeSidebar === "Cut Fruits and Juices") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Cut Fruits and Juices"));
    } else if (activeSidebar === "Frozen Fruits") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Frozen Fruits"));
    } else if (activeSidebar === "Premium Produce") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Premium Produce"));
    } else if (activeSidebar === "Certified Organics") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Certified Organics"));
    } else if (activeSidebar === "Fresh Vegetables") {
      baseFruits = products.filter(p => matchCategoryOrSub(p, "The Veggie Store"));
    } else if (activeSidebar === "Bouquet & Plants") {
      baseFruits = products.filter(p => matchCategoryOrSub(p, "Bouquet & Plants") || matchCategoryOrSub(p, "Flower Bouquet"));
    } else if (activeSidebar === "Pooja & Festive") {
      baseFruits = baseFruits.filter(p => matchCategoryOrSub(p, "Pooja & Festive"));
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Mango Kesar") {
      baseFruits = baseFruits.filter(p => p.name.includes("Kesar"));
    } else if (activeQuickFilter === "Mango Alphanso Ratnagiri") {
      baseFruits = baseFruits.filter(p => p.name.includes("Alphonso") || p.name.includes("Alphanso"));
    } else if (activeQuickFilter === "Mango Raspuri") {
      baseFruits = baseFruits.filter(p => p.name.includes("Raspuri"));
    }

    // Apply Gourmet filter
    if (activeGourmet) {
      baseFruits = baseFruits.filter(p => p.name.toLowerCase().includes("organic") || matchCategoryOrSub(p, "Premium Produce") || p.name.toLowerCase().includes("gourmet"));
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseFruits = baseFruits.filter(p => p.name.toLowerCase().includes("organic") || matchCategoryOrSub(p, "Certified Organics"));
    }
    if (filterUnder30) {
      baseFruits = baseFruits.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseFruits = baseFruits.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseFruits = baseFruits.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseFruits;
  } else if (type === "veggies") {
    sectionTitle = "🥦 Fresh Vegetables";
    let baseVeggies = products.filter(p => matchesType(p, "veggies"));

    // Apply Left Sidebar Category Filter
    if (normalizedSearchQuery) {
      baseVeggies = baseVeggies.filter((p) => productMatchesSearch(p, normalizedSearchQuery));
    } else if (activeSidebar === "Leafy and Seasonings") {
      baseVeggies = baseVeggies.filter(p => matchCategoryOrSub(p, "Leafy and Seasonings") || ["Spinach", "Coriander", "Mint", "Curry", "Fenugreek", "Onion", "Radish"].some(k => p.name.includes(k)));
    } else if (activeSidebar === "Exotic Vegetables") {
      baseVeggies = baseVeggies.filter(p => matchCategoryOrSub(p, "Exotic Vegetables") || ["Capsicum", "Cauliflower", "Ginger", "Garlic", "Brinjal", "Beans", "Gourd", "Kateri"].some(k => p.name.includes(k)));
    } else if (activeSidebar === "Certified Organics") {
      baseVeggies = baseVeggies.filter(p => matchCategoryOrSub(p, "Certified Organics") || p.name.toLowerCase().includes("organic") || p.name.toLowerCase().includes("fresh") || p.name.toLowerCase().includes("baby") || p.name.toLowerCase().includes("ooty"));
    } else if (activeSidebar === "Pooja & Festive") {
      baseVeggies = baseVeggies.filter(p => matchCategoryOrSub(p, "Pooja & Festive") || ["Coconut", "Mango", "Banana", "Lemon", "Garlic"].some(k => p.name.includes(k)));
    }

    // Apply Quick Filter Badges
    if (!normalizedSearchQuery && activeQuickFilter === "Leafy and Seasonings") {
      baseVeggies = baseVeggies.filter(p => ["Spinach", "Coriander", "Mint", "Curry", "Fenugreek", "Onion", "Radish"].some(k => p.name.includes(k)));
    } else if (!normalizedSearchQuery && activeQuickFilter === "Exotic Vegetables") {
      baseVeggies = baseVeggies.filter(p => ["Capsicum", "Cauliflower", "Ginger", "Garlic", "Brinjal", "Beans", "Gourd", "Kateri"].some(k => p.name.includes(k)));
    } else if (!normalizedSearchQuery && activeQuickFilter === "Ratings") {
      baseVeggies = baseVeggies.filter(p => p.isTrending || p.originalPrice > p.price);
    }

    // Apply Gourmet filter
    if (!normalizedSearchQuery && activeGourmet) {
      baseVeggies = baseVeggies.filter(p =>
        p.name.toLowerCase().includes("organic") ||
        p.name.toLowerCase().includes("exotic") ||
        p.name.toLowerCase().includes("baby") ||
        p.name.toLowerCase().includes("capsicum") ||
        p.name.toLowerCase().includes("cauliflower") ||
        p.name.toLowerCase().includes("gourd")
      );
    }

    // Apply Checkbox Filters
    if (!normalizedSearchQuery && filterOrganic) {
      baseVeggies = baseVeggies.filter(p => matchCategoryOrSub(p, "Certified Organics") || p.name.toLowerCase().includes("organic"));
    }
    if (!normalizedSearchQuery && filterUnder30) {
      baseVeggies = baseVeggies.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (!normalizedSearchQuery && filterInStock) {
      baseVeggies = baseVeggies.filter(p => p.stock > 0);
    }
    if (!normalizedSearchQuery && filterDiscount) {
      baseVeggies = baseVeggies.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseVeggies;
  } else if (type === "dairy") {
    sectionTitle = "🥛 Dairy, Bread & Eggs";
    let baseDairy = products.filter(p => matchesType(p, "dairy"));

    // Apply Left Sidebar Category Filter
    if (activeSidebar === "Milk") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Milk"));
    } else if (activeSidebar === "Eggs") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Eggs"));
    } else if (activeSidebar === "Curd and Yogurts") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Curd and Yogurts"));
    } else if (activeSidebar === "Fresh Bakery") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Fresh Bakery"));
    } else if (activeSidebar === "Butter") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Butter"));
    } else if (activeSidebar === "Bread and Buns") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Bread and Buns"));
    } else if (activeSidebar === "Cheese") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Cheese"));
    } else if (activeSidebar === "Batters and Chutneys") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Batters and Chutneys"));
    } else if (activeSidebar === "Lassi and Buttermilk") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Lassi and Buttermilk"));
    } else if (activeSidebar === "Milkshakes and More") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Milkshakes and More"));
    } else if (activeSidebar === "Indian Breads") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Indian Breads"));
    } else if (activeSidebar === "Dairy Alternatives") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Dairy Alternatives"));
    } else if (activeSidebar === "Paneer and Tofu") {
      baseDairy = baseDairy.filter(p => matchCategoryOrSub(p, "Paneer and Tofu"));
    } else if (activeSidebar === "Top Deals") {
      baseDairy = baseDairy.filter(p => p.isTrending || p.originalPrice > p.price);
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Amul") {
      baseDairy = baseDairy.filter(p => p.brand === "Amul");
    } else if (activeQuickFilter === "Nandini") {
      baseDairy = baseDairy.filter(p => p.brand === "Nandini");
    } else if (activeQuickFilter === "Heritage") {
      baseDairy = baseDairy.filter(p => p.brand === "Heritage");
    }

    // Apply Gourmet filter
    if (activeGourmet) {
      baseDairy = baseDairy.filter(p => p.name.toLowerCase().includes("organic") || p.brand === "Akshayakalpa" || p.name.toLowerCase().includes("gourmet"));
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseDairy = baseDairy.filter(p => p.name.toLowerCase().includes("organic") || p.brand === "Akshayakalpa");
    }
    if (filterUnder30) {
      baseDairy = baseDairy.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseDairy = baseDairy.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseDairy = baseDairy.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseDairy;
  } else if (type === "meat") {
    sectionTitle = "🥩 Meat and Seafood";
    let baseMeat = products.filter(p => matchesType(p, "meat"));

    // Apply Left Sidebar Category Filter
    if (activeSidebar === "Fresh Chicken") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Fresh Chicken"));
    } else if (activeSidebar === "Fresh Seafood") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Fresh Seafood"));
    } else if (activeSidebar === "Fresh Mutton") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Fresh Mutton"));
    } else if (activeSidebar === "Meat Combos") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Meat Combos"));
    } else if (activeSidebar === "Eggs") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Eggs") || p.name.toLowerCase().includes("eggs"));
    } else if (activeSidebar === "Ready to Cook") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Ready to Cook"));
    } else if (activeSidebar === "Frozen Food") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Frozen Food"));
    } else if (activeSidebar === "Plant Based Meat") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Plant Based Meat"));
    } else if (activeSidebar === "Cold Cuts") {
      baseMeat = baseMeat.filter(p => matchCategoryOrSub(p, "Cold Cuts"));
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Curry Cut") {
      baseMeat = baseMeat.filter(p => p.name.toLowerCase().includes("curry cut"));
    } else if (activeQuickFilter === "Boneless") {
      baseMeat = baseMeat.filter(p => p.name.toLowerCase().includes("boneless"));
    } else if (activeQuickFilter === "Drumstick") {
      baseMeat = baseMeat.filter(p => p.name.toLowerCase().includes("drumstick"));
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseMeat = baseMeat.filter(p => p.name.toLowerCase().includes("organic") || p.description.toLowerCase().includes("organic"));
    }
    if (filterUnder30) {
      baseMeat = baseMeat.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseMeat = baseMeat.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseMeat = baseMeat.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseMeat;
  } else if (type === "grocery") {
    sectionTitle = "🌾 Atta, Rice and Dal";
    let baseGrocery = products.filter(p => matchesType(p, "grocery"));

    // Apply Left Sidebar Category Filter
    if (activeSidebar && activeSidebar !== "All") {
      if (activeSidebar === "Atta") {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, "Atta"));
      } else if (activeSidebar === "High Protein Atta") {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, "High Protein Atta") || p.name.toLowerCase().includes("high protein"));
      } else if (activeSidebar === "Rice") {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, "Rice") || matchCategoryOrSub(p, "Basmati Rice"));
      } else if (activeSidebar === "Basmati Rice") {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, "Basmati Rice"));
      } else if (activeSidebar === "Toor, Moong and Urad") {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, "Toor, Moong and Urad"));
      } else if (activeSidebar === "Premium Brands") {
        baseGrocery = baseGrocery.filter(p => p.brand === "Aashirvaad" || p.brand === "Pillsbury" || p.brand === "Fortune");
      } else if (activeSidebar === "Millets & Daliya") {
        baseGrocery = baseGrocery.filter(p => p.name.toLowerCase().includes("millets") || p.name.toLowerCase().includes("multigrain") || p.name.toLowerCase().includes("multigrains"));
      } else {
        baseGrocery = baseGrocery.filter(p => matchCategoryOrSub(p, activeSidebar));
      }
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Wheat Atta") {
      baseGrocery = baseGrocery.filter(p => p.name.toLowerCase().includes("wheat") || p.name.toLowerCase().includes("chakki"));
    } else if (activeQuickFilter === "Multigrain Atta") {
      baseGrocery = baseGrocery.filter(p => p.name.toLowerCase().includes("multigrain") || p.name.toLowerCase().includes("multigrains"));
    } else if (activeQuickFilter === "Sharbati Atta") {
      baseGrocery = baseGrocery.filter(p => p.name.toLowerCase().includes("sharbati"));
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseGrocery = baseGrocery.filter(p => p.name.toLowerCase().includes("organic") || p.brand === "24 Mantra");
    }
    if (filterUnder30) {
      baseGrocery = baseGrocery.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseGrocery = baseGrocery.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseGrocery = baseGrocery.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseGrocery;
  } else if (type === "masalas") {
    sectionTitle = "🌶️ Masalas";
    let baseMasalas = products.filter(p => matchesType(p, "masalas"));

    // Apply Left Sidebar Category Filter
    if (activeSidebar && activeSidebar !== "All") {
      if (activeSidebar === "Whole Spices") {
        baseMasalas = baseMasalas.filter(p => matchCategoryOrSub(p, "Whole Spices"));
      } else {
        baseMasalas = baseMasalas.filter(p => matchCategoryOrSub(p, activeSidebar));
      }
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Red Chilli Whole") {
      baseMasalas = baseMasalas.filter(p => p.name.toLowerCase().includes("chilli") || p.name.toLowerCase().includes("chili"));
    } else if (activeQuickFilter === "Black Pepper") {
      baseMasalas = baseMasalas.filter(p => p.name.toLowerCase().includes("pepper") || p.name.toLowerCase().includes("kali mirch"));
    } else if (activeQuickFilter === "Mustard Seeds") {
      baseMasalas = baseMasalas.filter(p => p.name.toLowerCase().includes("mustard") || p.name.toLowerCase().includes("rai") || p.name.toLowerCase().includes("sarso"));
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseMasalas = baseMasalas.filter(p => p.name.toLowerCase().includes("organic") || p.brand === "Organeekz");
    }
    if (filterUnder30) {
      baseMasalas = baseMasalas.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseMasalas = baseMasalas.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseMasalas = baseMasalas.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseMasalas;
  } else if (DYNAMIC_CONFIG[type]) {
    sectionTitle = DYNAMIC_CONFIG[type].title;
    let baseDynamic = products.filter(p => matchesType(p, type));

    // Apply Left Sidebar Category Filter
    if (activeSidebar && activeSidebar !== "All") {
      if (activeSidebar === "Top Deals") {
        baseDynamic = baseDynamic.filter(p => p.originalPrice > p.price || (p.variants && p.variants[0]?.originalPrice > p.variants[0]?.price));
      } else {
        baseDynamic = baseDynamic.filter(p => matchCategoryOrSub(p, activeSidebar));
      }
    }

    // Apply Quick Filter Badges
    if (activeQuickFilter === "Mustard Oil" || activeQuickFilter === "Rolled Oats" || activeQuickFilter === "Corn Flakes" || activeQuickFilter === "Coca-Cola" || activeQuickFilter === "Sprite" || activeQuickFilter === "Vanilla" || activeQuickFilter === "Chocolate" || activeQuickFilter === "Real Fruit Juice" || activeQuickFilter === "Cow Ghee") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes(activeQuickFilter.toLowerCase()));
    } else if (activeQuickFilter === "Fortune") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Fortune");
    } else if (activeQuickFilter === "Kellogg's") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Kellogg's");
    } else if (activeQuickFilter === "Amul") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Amul");
    } else if (activeQuickFilter === "Lay's") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Lay's");
    } else if (activeQuickFilter === "Haldiram's") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Haldiram's");
    } else if (activeQuickFilter === "Kurkure") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Kurkure");
    } else if (activeQuickFilter === "Cadbury") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Cadbury");
    } else if (activeQuickFilter === "Amul Dark") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("dark"));
    } else if (activeQuickFilter === "KitKat") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Nestlé" || p.name.includes("KitKat"));
    } else if (activeQuickFilter === "Good Day") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Britannia" || p.name.includes("Good Day"));
    } else if (activeQuickFilter === "Oreo") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("oreo"));
    } else if (activeQuickFilter === "Britannia") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Britannia");
    } else if (activeQuickFilter === "Red Label") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Brooke Bond" || p.name.includes("Red Label"));
    } else if (activeQuickFilter === "Taj Mahal") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("taj mahal"));
    } else if (activeQuickFilter === "Nescafé") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Nescafé");
    } else if (activeQuickFilter === "Kissan") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Kissan");
    } else if (activeQuickFilter === "FunFoods") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Dr. Oetker" || p.brand === "FunFoods");
    } else if (activeQuickFilter === "Dabur Honey") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("honey"));
    } else if (activeQuickFilter === "Bikanervala") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Bikanervala");
    } else if (activeQuickFilter === "Kaju Katli") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("kaju"));
    } else if (activeQuickFilter === "Dettol") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Dettol");
    } else if (activeQuickFilter === "Dove") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Dove");
    } else if (activeQuickFilter === "Nivea") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Nivea");
    } else if (activeQuickFilter === "L'Oréal") {
      baseDynamic = baseDynamic.filter(p => p.brand.includes("L'Oréal") || p.brand.includes("Loreal"));
    } else if (activeQuickFilter === "Clinic Plus") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Clinic Plus");
    } else if (activeQuickFilter === "Parachute") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Parachute");
    } else if (activeQuickFilter === "Himalaya") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Himalaya");
    } else if (activeQuickFilter === "Nivea Face") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Nivea");
    } else if (activeQuickFilter === "Neutrogena") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Neutrogena");
    } else if (activeQuickFilter === "Dolo") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("dolo"));
    } else if (activeQuickFilter === "Vicks") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Vicks" || p.name.includes("Vicks"));
    } else if (activeQuickFilter === "ENO") {
      baseDynamic = baseDynamic.filter(p => p.brand === "ENO" || p.name.includes("ENO"));
    } else if (activeQuickFilter === "Milton") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Milton");
    } else if (activeQuickFilter === "Cello") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Cello");
    } else if (activeQuickFilter === "Scotch-Brite") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Scotch-Brite");
    } else if (activeQuickFilter === "Cycle Agarbatti") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Cycle");
    } else if (activeQuickFilter === "Mangaldeep") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Mangaldeep");
    } else if (activeQuickFilter === "Bhimseni Kapoor") {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("kapoor") || p.name.toLowerCase().includes("camphor"));
    } else if (activeQuickFilter === "Lizol") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Lizol");
    } else if (activeQuickFilter === "Harpic") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Harpic");
    } else if (activeQuickFilter === "Vim") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Vim");
    } else if (activeQuickFilter === "boAt") {
      baseDynamic = baseDynamic.filter(p => p.brand === "boAt");
    } else if (activeQuickFilter === "Mi") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Mi");
    } else if (activeQuickFilter === "Duracell") {
      baseDynamic = baseDynamic.filter(p => p.brand === "Duracell");
    }

    // Apply Checkbox Filters
    if (filterOrganic) {
      baseDynamic = baseDynamic.filter(p => p.name.toLowerCase().includes("organic") || p.brand === "Organeekz");
    }
    if (filterUnder30) {
      baseDynamic = baseDynamic.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        return price <= 30;
      });
    }
    if (filterInStock) {
      baseDynamic = baseDynamic.filter(p => p.stock > 0);
    }
    if (filterDiscount) {
      baseDynamic = baseDynamic.filter(p => {
        const price = p.price || (p.variants && p.variants[0]?.price) || 0;
        const originalPrice = p.originalPrice || (p.variants && p.variants[0]?.originalPrice) || price;
        const discount = originalPrice > price ? ((originalPrice - price) / originalPrice) * 100 : 0;
        return discount >= 20;
      });
    }

    filtered = baseDynamic;
  } else if (type === "snacks") {
    sectionTitle = "🍟 Snacks & Munchies";
    filtered = products.filter((p) => p.category === "Snacks");
  } else if (type === "beverages") {
    sectionTitle = "🥤 Cold Drinks & Beverages";
    filtered = products.filter((p) => p.category === "Beverages");
  } else if (type === "exclusive-deals") {
    sectionTitle = "🏷️ Exclusive Deals For You";
    filtered = products.filter((p) => p.category === "Exclusive Deals");
  } else if (type === "mosquitoes") {
    sectionTitle = "🦟 No more mosquitoes!";
    filtered = products.filter((p) => p.category === "Cleaners & Repellents");
  } else if (type === "bread-store") {
    sectionTitle = "🍞 The Bread Store";
    filtered = products.filter((p) => p.category === "The Bread Store");
  } else if (type === "pickles") {
    sectionTitle = "🥒 Premium Pickles";
    filtered = products.filter((p) => p.category === "Premium Pickles");
  } else if (type === "sexual-wellness") {
    sectionTitle = "💝 Sexual wellness";
    filtered = products.filter((p) => p.category === "Sexual Wellness");
  } else if (products.some((p) => p.category && getCategorySlug(p.category) === type)) {
    const matchedCategory = products.find((p) => p.category && getCategorySlug(p.category) === type).category;
    sectionTitle = matchedCategory;
    filtered = products.filter((p) => p.category === matchedCategory);
  } else {
    sectionTitle = "🔍 Product Catalog";
    filtered = products;
  }

  // Handle product sorting
  if (sortBy === "price-asc") {
    filtered.sort((a, b) => {
      const pA = a.price || (a.variants && a.variants[0]?.price) || 0;
      const pB = b.price || (b.variants && b.variants[0]?.price) || 0;
      return pA - pB;
    });
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => {
      const pA = a.price || (a.variants && a.variants[0]?.price) || 0;
      const pB = b.price || (b.variants && b.variants[0]?.price) || 0;
      return pB - pA;
    });
  } else if (sortBy === "discount") {
    filtered.sort((a, b) => {
      const getDisc = (x) => {
        const p = x.price || (x.variants && x.variants[0]?.price) || 1;
        const o = x.originalPrice || (x.variants && x.variants[0]?.originalPrice) || p;
        return ((o - p) / o) * 100;
      };
      return getDisc(b) - getDisc(a);
    });
  }

  const displayedProducts = filtered;

  const searchedProducts = displayedProducts.filter((product) => {
    const query = normalize(searchQuery);

    if (!query) return true;

    return (
      normalize(product.name)?.includes(query) ||
      normalize(product.subCategory)?.includes(query) ||
      normalize(product.weight)?.includes(query) ||
      product.tags?.some((tag) =>
        normalize(tag)?.includes(query)
      )
    );
  });

  useEffect(() => {
    if (!loading && products.length > 0) {
      console.log("=== PRODUCT FLOW METRICS ===");
      console.log("ALL PRODUCTS:", products.length);
      console.log(
        "DAIRY PRODUCTS:",
        products.filter(p => getCategoryMatch(p.category, "Dairy, Bread & Eggs")).length
      );
      console.log("ACTIVE TYPE:", activeQuickFilter);
      console.log("ACTIVE BRAND:", activeQuickFilter);
      console.log("ACTIVE SUBCATEGORY:", activeSidebar);
      console.log("FINAL:", searchedProducts.length);
      console.log(searchedProducts);
      console.log("=============================");
    }
  }, [products, type, activeSidebar, activeQuickFilter, displayedProducts, searchedProducts, loading]);

  const getProductId = (product) => {
    return String(product._id || product.id);
  };

  const addToCart = (product, variant = null) => {
    if (propsAddToCart) {
      const selectedWeight = variant ? variant.weight : (product.variants && product.variants[0] ? product.variants[0].weight : product.selectedWeight || product.weight);
      const selectedPrice = variant ? variant.price : (product.variants && product.variants[0] ? product.variants[0].price : product.price);
      propsAddToCart({ ...product, selectedWeight, price: selectedPrice });
      return;
    }

    const selectedWeight = variant ? variant.weight : (product.variants && product.variants[0] ? product.variants[0].weight : product.selectedWeight || product.weight);
    const selectedPrice = variant ? variant.price : (product.variants && product.variants[0] ? product.variants[0].price : product.price);
    const productToCart = { ...product, selectedWeight, price: selectedPrice };

    setCartItems((prevItems) => {
      const productId = getProductId(productToCart);

      const existingItem = prevItems.find(
        (item) => getProductId(item) === productId
      );

      if (existingItem) {
        return prevItems.map((item) =>
          getProductId(item) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prevItems,
        {
          ...productToCart,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (product, variant = null) => {
    if (propsRemoveFromCart) {
      const selectedWeight = variant ? variant.weight : (product.variants && product.variants[0] ? product.variants[0].weight : product.selectedWeight || product.weight);
      const selectedPrice = variant ? variant.price : (product.variants && product.variants[0] ? product.variants[0].price : product.price);
      propsRemoveFromCart({ ...product, selectedWeight, price: selectedPrice });
      return;
    }

    const selectedWeight = variant ? variant.weight : (product.variants && product.variants[0] ? product.variants[0].weight : product.selectedWeight || product.weight);
    const selectedPrice = variant ? variant.price : (product.variants && product.variants[0] ? product.variants[0].price : product.price);
    const productToCart = { ...product, selectedWeight, price: selectedPrice };

    setCartItems((prevItems) => {
      const productId = getProductId(productToCart);

      const existingItem = prevItems.find(
        (item) => getProductId(item) === productId
      );

      if (!existingItem) return prevItems;

      if (existingItem.quantity === 1) {
        return prevItems.filter(
          (item) => getProductId(item) !== productId
        );
      }

      return prevItems.map((item) =>
        getProductId(item) === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const renderMobileCategoryPage = () => {
    const sidebarItems = getSidebarItems(type);
    const cleanSectionTitle = sectionTitle.replace(/^[^\s]+\s+/, "");
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          paddingBottom: totalItems > 0 ? "148px" : "84px",
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .hide-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>

        {/* Sticky Mobile Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "white",
            borderBottom: "1px solid #e5e7eb",
            width: "100%",
          }}
        >
          {/* Top Title Bar with ← Back and Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px 16px 4px 16px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#6b7280",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                minHeight: "44px",
                width: "fit-content",
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#1f2937", margin: 0, paddingBottom: "4px" }}>
              {cleanSectionTitle}
            </h1>
          </div>

          {/* Sticky Search Bar */}
          <div style={{ padding: "0 16px 12px 16px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                placeholder={`Search in ${cleanSectionTitle}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  fontSize: "14px",
                  fontWeight: "600",
                  outline: "none",
                  height: "44px",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", left: "14px", color: "#9ca3af", fontSize: "16px" }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "16px",
                    cursor: "pointer",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Carousel/Chips */}
        {sidebarItems.length > 0 && (
          <div
            style={{
              display: "flex",
              overflowX: "scroll",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
              gap: "8px",
              padding: "12px 16px",
              background: "white",
              borderBottom: "1px solid #e5e7eb",
              width: "100%",
              boxSizing: "border-box",
            }}
            className="hide-scrollbar"
          >
            {sidebarItems.map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    if (type === "fruits") {
                      setActiveQuickFilter(item.id === "Mango" ? "Mango Kesar" : "All");
                    } else if (type === "veggies") {
                      setActiveQuickFilter("Vegetables");
                    } else {
                      setActiveQuickFilter("All");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: isActive ? "#dcfce7" : "#f3f4f6",
                    color: isActive ? "#15803d" : "#374151",
                    border: isActive ? "1.5px solid #15803d" : "1px solid transparent",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: "800",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    minHeight: "40px",
                  }}
                >
                  <span>{item.emoji}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters and Sorting Strip */}
        <div
          style={{
            display: "flex",
            overflowX: "scroll",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            gap: "8px",
            padding: "8px 16px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="hide-scrollbar"
        >
          {/* Sort Option Chip */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "20px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "800",
              color: "#374151",
              outline: "none",
              cursor: "pointer",
              minHeight: "40px",
            }}
          >
            <option value="default">Sort: Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Discount: High to Low</option>
          </select>

          {[
            { id: "organic", name: "🌿 Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
            { id: "inStock", name: "🟢 In Stock", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
            { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
            { id: "discount", name: "🏷️ 20%+ Off", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
          ].map((f) => (
            <button
              key={f.id}
              onClick={f.toggle}
              style={{
                background: f.active ? "#15803d" : "white",
                color: f.active ? "white" : "#374151",
                border: f.active ? "1px solid #15803d" : "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "800",
                whiteSpace: "nowrap",
                cursor: "pointer",
                minHeight: "40px",
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Product Grid Area */}
        <div
          style={{
            paddingLeft: "12px",
            paddingRight: "12px",
            paddingTop: "12px",
            paddingBottom: "12px",
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box"
          }}
        >
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    background: "white",
                    borderRadius: "16px",
                    border: "1px solid #f0f0f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    height: "260px",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ height: "110px", background: "#f3f4f6", borderRadius: "10px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "12px", width: "50px", background: "#f3f4f6", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "14px", width: "100%", background: "#f3f4f6", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "14px", width: "70%", background: "#f3f4f6", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "44px", background: "#f3f4f6", borderRadius: "8px", animation: "pulse 1.5s infinite", marginTop: "auto" }} />
                </div>
              ))}
            </div>
          ) : searchedProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: "20px",
                border: "1px solid #f0f0f0",
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ color: "#1f2937", fontSize: "18px", fontWeight: "800", margin: "0 0 8px 0" }}>
                No products found
              </h3>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0", maxWidth: "260px" }}>
                Try adjusting your search queries or clearing your filters to see more products.
              </p>
              <button
                onClick={() => {
                  setFilterOrganic(false);
                  setFilterUnder30(false);
                  setFilterInStock(false);
                  setFilterDiscount(false);
                  setSearchQuery("");
                  setActiveSidebar("All");
                  setActiveQuickFilter("All");
                }}
                style={{
                  background: "#12C24B",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 24px",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                  minHeight: "44px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(18,194,75,0.2)",
                  transition: "background 0.2s",
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              {searchedProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  onAddToCart={addToCart}
                  navigate={navigate}
                  cart={cart}
                  cartItems={cartItems}
                  windowWidth={windowWidth}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Cart visibility bar */}
        {totalItems > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: "calc(64px + env(safe-area-inset-bottom))",
              left: 0,
              right: 0,
              height: "56px",
              background: "#12C24B",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 20px",
              zIndex: 998,
              boxShadow: "0 -4px 10px rgba(0,0,0,0.1)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/cart")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: "800", fontSize: "14px" }}>
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </span>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>|</span>
              <span style={{ fontWeight: "900", fontSize: "16px" }}>
                ₹{totalPrice}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minHeight: "44px" }}>
              <span style={{ fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                View Cart ➔
              </span>
            </div>
          </div>
        )}

        {/* Persistent Mobile Bottom Navigation Bar */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(64px + env(safe-area-inset-bottom))",
            background: "white",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            zIndex: 999,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            paddingBottom: "env(safe-area-inset-bottom)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={() => { setActiveSidebar("All"); navigate("/"); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", minHeight: "44px", minWidth: "44px", justifyContent: "center" }}
          >
            <span style={{ fontSize: "20px" }}>🏠</span>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#6b7280" }}>Shop</span>
          </div>

          <div
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                const el = document.getElementById("product-listings-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", minHeight: "44px", minWidth: "44px", justifyContent: "center" }}
          >
            <span style={{ fontSize: "20px" }}>🗂️</span>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#6b7280" }}>Categories</span>
          </div>

          <div
            onClick={() => navigate("/cart")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", position: "relative", minHeight: "44px", minWidth: "44px", justifyContent: "center" }}
          >
            <span style={{ fontSize: "20px" }}>🧺</span>
            {totalItems > 0 && (
              <span style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                background: "#ef4444",
                color: "white",
                fontSize: "9px",
                fontWeight: "900",
                borderRadius: "50%",
                width: "15px",
                height: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {totalItems}
              </span>
            )}
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#6b7280" }}>Cart</span>
          </div>

          <div
            onClick={() => navigate("/profile")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", minHeight: "44px", minWidth: "44px", justifyContent: "center" }}
          >
            <span style={{ fontSize: "20px" }}>👤</span>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#6b7280" }}>Profile</span>
          </div>
        </div>
      </div>
    );
  };

  if (apiError) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            ← Back to Catalog
          </button>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "16px",
              padding: "16px",
              color: "#991b1b",
              textAlign: "left",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> Connection Error
            </h3>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", opacity: 0.9 }}>
              {apiError}. Resolved URL: {window.API_BASE_URL}/api/products
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (windowWidth < 768) {
    return renderMobileCategoryPage();
  }

  if (type === "fruits") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Fresh Fruits
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Mango", name: "Mango", emoji: "🥭" },
              { id: "Fresh Fruits", name: "Fresh Fruits", emoji: "🍎" },
              { id: "Exotic Fruits", name: "Exotic Fruits", emoji: "🥝" },
              { id: "Seasonal Fruits", name: "Seasonal Fruits", emoji: "🍉" },
              { id: "Cut Fruits and Juices", name: "Cut Fruits & Juices", emoji: "🥤" },
              { id: "Pooja & Festive", name: "Pooja & Festive", emoji: "🪔" },
              { id: "Premium Produce", name: "Premium Produce", emoji: "🌟" },
              { id: "Certified Organics", name: "Certified Organics", emoji: "📦" },
              { id: "Fresh Vegetables", name: "Fresh Vegetables", emoji: "🥦" },
              { id: "Bouquet & Plants", name: "Bouquet & Plants", emoji: "💐" },
              { id: "Frozen Fruits", name: "Frozen Fruits", emoji: "❄️" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === "Fresh Vegetables") {
                      navigate("/section/veggies");
                    } else {
                      setActiveSidebar(item.id);
                      setActiveQuickFilter(item.id === "Mango" ? "Mango" : "Type");
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Header Line */}
            <div style={{ position: "relative", marginBottom: "16px", marginTop: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", background: "#f9fafb", paddingRight: "8px", position: "relative", zIndex: 2 }}>Quick filters</span>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#e5e7eb", zIndex: 1 }} />
            </div>

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {activeSidebar === "Mango" ? (
                [
                  { id: "Mango Kesar", name: "Mango Kesar" },
                  { id: "Mango Alphanso Ratnagiri", name: "Mango Alphanso Ratnagiri" },
                  { id: "Mango Raspuri", name: "Mango Raspuri" },
                  { id: "Type", name: "Type ⊽" },
                ].map((pill) => {
                  const isPillActive = activeQuickFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => {
                        if (pill.id !== "Type") {
                          setActiveQuickFilter(pill.id === activeQuickFilter ? "Mango" : pill.id);
                        }
                      }}
                      style={{
                        background: isPillActive ? "white" : "white",
                        border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                        borderRadius: "20px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: isPillActive ? "#318616" : "#374151",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pill.name}
                    </button>
                  );
                })
              ) : (
                [
                  { id: "All Fruits", name: "All Fruits" },
                  { id: "Ratings", name: "Customer Ratings ⊽" },
                ].map((pill) => {
                  const isPillActive = activeQuickFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => {
                        if (pill.id !== "Ratings") {
                          setActiveQuickFilter(pill.id);
                        }
                      }}
                      style={{
                        background: isPillActive ? "white" : "white",
                        border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                        borderRadius: "20px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: isPillActive ? "#318616" : "#374151",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pill.name}
                    </button>
                  );
                })
              )}
            </div>

            {/* Fruits Product Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading Fresh Fruits...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🍎</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Fruits Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (type === "dairy") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Dairy, Bread and Eggs
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Milk", name: "Milk", emoji: "🥛" },
              { id: "Eggs", name: "Eggs", emoji: "🥚" },
              { id: "Curd and Yogurts", name: "Curd and Yogurts", emoji: "🥣" },
              { id: "Fresh Bakery", name: "Fresh Bakery", emoji: "🥐" },
              { id: "Butter", name: "Butter", emoji: "🧈" },
              { id: "Bread and Buns", name: "Bread and Buns", emoji: "🍞" },
              { id: "Cheese", name: "Cheese", emoji: "🧀" },
              { id: "Batters and Chutneys", name: "Batters & Chutneys", emoji: "🏺" },
              { id: "Lassi and Buttermilk", name: "Lassi & Buttermilk", emoji: "🥛" },
              { id: "Milkshakes and More", name: "Milkshakes & More", emoji: "🥤" },
              { id: "Indian Breads", name: "Indian Breads", emoji: "🫓" },
              { id: "Dairy Alternatives", name: "Dairy Alternatives", emoji: "🌱" },
              { id: "Paneer and Tofu", name: "Paneer and Tofu", emoji: "🍲" },
              { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter(item.id === "Milk" ? "Milk" : "Type");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#ef4444",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { id: "Milk", name: "All Milk" },
                { id: "Amul", name: "Amul" },
                { id: "Nandini", name: "Nandini" },
                { id: "Heritage", name: "Heritage" },
                { id: "Brand", name: "Brand ⊽" },
                { id: "Type", name: "Type ⊽" },
                { id: "Ratings", name: "Customer Ratings ⊽" },
              ].map((pill) => {
                const isPillActive = activeQuickFilter === pill.id || (pill.id === "Milk" && activeQuickFilter === "Milk");
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id !== "Brand" && pill.id !== "Type" && pill.id !== "Ratings") {
                        setActiveQuickFilter(pill.id === activeQuickFilter ? "Milk" : pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "white" : "white",
                      border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isPillActive ? "#318616" : "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Dairy Product Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading Dairy, Bread & Eggs...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🥛</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Products Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product, index) => {
                  // Render inline promo banner full-width between rows (after index 3)
                  const bannerItem = index === 4 ? (
                    <div
                      key="promo_banner"
                      style={{
                        gridColumn: "1 / -1",
                        borderRadius: "24px",
                        overflow: "hidden",
                        margin: "12px 0 24px 0",
                        position: "relative",
                        cursor: "pointer",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(90deg, #fdf8f2 0%, #f7eada 100%)",
                          padding: "32px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "20px",
                          border: "1px solid #f0e2d2",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#b45309", letterSpacing: "1px", textTransform: "uppercase" }}>Freshly Baked</span>
                          <h3 style={{ fontSize: "28px", fontWeight: "950", color: "#451a03", margin: "6px 0 4px 0", fontFamily: "'Outfit', sans-serif" }}>
                            Newly launched, freshly baked everyday indulgence
                          </h3>
                          <p style={{ fontSize: "14px", color: "#78350f", margin: 0, fontWeight: "600" }}>
                            Sourced from the finest local artisanal bakeries, delivered in 29 mins!
                          </p>
                        </div>
                        <button
                          style={{
                            background: "#451a03",
                            color: "white",
                            border: "none",
                            borderRadius: "14px",
                            padding: "14px 28px",
                            fontSize: "14px",
                            fontWeight: "900",
                            cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(69,26,3,0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          Shop Now <span style={{ fontSize: "12px" }}>▶</span>
                        </button>
                      </div>
                    </div>
                  ) : null;

                  return (
                    <React.Fragment key={product._id || product.id}>
                      {bannerItem}
                      <ProductCard
                        product={product}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        onAddToCart={addToCart}
                        navigate={navigate}
                        cart={cart}
                        cartItems={cartItems}
                        windowWidth={windowWidth}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (DYNAMIC_CONFIG[type]) {
    const config = DYNAMIC_CONFIG[type] ? {
      ...DYNAMIC_CONFIG[type],
      sidebarItems: [
        { id: "All", name: "Show All", emoji: "🛍️" },
        ...DYNAMIC_CONFIG[type].sidebarItems
      ]
    } : null;
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              {config.title}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <input
              type="text"
              placeholder={`Search in ${config.title.replace(/[^\w\s&]/g, "").trim()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: "12px",
                padding: "10px 16px",
                fontSize: "14px",
                outline: "none",
                width: "240px",
                fontWeight: "600",
              }}
            />
            <span style={{ fontSize: "20px", color: "#6b7280", cursor: "pointer" }}>🔍</span>
          </div>
        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {config.sidebarItems.map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter(item.id === config.defaultSidebar ? config.defaultQuickFilter : "All");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {config.quickFilters.map((pill) => {
                const isPillActive = activeQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id !== "All" && !pill.name.includes("⊽")) {
                        setActiveQuickFilter(pill.id === activeQuickFilter ? "All" : pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "white" : "white",
                      border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isPillActive ? "#318616" : "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Product Catalog Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading items...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>📦</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Items Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (type === "masalas") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Masalas
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Whole Spices", name: "Whole Spices", emoji: "🥣" },
              { id: "Sugar and Jaggery", name: "Sugar & Jaggery", emoji: "🪵" },
              { id: "Cold Grind", name: "Cold Grind", emoji: "🧂" },
              { id: "Powdered Spices", name: "Powdered Spices", emoji: "🥣" },
              { id: "Salt", name: "Salt", emoji: "🧂" },
              { id: "Ready Masala", name: "Ready Masala", emoji: "🥘" },
              { id: "Pickles & Chutney", name: "Pickles & Chutney", emoji: "🫙" },
              { id: "Herbs & Seasoning", name: "Herbs & Seasoning", emoji: "🌿" },
              { id: "Paste and Puree", name: "Paste & Puree", emoji: "🏺" },
              { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter(item.id === "Whole Spices" ? "Red Chilli Whole" : "All");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { id: "All", name: "🎛️ Filters" },
                { id: "Red Chilli Whole", name: "Red Chilli Whole" },
                { id: "Black Pepper", name: "Black Pepper" },
                { id: "Mustard Seeds", name: "Mustard Seeds" },
                { id: "Type", name: "Type ⊽" },
                { id: "Brand", name: "Brand ⊽" },
                { id: "Ratings", name: "Customer Ratings ⊽" },
                { id: "SortBy", name: "Sort By ⊽" },
              ].map((pill) => {
                const isPillActive = activeQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id === "Red Chilli Whole" || pill.id === "Black Pepper" || pill.id === "Mustard Seeds") {
                        setActiveQuickFilter(pill.id === activeQuickFilter ? "All" : pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "white" : "white",
                      border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isPillActive ? "#318616" : "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Product Catalog Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading spices...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🌶️</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Spices Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (type === "grocery") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Atta, Rice and Dal
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Atta", name: "Atta", emoji: "🌾" },
              { id: "Rice", name: "Rice", emoji: "🍚" },
              { id: "Toor, Moong and Urad", name: "Toor, Moong & Urad", emoji: "🍲" },
              { id: "High Protein Atta", name: "High Protein Atta", emoji: "🌾" },
              { id: "Basmati Rice", name: "Basmati Rice", emoji: "🍚" },
              { id: "Besan, Sooji and Maida", name: "Besan, Sooji & Maida", emoji: "🥣" },
              { id: "Rajma, Chola and Others", name: "Rajma, Chola & Others", emoji: "🍲" },
              { id: "Poha & Puffed Rice", name: "Poha & Puffed Rice", emoji: "🌾" },
              { id: "Premium Brands", name: "Premium Brands", emoji: "🌟" },
              { id: "Soya Chunk & Badi", name: "Soya Chunk & Badi", emoji: "🫘" },
              { id: "Other Flours", name: "Other Flours", emoji: "🥣" },
              { id: "Millets & Daliya", name: "Millets & Daliya", emoji: "🌾" },
              { id: "Ready to Cook Flour Mix", name: "Ready to Cook Flour Mix", emoji: "🫓" },
              { id: "Top Deals", name: "Top Deals", emoji: "🏷️" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter(item.id === "Atta" ? "Wheat Atta" : "All");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Aashirvaad Millets Promo Banner */}
            <div
              style={{
                borderRadius: "24px",
                overflow: "hidden",
                marginBottom: "24px",
                position: "relative",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(90deg, #5c3818 0%, #a16228 100%)",
                  padding: "36px 40px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "24px",
                  color: "white",
                }}
              >
                <div style={{ maxWidth: "60%" }}>
                  <span style={{ fontSize: "12px", fontWeight: "900", color: "#fed7aa", letterSpacing: "2px", textTransform: "uppercase", background: "rgba(254,215,170,0.15)", padding: "4px 10px", borderRadius: "20px" }}>AASHIRVAAD ATTA & MILLETS</span>
                  <h2 style={{ fontSize: "32px", fontWeight: "950", margin: "12px 0 8px 0", lineHeight: "1.2", fontFamily: "'Outfit', sans-serif" }}>
                    Supercharge your day
                  </h2>
                  <p style={{ fontSize: "15px", color: "#ffedd5", margin: 0, fontWeight: "600", opacity: 0.9 }}>
                    With the power of 25% millets in your chapatis. Order now for instant delivery!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveSidebar("Millets & Daliya");
                    setActiveQuickFilter("All");
                  }}
                  style={{
                    background: "white",
                    color: "#5c3818",
                    border: "none",
                    borderRadius: "16px",
                    padding: "16px 36px",
                    fontSize: "14px",
                    fontWeight: "950",
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s",
                  }}
                  className="hover:scale-105"
                >
                  ORDER NOW
                </button>
              </div>
            </div>

            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { id: "All", name: "🎛️ Filters" },
                { id: "Wheat Atta", name: "Wheat Atta" },
                { id: "Multigrain Atta", name: "Multigrain Atta" },
                { id: "Sharbati Atta", name: "Sharbati Atta" },
                { id: "Type", name: "Type ⊽" },
                { id: "Brand", name: "Brand ⊽" },
                { id: "Ratings", name: "Customer Ratings ⊽" },
                { id: "SortBy", name: "Sort By ⊽" },
              ].map((pill) => {
                const isPillActive = activeQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id === "Wheat Atta" || pill.id === "Multigrain Atta" || pill.id === "Sharbati Atta") {
                        setActiveQuickFilter(pill.id === activeQuickFilter ? "All" : pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "white" : "white",
                      border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isPillActive ? "#318616" : "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Product Catalog Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading Grocery items...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🌾</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Items Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (type === "meat") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Meat and Seafood
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Fresh Chicken", name: "Fresh Chicken", emoji: "🍗" },
              { id: "Fresh Seafood", name: "Fresh Seafood", emoji: "🍤" },
              { id: "Fresh Mutton", name: "Fresh Mutton", emoji: "🥩" },
              { id: "Ready to Cook", name: "Ready to Cook", emoji: "🍳" },
              { id: "Meat Combos", name: "Meat Combos", emoji: "🍱" },
              { id: "Frozen Food", name: "Frozen Food", emoji: "❄️" },
              { id: "Plant Based Meat", name: "Plant Based Meat", emoji: "🌱" },
              { id: "Eggs", name: "Eggs", emoji: "🥚" },
              { id: "Cold Cuts", name: "Cold Cuts", emoji: "🥓" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter(item.id === "Fresh Chicken" ? "Curry Cut" : "All");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "white" : "white",
                  border: activeGourmet ? "1.5px solid #854d0e" : "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#854d0e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(133,77,14,0.1)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { id: "All", name: "🎛️ Filters" },
                { id: "Curry Cut", name: "Curry Cut" },
                { id: "Boneless", name: "Boneless" },
                { id: "Drumstick", name: "Drumstick" },
                { id: "Type", name: "Type ⊽" },
                { id: "Brand", name: "Brand ⊽" },
                { id: "Ratings", name: "Customer Ratings ⊽" },
                { id: "SortBy", name: "Sort By ⊽" },
              ].map((pill) => {
                const isPillActive = activeQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id === "Curry Cut" || pill.id === "Boneless" || pill.id === "Drumstick") {
                        setActiveQuickFilter(pill.id === activeQuickFilter ? "All" : pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "white" : "white",
                      border: isPillActive ? "1.5px solid #318616" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isPillActive ? "#318616" : "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Product Catalog Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading Meat and Seafood...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🥩</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Products Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (type === "veggies") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* Top Header Portal */}
        <header
          style={{
            background: "white",
            borderBottom: "1px solid #f3f4f6",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#111827", margin: 0 }}>
              Fresh Vegetables
            </h1>
          </div>


        </header>

        {/* Main Split Layout */}
        <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
          {/* Left Sidebar */}
          <aside
            style={{
              width: "200px",
              background: "white",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {[
              { id: "All", name: "Show All", emoji: "🛍️" },
              { id: "Fresh Vegetables", name: "Fresh Vegetables", emoji: "🥦", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=100" },
              { id: "Leafy and Seasonings", name: "Leafy & Seasonings", emoji: "🥬", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100" },
              { id: "Exotic Vegetables", name: "Exotic Vegetables", emoji: "🍆", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100" },
              { id: "Certified Organics", name: "Certified Organics", emoji: "📦", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100" },
              { id: "Pooja & Festive", name: "Pooja & Festive", emoji: "🪔", image: "https://images.unsplash.com/photo-1609137144813-2dbe44dcab14?w=100" },
            ].map((item) => {
              const isActive = activeSidebar === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    setActiveQuickFilter("Vegetables"); // Reset quick filter on sidebar switch
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderLeft: isActive ? "4px solid #318616" : "4px solid transparent",
                    background: isActive ? "#fdf2f8" : "transparent",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive ? "white" : "#f3f4f6",
                      boxShadow: isActive ? "0 2px 8px rgba(219,39,119,0.1)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{item.emoji}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: isActive ? "#318616" : "#4b5563",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </aside>

          {/* Right Content Panel */}
          <main style={{ flexGrow: 1, padding: "24px", overflowY: "auto" }}>
            {/* Top Filter Badges */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                style={{
                  background: showFiltersPanel ? "#318616" : "white",
                  border: showFiltersPanel ? "1.5px solid #318616" : "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: showFiltersPanel ? "white" : "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: showFiltersPanel ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
                }}
              >
                Filters 🎛️
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <span style={{
                    background: showFiltersPanel ? "white" : "#318616",
                    color: showFiltersPanel ? "#318616" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "900"
                  }}>
                    {[filterOrganic, filterUnder30, filterInStock, filterDiscount].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveGourmet(!activeGourmet)}
                style={{
                  background: activeGourmet ? "#318616" : "white",
                  border: activeGourmet ? "1.5px solid #318616" : "1.5px solid #fed7aa",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "800",
                  color: activeGourmet ? "white" : "#318616",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeGourmet ? "0 2px 8px rgba(234,88,12,0.2)" : "none",
                }}
              >
                Gourmet
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#374151",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="default">Sort By: Popularity ⊽</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Discount: High to Low</option>
              </select>
            </div>

            {/* Active Sub-Filter Panel */}
            {showFiltersPanel && (
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#4b5563", marginRight: "4px" }}>
                  Active Filters:
                </span>
                {[
                  { id: "organic", name: "📦 100% Organic", active: filterOrganic, toggle: () => setFilterOrganic(!filterOrganic) },
                  { id: "under30", name: "💸 Under ₹30", active: filterUnder30, toggle: () => setFilterUnder30(!filterUnder30) },
                  { id: "inStock", name: "🟢 In Stock Only", active: filterInStock, toggle: () => setFilterInStock(!filterInStock) },
                  { id: "discount", name: "🏷️ High Discount (20%+ Off)", active: filterDiscount, toggle: () => setFilterDiscount(!filterDiscount) },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={f.toggle}
                    style={{
                      background: f.active ? "#318616" : "white",
                      color: f.active ? "white" : "#4b5563",
                      border: f.active ? "1.5px solid #318616" : "1px solid #d1d5db",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: f.active ? "0 2px 6px rgba(37,99,235,0.2)" : "none",
                    }}
                  >
                    {f.name}
                  </button>
                ))}
                {(filterOrganic || filterUnder30 || filterInStock || filterDiscount) && (
                  <button
                    onClick={() => {
                      setFilterOrganic(false);
                      setFilterUnder30(false);
                      setFilterInStock(false);
                      setFilterDiscount(false);
                    }}
                    style={{
                      background: "transparent",
                      color: "#318616",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Clear All ✕
                  </button>
                )}
              </div>
            )}

            {/* Quick Filters Strip */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { id: "Vegetables", name: "Vegetables" },
                { id: "Leafy and Seasonings", name: "Leafy & Seasonings" },
                { id: "Exotic Vegetables", name: "Exotic Vegetables" },
                { id: "Ratings", name: "Customer Ratings ⊽" },
              ].map((pill) => {
                const isPillActive = activeQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      if (pill.id !== "Ratings") {
                        setActiveQuickFilter(pill.id);
                      }
                    }}
                    style={{
                      background: isPillActive ? "#f3f4f6" : "white",
                      border: isPillActive ? "1.5px solid #374151" : "1px solid #e5e7eb",
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: "800",
                      color: "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* Vegetables Product Grid */}
            {loading ? (
              <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading Fresh Veggies...</h2>
            ) : searchedProducts.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "100px" }}>
                <span style={{ fontSize: "48px" }}>🥗</span>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No Veggies Found</h3>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your sidebar category or search filters</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: "24px",
                }}
              >
                {searchedProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    onAddToCart={addToCart}
                    navigate={navigate}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Navigation & Header Portal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
              }}
            >
              ← Back to Catalog
            </button>
            <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1f2937", margin: 0 }}>
              {sectionTitle}
            </h1>
          </div>

          {/* Filtering and Search Controls */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "10px 16px",
                fontSize: "14px",
                outline: "none",
                fontWeight: "700",
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              <option value="default">Sort by: Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to High</option>
              <option value="discount">Discount: High to Low</option>
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <h2 style={{ textAlign: "center", color: "#4b5563", marginTop: "100px" }}>Loading products...</h2>
        ) : searchedProducts.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "100px" }}>
            <span style={{ fontSize: "48px" }}>🔍</span>
            <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: "800", marginTop: "12px" }}>No items found</h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Try adjusting your search keywords</p>
          </div>
        ) : (
          /* Dynamic Grid layout */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "24px",
            }}
          >
            {searchedProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                onAddToCart={addToCart}
                navigate={navigate}
                cart={cart}
                cartItems={cartItems}
                windowWidth={windowWidth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}