import React from 'react'

interface ModuleHeroProps {
  greeting?: string
  title: string
  mission?: string
  className?: string
}

export function ModuleHero({ greeting, title, mission, className = '' }: ModuleHeroProps) {
  return (
    <div className={`hero-banner ${className}`}>
      {greeting && (
        <span className="hero-greeting">{greeting}</span>
      )}
      <h1 className="hero-title">{title}</h1>
      {mission && (
        <p className="hero-subtitle">{mission}</p>
      )}
    </div>
  )
}
