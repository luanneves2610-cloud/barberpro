import * as React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-zinc-800 bg-zinc-900 p-6',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={['mb-4 flex items-center justify-between', className].join(' ')}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h3 className={['text-sm font-medium text-zinc-400', className].join(' ')}>{children}</h3>
}

export function CardValue({ children, className = '' }: CardProps) {
  return <p className={['text-2xl font-bold text-zinc-100', className].join(' ')}>{children}</p>
}
