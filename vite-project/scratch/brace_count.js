import fs from "fs";
const code = fs.readFileSync("/Users/shashankshetty/Documents/HostelGo/vite-project/src/pages/PaymentPage.jsx", "utf8");

let braces = 0;
let parens = 0;
let lineNum = 1;
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  if (char === "\n") lineNum++;
  if (char === "{") braces++;
  if (char === "}") braces--;
  if (char === "(") parens++;
  if (char === ")") parens--;
  
  if (braces < 0) {
    console.log(`Negative braces at line ${lineNum}`);
    break;
  }
  if (parens < 0) {
    console.log(`Negative parens at line ${lineNum}`);
    break;
  }
}
console.log(`End: braces = ${braces}, parens = ${parens}`);
