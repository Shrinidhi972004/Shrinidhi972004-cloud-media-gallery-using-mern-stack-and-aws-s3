const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const corsConfiguration = {
    CORSRules: [
        {
            AllowedOrigins: [
                'http://localhost:3000',
                'http://localhost:3001',
                process.env.FRONTEND_URL || 'http://localhost:3000'
            ].filter(Boolean),
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedHeaders: [
                'Content-Type',
                'Content-MD5',
                'Content-Disposition',
                'x-amz-meta-*',
                'x-amz-server-side-encryption',
                'x-amz-server-side-encryption-aws-kms-key-id',
                'x-amz-server-side-encryption-context',
                'Authorization',
                'x-amz-date',
                'x-amz-content-sha256'
            ],
            ExposeHeaders: [
                'ETag',
                'x-amz-server-side-encryption',
                'x-amz-request-id',
                'x-amz-id-2'
            ],
            MaxAgeSeconds: 3000
        }
    ]
};

async function setupCORS() {
    try {
        const command = new PutBucketCorsCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            CORSConfiguration: corsConfiguration
        });

        await s3Client.send(command);
        console.log('✅ CORS configuration updated successfully for bucket:', process.env.AWS_BUCKET_NAME);
        console.log('📝 CORS rules applied:');
        console.log('   - Allowed Origins:', corsConfiguration.CORSRules[0].AllowedOrigins);
        console.log('   - Allowed Methods:', corsConfiguration.CORSRules[0].AllowedMethods);
        console.log('   - Cache Max Age:', corsConfiguration.CORSRules[0].MaxAgeSeconds, 'seconds');
        
    } catch (error) {
        console.error('❌ Error setting up CORS:', error.message);
        process.exit(1);
    }
}

// Run the setup
if (require.main === module) {
    setupCORS();
}

module.exports = setupCORS;
