import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Minio from 'minio';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class S3Service {
  private minioClient: Minio.Client;
  private bucketName: string = process.env.MINIO_BUCKET || 'uploads';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'false',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    this.initializeBucket();
  }

  public async initializeBucket(): Promise<void> {
    try {
      const exists: boolean = await new Promise((resolve, reject) => {
        (this.minioClient.bucketExists as any)(
          this.bucketName,
          (err: Error, exists: boolean) => {
            if (err) return reject(err);
            resolve(exists);
          },
        );
      });
      if (!exists) {
        await new Promise<void>((resolve, reject) => {
          (this.minioClient.makeBucket as any)(
            this.bucketName,
            'us-east-1',
            (err: Error) => {
              if (err) return reject(err);
              resolve();
            },
          );
        });
        console.log(`Bucket ${this.bucketName} created successfully`);
      }
    } catch (err) {
      console.error('Error creating bucket:', err);
    }
  }

  async uploadFile(file: MulterFile): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    try {
      await new Promise<void>((resolve, reject) => {
        (this.minioClient.putObject as any)(
          this.bucketName,
          filename,
          file.buffer,
          file.buffer.length,
          (err: Error, etag: string) => {
            if (err) return reject(err);
            resolve();
          },
        );
      });
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = process.env.MINIO_PORT || '9000';
      return `${protocol}://${endpoint}:${port}/${this.bucketName}/${filename}`;
    } catch (err) {
      throw new InternalServerErrorException('Cannot upload file to Minio');
    }
  }
}
