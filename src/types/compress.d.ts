declare module 'compress.js' {
  interface CompressOptions {
    size?: number;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    SUFFIX?: string;
  }

  interface CompressFile {
    compress: (file: string | File | Blob) => Promise<File | Blob>;
  }

  const compress: (options?: CompressOptions) => CompressFile;
  export default compress;
}