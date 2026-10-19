import React from "react";
import HorizontalProductSection from "../../HorizontalProductSection";
import LazyHorizontalProductSection from "../common/LazyHorizontalProductSection";

export default function CategorySections({
  bestDealsList,
  navigate,
  openProduct,
  setSelectedProduct,
  addToCart,
  removeFromCart,
  cart,
  cartItems,
  windowWidth,
  getCartKey,
}) {
  return (
    <>
      <LazyHorizontalProductSection
        title="Trending Near You"
        emoji="⚡"
        categoryQuery="trending"
        limit={6}
        onShowAll={() => navigate("/section/trending")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="trending-near-you"
      />

      <LazyHorizontalProductSection
        title="Fresh Fruits"
        emoji="🍎"
        categoryQuery="The Fruit Store"
        limit={6}
        onShowAll={() => navigate("/category/fresh-fruits")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="fresh-fruits"
      />

      <LazyHorizontalProductSection
        title="Fresh Vegetables"
        emoji="🥬"
        categoryQuery="The Veggie Store"
        limit={6}
        onShowAll={() => navigate("/category/fresh-vegetables")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="fresh-vegetables"
      />

      <LazyHorizontalProductSection
        title="Chips & Snacks"
        emoji="🍟"
        categoryQuery="Chips and Namkeens"
        limit={6}
        onShowAll={() => navigate("/category/chips-and-namkeens")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="chips-and-namkeens"
      />

      <LazyHorizontalProductSection
        title="Dairy & Breakfast"
        emoji="🥛"
        categoryQuery="Dairy, Bread & Eggs"
        limit={6}
        onShowAll={() => navigate("/category/dairy-bread-and-eggs")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="dairy-bread-and-eggs"
      />

      <LazyHorizontalProductSection
        title="Oils & Ghee"
        emoji="🛢️"
        categoryQuery="Oils and Ghee"
        limit={6}
        onShowAll={() => navigate("/category/oils-and-ghee")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="oils-and-ghee"
      />

      <LazyHorizontalProductSection
        title="Cold Drinks & Juices"
        emoji="🥤"
        categoryQuery="Cold Drinks and Juices"
        limit={6}
        onShowAll={() => navigate("/category/cold-drinks-and-juices")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="cold-drinks-and-juices"
      />

      <LazyHorizontalProductSection
        title="Ice Creams & Desserts"
        emoji="🍦"
        categoryQuery="Ice Creams & Desserts"
        limit={6}
        onShowAll={() => navigate("/category/ice-creams-and-desserts")}
        openProduct={openProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        containerId="ice-creams-and-desserts"
      />

      {bestDealsList && bestDealsList.length > 0 && (
        <div
          id="best-deals-today"
          style={{
            scrollMarginTop: "140px",
            transition: "all 0.5s ease",
            borderRadius: "16px",
          }}
        >
          <HorizontalProductSection
            title="Best Deals Today"
            emoji="🔥"
            products={bestDealsList.slice(0, 6)}
            onShowAll={() => navigate("/section/best-deals")}
            openProduct={openProduct}
            setSelectedProduct={setSelectedProduct}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cart={cart}
            cartItems={cartItems}
            windowWidth={windowWidth}
            getCartKey={getCartKey}
          />
        </div>
      )}
    </>
  );
}
