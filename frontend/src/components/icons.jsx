const paths = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  next: 'M6 5l9 7-9 7V5zM17 5h2v14h-2z',
  back: 'M18 5l-9 7 9 7V5zM7 5H5v14h2z',
  end: 'M4 5l8 7-8 7V5zM12 5l8 7-8 7V5z',
  reset: 'M12 5V2L7 6l5 4V7a5 5 0 11-5 5H5a7 7 0 107-7z',
}

export default function Icon({ name, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
