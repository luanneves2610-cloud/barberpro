import * as React from 'react'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' }

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={[
          'rounded-full object-cover ring-1 ring-zinc-700',
          sizeClasses[size],
          className,
        ].join(' ')}
      />
    )
  }

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full bg-amber-500 font-semibold text-zinc-950 ring-1 ring-zinc-700',
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {getInitials(name)}
    </span>
  )
}
