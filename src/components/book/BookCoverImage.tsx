'use client';

import React, { useState, useEffect } from 'react';

interface BookCoverImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
}

const DEFAULT_PLACEHOLDER = '/placeholder-book.svg';

export const BookCoverImage: React.FC<BookCoverImageProps> = ({
  src,
  alt,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
      loading="lazy"
      {...props}
    />
  );
};
