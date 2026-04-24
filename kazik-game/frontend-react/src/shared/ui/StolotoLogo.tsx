import { useId } from 'react'

const LOGO_TEXT_SHIFT_X = 14
/** Сдвиг «ТОЛОТО» вправо: выравнивает зазор С–Т с зазором между остальными буквами (~15px по контуру). */
const LOGO_AFTER_C_TRACK_X = 9

export function StolotoLogo({ className = '' }: { className?: string }) {
  const maskId = `stoloto-cutout-${useId().replace(/:/g, '')}`
  const textWidth = 290 + LOGO_TEXT_SHIFT_X + LOGO_AFTER_C_TRACK_X

  return (
    <svg 
      className={className}
      viewBox={`0 0 ${textWidth} 40`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: '32px', width: 'auto', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <g transform={`translate(${LOGO_TEXT_SHIFT_X} 0)`}>
            {/* та же геометрия, что и видимая «С» (полукруг), для выреза у синего круга */}
            <path d="M 92 10 A 10 10 0 0 0 92 30" stroke="black" strokeWidth="13" strokeLinecap="round" fill="none" />
          </g>
        </mask>
      </defs>

      {/* 4 Balls */}
      <circle cx="20" cy="20" r="14" fill="#FFCC00" />
      <circle cx="36" cy="20" r="14" fill="#E3000F" style={{ mixBlendMode: 'multiply' }} />
      <circle cx="52" cy="20" r="14" fill="#00B350" style={{ mixBlendMode: 'multiply' }} />
      <circle cx="68" cy="20" r="14" fill="#00A0E4" style={{ mixBlendMode: 'multiply' }} mask={`url(#${maskId})`} />
      
      <g transform={`translate(${LOGO_TEXT_SHIFT_X} 0)`} stroke="#0F1E32" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* С — полукруг как у «О» по высоте (y 10–30), выпуклость влево к кругам */}
        <path d="M 92 10 A 10 10 0 0 0 92 30" />
        <g transform={`translate(${LOGO_AFTER_C_TRACK_X} 0)`}>
          {/* ТОЛОТО — сдвиг на одинаковый интервал после «С» */}
          <path d="M 98 10 L 114 10 M 106 10 L 106 30" />
          <circle cx="139" cy="20" r="10" />
          <path d="M 164 30 L 172 10 L 180 30" />
          <circle cx="205" cy="20" r="10" />
          <path d="M 230 10 L 246 10 M 238 10 L 238 30" />
          <circle cx="271" cy="20" r="10" />
        </g>
      </g>
    </svg>
  )
}
