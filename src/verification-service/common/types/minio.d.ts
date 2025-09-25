declare module 'minio' {
  export interface ClientOptions {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
  }
  
  export class Client {
    constructor(options: ClientOptions);
    bucketExists(bucketName: string, callback: (err: Error | null, exists?: boolean) => void): void;
    makeBucket(bucketName: string, region: string, callback: (err: Error | null) => void): void;
    putObject(bucketName: string, objectName: string, buffer: Buffer, callback: (err: Error | null, etag?: string) => void): void;
  }
} 