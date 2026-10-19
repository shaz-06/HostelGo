import sys

file_path = "/Users/shashankshetty/Documents/HostelGo/vite-project/src/App.jsx"

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = lines[:3213] + [
    '                        <CategorySections\n',
    '                          trendingProducts={trendingProducts}\n',
    '                          fruitProducts={fruitProducts}\n',
    '                          veggieProducts={veggieProducts}\n',
    '                          chipProducts={chipProducts}\n',
    '                          dairyProducts={dairyProducts}\n',
    '                          oilProducts={oilProducts}\n',
    '                          drinkProducts={drinkProducts}\n',
    '                          iceCreamProducts={iceCreamProducts}\n',
    '                          bestDealsList={bestDealsList}\n',
    '                          navigate={navigate}\n',
    '                          openProduct={openProduct}\n',
    '                          setSelectedProduct={setSelectedProduct}\n',
    '                          addToCart={addToCart}\n',
    '                          removeFromCart={removeFromCart}\n',
    '                          cart={cart}\n',
    '                          windowWidth={windowWidth}\n',
    '                          getCartKey={getCartKey}\n',
    '                        />\n'
] + lines[3466:]

with open(file_path, "w") as f:
    f.writelines(new_lines)
