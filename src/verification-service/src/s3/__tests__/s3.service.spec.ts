import { S3Service } from '../s3.service';
import { InternalServerErrorException } from '@nestjs/common';

const mockPutObject = jest.fn();
const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();

jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      putObject: mockPutObject,
      bucketExists: mockBucketExists,
      makeBucket: mockMakeBucket,
    })),
  };
});

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.MINIO_BUCKET = 'test-bucket';
    process.env.MINIO_ENDPOINT = 'localhost';
    process.env.MINIO_PORT = '9000';
    process.env.MINIO_USE_SSL = 'false';
    service = new S3Service();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload file and return url', async () => {
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const file = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 4,
    } as any;

    const url = await service.uploadFile(file);
    expect(url).toMatch(/http:\/\/localhost:9000\/test-bucket\/\d+-test\.png/);
    expect(mockPutObject).toHaveBeenCalled();
  });

  it('should throw if upload fails', async () => {
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(new Error('fail')));
    const file = {
      originalname: 'fail.png',
      buffer: Buffer.from('fail'),
      size: 4,
    } as any;

    await expect(service.uploadFile(file)).rejects.toThrow(InternalServerErrorException);
  });

  it('should initialize bucket if not exists', async () => {
    mockBucketExists.mockImplementation((bucket, cb) => cb(null, false));
    mockMakeBucket.mockImplementation((bucket, region, cb) => cb(null));
    const service = new S3Service();
    await service.initializeBucket();
    expect(mockBucketExists).toHaveBeenCalled();
    expect(mockMakeBucket).toHaveBeenCalled();
  });

  it('should not create bucket if already exists', async () => {
    mockBucketExists.mockImplementation((bucket, cb) => cb(null, true));
    mockMakeBucket.mockImplementation((bucket, region, cb) => cb(null));
    const service = new S3Service();
    jest.clearAllMocks();
    await service.initializeBucket();
    expect(mockBucketExists).toHaveBeenCalled();
    expect(mockMakeBucket).not.toHaveBeenCalled();
  });

  it('should handle error in initializeBucket', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBucketExists.mockImplementation((bucket, cb) => cb(new Error('fail'), false));
    const service = new S3Service();
    await service.initializeBucket();
    expect(spy).toHaveBeenCalledWith('Error creating bucket:', expect.any(Error));
    spy.mockRestore();
  });

  it('should use https if MINIO_USE_SSL is true', async () => {
    process.env.MINIO_USE_SSL = 'true';
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const file = {
      originalname: 'secure.png',
      buffer: Buffer.from('secure'),
      size: 6,
    } as any;
    const service = new S3Service();
    const url = await service.uploadFile(file);
    expect(url.startsWith('https://')).toBe(true);
  });

  it('should use custom endpoint and port', async () => {
    process.env.MINIO_ENDPOINT = 'customhost';
    process.env.MINIO_PORT = '1234';
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const file = {
      originalname: 'custom.png',
      buffer: Buffer.from('custom'),
      size: 6,
    } as any;
    const service = new S3Service();
    const url = await service.uploadFile(file);
    expect(url).toContain('customhost:1234');
  });

  it('should handle error in makeBucket', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBucketExists.mockImplementation((bucket, cb) => cb(null, false));
    mockMakeBucket.mockImplementation((bucket, region, cb) => cb(new Error('fail')));
    const service = new S3Service();
    await service.initializeBucket();
    expect(spy).toHaveBeenCalledWith('Error creating bucket:', expect.any(Error));
    spy.mockRestore();
  });

  it('should use default bucket if env not set', async () => {
    delete process.env.MINIO_BUCKET;
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const service = new S3Service();
    const file = { originalname: 'test.png', buffer: Buffer.from('test'), size: 4 } as any;
    const url = await service.uploadFile(file);
    expect(url).toContain('/uploads/');
  });

  it('should use default endpoint and port if env not set', async () => {
    delete process.env.MINIO_ENDPOINT;
    delete process.env.MINIO_PORT;
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const service = new S3Service();
    const file = { originalname: 'test.png', buffer: Buffer.from('test'), size: 4 } as any;
    const url = await service.uploadFile(file);
    expect(url).toContain('localhost:9000');
  });

  it('should handle uploadFile with undefined buffer gracefully', async () => {
    mockPutObject.mockImplementation((bucket, filename, buffer, length, cb) => cb(null, 'etag'));
    const file = { originalname: 'test.png', buffer: undefined, size: 0 } as any;
    await expect(service.uploadFile(file)).rejects.toThrow();
  });
});