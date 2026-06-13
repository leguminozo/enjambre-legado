import { useState, useEffect, useRef, useCallback } from 'react';

interface ChartDimensions {
  width: number;
  height: number;
  ref: React.RefCallback<HTMLElement>;
  hasDimensions: boolean;
}

export function useChartDimensions(): ChartDimensions {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    nodeRef.current = node;

    if (node) {
      const updateSize = () => {
        const { width, height } = node.getBoundingClientRect();
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      };
      updateSize();

      observerRef.current = new ResizeObserver(updateSize);
      observerRef.current.observe(node);
    } else {
      setDimensions({ width: 0, height: 0 });
    }
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    ref,
    hasDimensions: dimensions.width > 0 && dimensions.height > 0,
  };
}
