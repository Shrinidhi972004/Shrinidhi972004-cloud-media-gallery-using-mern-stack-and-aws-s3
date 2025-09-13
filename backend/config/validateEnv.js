const validateEnvironment = () => {
    const requiredEnvVars = [
        'MONGO_URI',
        'JWT_SECRET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_BUCKET_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\n📝 Please create a .env file with the required variables.');
        console.error('   See .env.example for reference.');
        process.exit(1);
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long for security.');
        process.exit(1);
    }

    // Validate MongoDB URI format
    if (!process.env.MONGO_URI.startsWith('mongodb')) {
        console.error('❌ MONGO_URI must be a valid MongoDB connection string.');
        process.exit(1);
    }

    console.log('✅ Environment validation passed');
};

module.exports = validateEnvironment;
