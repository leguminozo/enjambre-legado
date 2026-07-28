'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface YoutubeLiteProps {
  videoId: string;
  title?: string;
}

export function YoutubeLite({ videoId, title = 'Video' }: YoutubeLiteProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (isLoaded) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
      />
    );
  }

  return (
    <button
      type="button"
      className="absolute inset-0 w-full h-full cursor-pointer group text-left border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      onClick={() => setIsLoaded(true)}
      aria-label={`Reproducir video: ${title}`}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />
      <div className="absolute inset-0 bg-background/20 group-hover:bg-background/40 transition-colors duration-300 flex items-center justify-center">
        <span className="inline-flex min-h-11 min-w-11 h-20 w-20 bg-accent/90 rounded-full items-center justify-center text-accent-foreground shadow-xl transform transition-transform duration-300 group-hover:scale-110">
          <Play className="w-8 h-8 fill-current" aria-hidden />
        </span>
      </div>
    </button>
  );
}
