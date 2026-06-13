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
    <div
      className="absolute inset-0 w-full h-full cursor-pointer group"
      onClick={() => setIsLoaded(true)}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={false}
      />
      <div className="absolute inset-0 bg-background/20 group-hover:bg-background/40 transition-colors duration-300 flex items-center justify-center">
        <div className="w-20 h-20 bg-accent/90 rounded-full flex items-center justify-center text-accent-foreground shadow-xl transform transition-transform duration-300 group-hover:scale-110">
          <Play className="w-8 h-8 fill-current" />
        </div>
      </div>
    </div>
  );
}
