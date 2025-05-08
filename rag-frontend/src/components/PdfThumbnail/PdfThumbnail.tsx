import { ThumbnailCache, PdfThumbnailProps } from "../../types/PdfThumbnail";
import { useState, useEffect, useMemo } from "react";
import { getThumbnail } from "./PdfThumbnailUtiles";

const thumbnailCache: ThumbnailCache = {};

const PdfThumbnail = ({ url, pageNumber }: PdfThumbnailProps) => {
  const [thumbnail, setThumbnail] = useState<string>('');

  const cacheKey = useMemo(() => `${url}-${pageNumber}`, [url, pageNumber]);

  useEffect(() => {
    const fetchThumbnail = async () => {
      if (thumbnailCache[cacheKey]) {
        setThumbnail(thumbnailCache[cacheKey]);
        return;
      }
      const pageNum = parseInt(pageNumber, 10) || 1;
      const dataUrl = await getThumbnail(url, pageNum);
      thumbnailCache[cacheKey] = dataUrl;
      setThumbnail(dataUrl);
    };

    fetchThumbnail();
  }, [cacheKey, pageNumber, url]);

  if (!thumbnail) {
    return <div>Loading...</div>;
  }

  return <img src={thumbnail} alt={`Page ${pageNumber} thumbnail`} style={{ width: '600px', height: 'auto' }} />;
};

export default PdfThumbnail;
