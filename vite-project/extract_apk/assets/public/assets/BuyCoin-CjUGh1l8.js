import{W as e,j as t}from"./index-D2EfKH85.js";e();var n=t();function r({size:e=24,className:t=``,animate:r=!1}){return(0,n.jsxs)(`span`,{style:{display:`inline-flex`,alignItems:`center`,justifyContent:`center`,verticalAlign:`middle`,...r?{animation:`buyCoinFloat 4s ease-in-out infinite`}:{}},className:t,children:[(0,n.jsxs)(`svg`,{width:e,height:e,viewBox:`0 0 100 100`,style:{display:`block`},children:[(0,n.jsxs)(`defs`,{children:[(0,n.jsxs)(`linearGradient`,{id:`outerRingGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,n.jsx)(`stop`,{offset:`0%`,stopColor:`#f59e0b`}),(0,n.jsx)(`stop`,{offset:`30%`,stopColor:`#fbbf24`}),(0,n.jsx)(`stop`,{offset:`70%`,stopColor:`#d97706`}),(0,n.jsx)(`stop`,{offset:`100%`,stopColor:`#f59e0b`})]}),(0,n.jsxs)(`linearGradient`,{id:`innerFillGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,n.jsx)(`stop`,{offset:`0%`,stopColor:`#fffbeb`}),(0,n.jsx)(`stop`,{offset:`40%`,stopColor:`#ffd54f`}),(0,n.jsx)(`stop`,{offset:`80%`,stopColor:`#f59e0b`}),(0,n.jsx)(`stop`,{offset:`100%`,stopColor:`#d97706`})]}),(0,n.jsx)(`filter`,{id:`coinShadow`,x:`-20%`,y:`-20%`,width:`140%`,height:`140%`,children:(0,n.jsx)(`feDropShadow`,{dx:`1`,dy:`3`,stdDeviation:`2`,floodColor:`#000000`,floodOpacity:`0.2`})}),(0,n.jsxs)(`linearGradient`,{id:`shineGrad`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,n.jsx)(`stop`,{offset:`0%`,stopColor:`rgba(255,255,255,0)`}),(0,n.jsx)(`stop`,{offset:`50%`,stopColor:`rgba(255,255,255,0.7)`}),(0,n.jsx)(`stop`,{offset:`100%`,stopColor:`rgba(255,255,255,0)`})]}),(0,n.jsx)(`clipPath`,{id:`coinClip`,children:(0,n.jsx)(`circle`,{cx:`50`,cy:`50`,r:`46`})})]}),(0,n.jsx)(`circle`,{cx:`50`,cy:`52`,r:`46`,fill:`rgba(0, 0, 0, 0.15)`}),(0,n.jsx)(`circle`,{cx:`50`,cy:`50`,r:`46`,fill:`url(#outerRingGrad)`,stroke:`#b45309`,strokeWidth:`1.5`,filter:`url(#coinShadow)`}),(0,n.jsx)(`circle`,{cx:`50`,cy:`50`,r:`36`,fill:`url(#innerFillGrad)`,stroke:`#e0a904`,strokeWidth:`1`}),(0,n.jsx)(`circle`,{cx:`50`,cy:`50`,r:`32`,fill:`none`,stroke:`rgba(245, 158, 11, 0.4)`,strokeWidth:`1.5`,strokeDasharray:`4 2`}),(0,n.jsx)(`text`,{x:`51`,y:`64`,fontFamily:`'Outfit', 'Inter', 'Arial Black', sans-serif`,fontSize:`42`,fontWeight:`900`,fill:`#318616`,textAnchor:`middle`,style:{letterSpacing:`-1.5px`},children:`B`}),r&&(0,n.jsx)(`g`,{clipPath:`url(#coinClip)`,children:(0,n.jsx)(`rect`,{x:`-120`,y:`-120`,width:`60`,height:`300`,fill:`url(#shineGrad)`,style:{animation:`buyCoinShine 8s infinite linear`}})})]}),(0,n.jsx)(`style`,{children:`
        @keyframes buyCoinFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(3deg);
          }
        }
        @keyframes buyCoinShine {
          0% {
            transform: translate(-100px, -100px) rotate(45deg);
          }
          20% {
            transform: translate(220px, 220px) rotate(45deg);
          }
          100% {
            transform: translate(220px, 220px) rotate(45deg);
          }
        }
      `})]})}export{r as t};