import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ToolIcon from './ToolIcons'

const sizes = {
  md: 'px-3 py-2 text-sm',
  sm: 'px-2.5 py-1 text-xs',
}

const optionSizes = {
  md: 'px-2.5 py-1.5 text-sm',
  sm: 'px-2 py-1 text-xs',
}

const MAX_HEIGHT = 280

export default function Select({ value, options, onChange, ariaLabel, size = 'md', className = '' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState(null)
  const trigger = useRef(null)
  const list = useRef(null)
  const id = useId()
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const show = () => {
    setActive(selected)
    setPlace(null)
    setOpen(true)
  }

  const close = () => setOpen(false)

  const choose = (index) => {
    onChange(options[index].value)
    close()
    trigger.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open || !list.current) return
    const rect = trigger.current.getBoundingClientRect()
    const height = Math.min(list.current.scrollHeight, MAX_HEIGHT)
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    const flip = below < height && above > below
    setPlace({
      left: rect.left,
      width: Math.max(rect.width, 96),
      top: flip ? undefined : rect.bottom + 6,
      bottom: flip ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight: Math.max(96, Math.min(MAX_HEIGHT, flip ? above : below)),
    })
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (!list.current?.contains(e.target) && !trigger.current?.contains(e.target)) close()
    }
    const onScroll = (e) => {
      if (!list.current?.contains(e.target)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, id])

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        show()
      }
      return
    }
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, last))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') choose(active)
    else if (e.key === 'Escape') e.stopPropagation()
    else if (e.key === 'Tab') {
      close()
      return
    } else if (e.key.length === 1) {
      const key = e.key.toLowerCase()
      const order = [...options.keys()].map((_, n) => (active + 1 + n) % options.length)
      const match = order.find((i) => String(options[i].label).toLowerCase().startsWith(key))
      if (match !== undefined) setActive(match)
    } else return
    e.preventDefault()
    if (e.key === 'Escape') {
      close()
      trigger.current?.focus()
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-neutral-950 text-left font-medium text-neutral-100 outline-none transition-colors hover:border-neutral-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
          open ? 'border-neutral-400' : 'border-neutral-700'
        } ${sizes[size]} ${className}`}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <span className={`text-neutral-400 transition-transform duration-150 ${open ? '' : 'rotate-180'}`}>
          <ToolIcon name="chevron" size={size === 'sm' ? 13 : 15} />
        </span>
      </button>
      {open &&
        createPortal(
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={ariaLabel}
            onPointerDown={(e) => e.preventDefault()}
            style={place ?? { top: 0, left: 0, visibility: 'hidden' }}
            className="fixed z-[70] overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-1 shadow-2xl shadow-black/50"
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg transition-colors ${optionSizes[size]} ${
                  i === active ? 'bg-neutral-800 text-white' : 'text-neutral-300'
                } ${i === selected ? 'font-semibold text-white' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                {i === selected && (
                  <span className="text-emerald-400">
                    <ToolIcon name="check" size={size === 'sm' ? 13 : 15} />
                  </span>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
