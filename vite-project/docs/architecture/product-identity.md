# Product Identity / Data Ownership Contract

This document outlines the source of truth, formatting, lifecycle, and validations for product identity in Buyto.

## Data Ownership Invariants

1. **Backend owns `_id`**
   - Every product returned by any backend API endpoint (e.g. `/api/products`) must contain a valid MongoDB `_id` (24-character hexadecimal ObjectId).
   - Custom string IDs (like `"veg4"`) are used strictly for client-side routing, SEO, or analytics, and must never replace `_id` in database operations.

2. **Frontend preserves `_id`**
   - The frontend must never create, modify, infer, or replace the product's `_id`. 
   - The frontend strictly consumes the `_id` supplied by the backend and passes it back to backend APIs.

3. **Cart stores `_id`**
   - Every persisted cart item in LocalStorage (`buyto_cart` and `cart`) must contain the MongoDB `_id`.

4. **Checkout uses `_id`**
   - Every checkout/order creation payload sent to the backend (e.g. `POST /api/orders` or `POST /api/payment/create-order`) must reference products exclusively by their MongoDB `_id`.

5. **Backend verifies `_id`**
   - The backend validates that every submitted product ID is a valid Mongoose ObjectId and exists in the database.
   - The backend recalculates all pricing, names, and metadata from the database records rather than trusting client-supplied values.
