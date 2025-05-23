// Mock AWS SDK
const mockS3GetObject = jest.fn();
const mockBedrockInvokeModel = jest.fn();
const mockDynamoDbPut = jest.fn();

jest.mock('aws-sdk', () => ({
    S3: jest.fn(() => ({
        getObject: mockS3GetObject
    })),
    BedrockRuntime: jest.fn(() => ({
        invokeModel: mockBedrockInvokeModel
    })),
    DynamoDB: {
        DocumentClient: jest.fn(() => ({
            put: mockDynamoDbPut
        }))
    }
}));

// Mock pdf-parse at the top level
jest.mock('pdf-parse', () => {
    return jest.fn(() => Promise.resolve({
        text: 'Test utility bill content\nAccount: ACC123456\nAmount: £89.50\nkWh: 450'
    }));
});

const { handler } = require('./index');

describe('Bill Processor Lambda', () => {
    beforeEach(() => {
        // Setup default mock responses
        mockS3GetObject.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                Body: Buffer.from('%PDF-1.4 sample pdf content')
            })
        });
        
        mockBedrockInvokeModel.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                body: JSON.stringify({
                    content: [{
                        text: JSON.stringify({
                            utilityType: 'electricity',
                            supplier: 'Test Energy Company',
                            billDate: '2024-01-15',
                            billingPeriod: {
                                from: '2023-12-15',
                                to: '2024-01-15'
                            },
                            units: {
                                consumed: 450,
                                unit: 'kWh'
                            },
                            costs: {
                                totalAmount: 89.50,
                                standingCharge: 25.00,
                                unitRate: 0.15,
                                vatAmount: 4.48
                            },
                            tariff: 'Standard Variable',
                            meterReading: {
                                previous: 12345,
                                current: 12795
                            },
                            accountNumber: 'ACC123456',
                            address: '123 Test Street, Test City'
                        })
                    }]
                })
            })
        });

        mockDynamoDbPut.mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
        });

        process.env.BILLS_TABLE_NAME = 'test-bills-table';
        process.env.AWS_REGION = 'us-east-1';
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.BILLS_TABLE_NAME;
        delete process.env.AWS_REGION;
    });

    describe('handler', () => {
        it('should process S3 ObjectCreated event successfully', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            const result = await handler(event);

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('Processing completed');
        });

        it('should handle multiple records in event', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/gas/bill1.pdf' }
                        }
                    },
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user456/bills/water/bill2.pdf' }
                        }
                    }
                ]
            };

            const result = await handler(event);

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('Processing completed');
        });

        it('should ignore non-ObjectCreated events', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'ObjectRemoved:Delete',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            const result = await handler(event);

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('Processing completed');
        });

        it('should handle errors and re-throw them', async () => {
            mockS3GetObject.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Access Denied'))
            });

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await expect(handler(event)).rejects.toThrow('Access Denied');
        });
    });

    describe('processBillUpload', () => {
        it('should skip non-PDF files', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/image.jpg' }
                        }
                    }
                ]
            };

            const result = await handler(event);

            expect(result.statusCode).toBe(200);
            expect(consoleSpy).toHaveBeenCalledWith('Skipping non-PDF file');
            
            consoleSpy.mockRestore();
        });

        it('should handle PDF files with different extensions', async () => {
            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.PDF' }
                        }
                    }
                ]
            };

            const result = await handler(event);

            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('Processing completed');
        });
    });

    describe('Bedrock integration', () => {
        it('should handle Bedrock response parsing errors', async () => {
            mockBedrockInvokeModel.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    body: JSON.stringify({
                        content: [{
                            text: 'Invalid JSON response from Bedrock'
                        }]
                    })
                })
            });

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await expect(handler(event)).rejects.toThrow('Invalid JSON response from Bedrock');
        });

        it('should use correct Bedrock model parameters', async () => {
            mockBedrockInvokeModel.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    body: JSON.stringify({
                        content: [{
                            text: JSON.stringify({
                                utilityType: 'electricity',
                                supplier: 'Test Company'
                            })
                        }]
                    })
                })
            });

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await handler(event);

            expect(mockBedrockInvokeModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
                    contentType: 'application/json',
                    accept: 'application/json'
                })
            );
        });
    });

    describe('DynamoDB storage', () => {
        it('should store bill data with correct structure', async () => {

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await handler(event);

            expect(mockDynamoDbPut).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: 'test-bills-table',
                    Item: expect.objectContaining({
                        userId: 'user123',
                        s3Key: 'users/user123/bills/electricity/test-bill.pdf',
                        fileName: 'test-bill.pdf',
                        utilityType: 'electricity',
                        processingStatus: 'completed',
                        extractedData: expect.any(Object),
                        rawText: expect.any(String),
                        uploadDate: expect.any(String),
                        billId: expect.any(String)
                    })
                })
            );
        });

        it('should generate unique bill IDs', async () => {

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await handler(event);
            await handler(event);

            const calls = mockDynamoDbPut.mock.calls;
            expect(calls).toHaveLength(2);
            expect(calls[0][0].Item.billId).not.toBe(calls[1][0].Item.billId);
        });

        it('should handle DynamoDB errors', async () => {
            mockDynamoDbPut.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('DynamoDB connection failed'))
            });

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/user123/bills/electricity/test-bill.pdf' }
                        }
                    }
                ]
            };

            await expect(handler(event)).rejects.toThrow('DynamoDB connection failed');
        });
    });

    describe('S3 key parsing', () => {
        it('should correctly parse S3 key components', async () => {

            const event = {
                Records: [
                    {
                        eventName: 'ObjectCreated:Put',
                        s3: {
                            bucket: { name: 'test-bucket' },
                            object: { key: 'users/testuser456/bills/water/my-water-bill-jan.pdf' }
                        }
                    }
                ]
            };

            await handler(event);

            const storedItem = mockDynamoDbPut.mock.calls[0][0].Item;
            expect(storedItem.userId).toBe('testuser456');
            expect(storedItem.utilityType).toBe('water');
            expect(storedItem.fileName).toBe('my-water-bill-jan.pdf');
        });
    });
});