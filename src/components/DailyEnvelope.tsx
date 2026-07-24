import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { paletteHex } from '../lib/palette'
import type { EnvelopeContent } from '../lib/envelopeContent'

const BROWN = paletteHex('cabernet')
const BROWN_LIGHT = `color-mix(in srgb, ${BROWN} 78%, white)`
const BROWN_DARK = `color-mix(in srgb, ${BROWN} 85%, black)`
const CARD_GREEN = paletteHex('sproutingSage')

export function DailyEnvelope({ content }: { content: EnvelopeContent }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center py-4">
      <div
        className="relative w-full max-w-[300px]"
        style={{ perspective: 900, filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.16))' }}
      >
        {/* card, tucked inside until opened */}
        <button
          onClick={() => (open ? content.kind === 'lookback' && navigate('/lookback') : undefined)}
          className="absolute inset-x-3 top-0 flex min-h-[132px] flex-col items-center justify-center rounded-xl px-5 py-6 text-center shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-700 ease-out"
          style={{
            background: `linear-gradient(160deg, color-mix(in srgb, ${CARD_GREEN} 88%, white) 0%, ${CARD_GREEN} 60%)`,
            zIndex: open ? 20 : 5,
            transform: open ? 'translateY(-58px) rotate(-1.5deg) scale(1)' : 'translateY(18px) rotate(0deg) scale(0.94)',
            opacity: open ? 1 : 0,
            cursor: open && content.kind === 'lookback' ? 'pointer' : 'default',
          }}
        >
          <p
            className="text-[17px] leading-snug text-white"
            style={{ fontFamily: 'var(--font-quote)', fontStyle: 'italic', fontWeight: 400 }}
          >
            {content.text}
          </p>
          {content.kind === 'lookback' && (
            <span className="mt-3 text-[11px] uppercase tracking-[0.08em] text-white/70">Tap to see your growth</span>
          )}
        </button>

        {/* envelope body */}
        <div
          className="relative flex h-[150px] items-end justify-center overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(160deg, ${BROWN_LIGHT} 0%, ${BROWN} 45%, ${BROWN_DARK} 100%)`,
            zIndex: 10,
          }}
        >
          {/* diagonal paper sheen */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 30%)' }}
          />
          {/* seam where the flap meets the body */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/20" />

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close envelope' : 'Open today’s envelope'}
            className="absolute inset-0 h-full w-full cursor-pointer"
          />
          {!open && (
            <p
              className="pointer-events-none pb-3 text-[13px] text-white/75"
              style={{ fontFamily: 'var(--font-quote)', fontStyle: 'italic' }}
            >
              tap to open
            </p>
          )}
        </div>

        {/* flap, flips open on top of the body */}
        <div
          className="absolute inset-x-0 top-0 h-[78px] transition-transform duration-500 ease-in-out"
          style={{
            zIndex: open ? 1 : 15,
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            transform: open ? 'rotateX(-150deg)' : 'rotateX(0deg)',
          }}
        >
          <div
            className="relative h-full w-full"
            style={{
              background: `linear-gradient(200deg, ${BROWN_LIGHT} 0%, color-mix(in srgb, ${BROWN} 92%, white) 100%)`,
              clipPath: 'polygon(0 0, 100% 0, 50% 92%)',
            }}
          >
            {/* fold shadow lines */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(20deg, transparent 48%, rgba(0,0,0,0.12) 50%, transparent 52%), linear-gradient(160deg, transparent 48%, rgba(0,0,0,0.12) 50%, transparent 52%)',
              }}
            />
            {/* wax seal monogram */}
            <span
              className="absolute left-1/2 top-[38%] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-[13px] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              style={{ background: BROWN_DARK, fontFamily: 'var(--font-quote)', fontStyle: 'italic' }}
            >
              d
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
