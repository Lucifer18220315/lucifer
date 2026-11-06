import React from 'react';

export function LightSketch(){return <svg width="936" height="340" viewBox="0 0 936 340" style={{display:'block'}} fontFamily="Arial, sans-serif">
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#d4b88f"/></marker></defs>
  <rect width="936" height="340" rx="16" fill="#17201d" fillOpacity=".91"/>
  <text x="30" y="42" fill="#aaa993" fontSize="21" letterSpacing="2">ВИД СВЕРХУ · КЛЮЧЕВОЙ СВЕТ</text>
  <path d="M 236 220 L 442 108" stroke="#d4b88f" strokeWidth="3" markerEnd="url(#arrow)"/>
  <path d="M 480 255 L 480 142" stroke="#7e938e" strokeWidth="2" strokeDasharray="8 8"/>
  <circle cx="480" cy="104" r="28" fill="none" stroke="#f3ead8" strokeWidth="3"/>
  <text x="480" y="111" textAnchor="middle" fill="#f3ead8" fontSize="20">FOLD</text>
  <rect x="167" y="199" width="76" height="26" rx="3" fill="#eee4ce" transform="rotate(-28 205 212)"/>
  <text x="44" y="166" fill="#f3ead8" fontSize="27">28 × 38 см</text>
  <text x="30" y="312" fill="#aaa993" fontSize="21">Центр света: 32 см над столом</text>
  <text x="287" y="225" fill="#d4b88f" fontSize="27">45 см / 45°</text>
  <rect x="455" y="262" width="50" height="30" rx="5" fill="#52635e"/>
  <text x="480" y="324" textAnchor="middle" fill="#c7c7b6" fontSize="23">камера</text>
  <rect x="678" y="65" width="9" height="93" rx="3" fill="#e0dfca"/>
  <text x="719" y="112" fill="#c7c7b6" fontSize="24">белый</text><text x="719" y="143" fill="#c7c7b6" fontSize="24">отражатель</text>
</svg>;}
