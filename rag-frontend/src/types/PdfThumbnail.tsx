export type GlobalThumbnailOptions = {
    width?: number;
    height?: number;
}

export type ThumbnailCache = {
    [key: string]: string;
}

export type PdfThumbnailProps = {
    url: string;
    pageNumber: string;
}
