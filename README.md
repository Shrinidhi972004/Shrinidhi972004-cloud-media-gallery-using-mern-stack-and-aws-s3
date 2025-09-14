# Cloud Media Gallery

A production-ready cloud-based media gallery application built with the MERN stack (MongoDB, Express, React, Node.js) and AWS S3 for storage. This application allows users to securely upload, view, and manage their images and videos in a responsive and intuitive interface.

![Cloud Media Gallery Screenshot](https://via.placeholder.com/800x450.png?text=Cloud+Media+Gallery)

## 🌟 Features

- **Secure User Authentication**: Register and login with JWT authentication
- **Cloud Storage**: Store your media files securely on AWS S3
- **Folder Organization**: Organize your media files in custom folders
- **Media Management**:
  - Upload images and videos with drag-and-drop support
  - View media files in grid or list view
  - Filter media by upload time (day, month, year)
  - Preview media in a full-screen lightbox
  - Rename and update existing files
  - Select and delete multiple files
  - Folder navigation and management
- **Production Security**: Helmet security headers, rate limiting, input validation
- **Performance Optimized**: Compression, caching, optimized builds
- **Error Handling**: Graceful error boundaries and structured error handling
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technologies Used

- **Frontend**:
  - React.js 18
  - Tailwind CSS for styling
  - React Toastify for notifications
  - Lucide React for icons
  - Error Boundaries for graceful error handling

- **Backend**:
  - Node.js with Express
  - MongoDB Atlas with Mongoose
  - JWT for authentication with bcrypt
  - AWS SDK v3 for S3 integration
  - Security middleware (Helmet, Rate Limiting, CORS)
  - Input validation with express-validator
  - Compression and performance optimization

- **Cloud & Infrastructure**:
  - AWS S3 for file storage
  - MongoDB Atlas for database
  - Docker support with multi-stage builds
  - Nginx reverse proxy configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- An [AWS account](https://aws.amazon.com/) with S3 access
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Shrinidhi972004/cloud-media-gallery-using-mern-stack-and-aws-s3.git
cd cloud-media-gallery-using-mern-stack-and-aws-s3
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gallery?retryWrites=true&w=majority

# JWT Secret (MUST be at least 32 characters for security)
JWT_SECRET=your_super_secure_64_character_jwt_secret_key_for_production_use

# AWS S3 Configuration
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Server Configuration
PORT=5002
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:9000
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5002
GENERATE_SOURCEMAP=false
```

### 4. Configure AWS S3

1. Create an S3 bucket in your AWS account
2. Configure your AWS credentials (access key and secret key)
3. Apply the following bucket policy for public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Enable CORS on your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:9000", "http://localhost:5002"],
    "ExposeHeaders": []
  }
]
```

### 5. Start the application

**Start the backend server:**
```bash
cd backend
node app.js
# Backend will run on http://localhost:5002
```

**In a new terminal, start the frontend:**
```bash
cd frontend
npm start
# Frontend will run on http://localhost:9000
```

The application will be available at **http://localhost:9000**

## 🐳 Docker Deployment

For production deployment using Docker:

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

This will:
- Build Docker images for frontend and backend
- Start services with Docker Compose
- Configure Nginx reverse proxy
- Perform health checks

**Access the dockerized application:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5002

## 📱 Usage

### User Registration & Login

1. Access the application at **http://localhost:9000**
2. Choose "Create Account" to register a new user
3. Use email/password authentication
4. JWT tokens are used for secure session management

### Managing Media

1. **Upload Files**:
   - Click the "Upload" button in the top bar
   - Alternatively, drag and drop files into the upload area
   - Supports images and videos with automatic type detection

2. **Folder Management**:
   - Create and navigate through custom folders
   - Organize your media files hierarchically
   - Breadcrumb navigation for easy folder traversal

3. **View Options**:
   - Toggle between grid and list views using the view buttons
   - Filter by "All", "Day", "Month", or "Year" using the filter buttons
   - Full-screen lightbox preview for images and videos

4. **File Operations**:
   - Click on a file to view it in the lightbox
   - Rename files with the rename function
   - Select multiple files using checkboxes and delete them
   - Update/replace existing files

## 🧑‍💻 Development

### Backend API Endpoints (Port 5002)

**Base URL**: `http://localhost:5002/api`

- **Authentication**:
  - `POST /auth/register` - Register a new user
  - `POST /auth/login` - Login a user

- **Gallery**:
  - `POST /gallery/upload` - Upload a new file
  - `GET /gallery/files` - Fetch user files (with folder filtering)
  - `DELETE /gallery/delete/:fileId` - Delete a single file
  - `POST /gallery/delete-multiple` - Delete multiple files
  - `PUT /gallery/rename/:fileId` - Rename a file

### Frontend Development (Port 9000)

**Development URL**: `http://localhost:9000`

- React 18 with modern hooks and functional components
- Tailwind CSS for responsive styling
- Error boundaries for graceful error handling
- Toast notifications for user feedback

### Production Features

#### 🔒 Security
- **Helmet**: Security headers protection
- **Rate Limiting**: 100 requests/15min, 20 uploads/15min per IP
- **Input Validation**: Server-side validation for all endpoints
- **CORS Protection**: Configured origins and methods
- **JWT Security**: 64-character secret key requirement
- **Password Hashing**: bcrypt with secure salt rounds

#### ⚡ Performance
- **Compression**: Gzip compression for responses
- **AWS SDK v3**: Latest SDK for better performance
- **Optimized Builds**: Production-ready React builds
- **Connection Pooling**: MongoDB connection optimization
- **Caching Headers**: Proper cache control

#### 🛡️ Error Handling
- **Global Error Middleware**: Structured error responses
- **React Error Boundaries**: Graceful frontend error handling
- **Environment Validation**: Startup validation for required variables
- **Graceful Degradation**: Fallback UI components

### Project Structure

```
.
├── backend/                 # Backend server (Node.js/Express)
│   ├── app.js              # Main Express application
│   ├── config/             # Configuration files
│   │   ├── awsConfig.js    # AWS S3 configuration
│   │   └── validateEnv.js  # Environment validation
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Express middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validation.js   # Input validation
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Image.js
│   │   └── Video.js
│   └── routes/             # API routes
│       ├── auth.js
│       └── gallery.js
├── frontend/               # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       │   ├── Dashboard.js
│       │   ├── Login.js
│       │   ├── Register.js
│       │   └── ErrorBoundary.js
│       └── App.js          # Main App component
├── docker-compose.yml      # Docker orchestration
├── deploy.sh              # Production deployment script
├── Dockerfile.backend     # Backend container config
├── Dockerfile.frontend    # Frontend container config
└── nginx.conf             # Nginx reverse proxy config
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **Security Headers**: Helmet.js security middleware
- **CORS Configuration**: Restricted cross-origin requests
- **Environment Validation**: Required variables checked at startup

## 🚀 Performance Optimizations

- **AWS SDK v3**: Latest SDK with improved performance
- **Compression**: Gzip compression for all responses
- **Connection Pooling**: Optimized MongoDB connections
- **Caching**: Proper cache headers for static assets
- **Minified Builds**: Production-optimized React builds
- **Error Boundaries**: Prevent cascade failures

## 🔧 Troubleshooting

### Common Issues

1. **JWT_SECRET Error**:
   ```
   ❌ JWT_SECRET must be at least 32 characters long for security
   ```
   **Solution**: Update your `.env` file with a 32+ character JWT secret

2. **MongoDB Connection Failed**:
   ```
   ❌ MongoDB Atlas Connection Failed
   ```
   **Solution**: Check your MongoDB URI and network access settings

3. **AWS S3 Upload Errors**:
   ```
   Error uploading file: AccessDenied
   ```
   **Solution**: Verify AWS credentials and S3 bucket permissions

4. **Port Already in Use**:
   ```
   Error: listen EADDRINUSE: address already in use :::5002
   ```
   **Solution**: Kill the process using the port or change the PORT in `.env`

5. **CORS Errors**:
   ```
   Access to fetch at 'http://localhost:5002' blocked by CORS policy
   ```
   **Solution**: Ensure frontend URL matches FRONTEND_URL in backend `.env`

### Development Tips

- Use `npm run dev` for auto-restart during development
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Verify environment variables are properly loaded

## 🌐 Production Deployment

### Environment Variables for Production

**Backend** (`.env`):
```env
NODE_ENV=production
PORT=5002
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_production_jwt_secret_64_characters_minimum_length
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket
AWS_REGION=us-east-1
FRONTEND_URL=https://yourdomain.com
```

**Frontend** (`.env`):
```env
REACT_APP_API_URL=https://api.yourdomain.com
GENERATE_SOURCEMAP=false
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] AWS S3 bucket created and configured
- [ ] MongoDB Atlas database set up
- [ ] JWT secret is 32+ characters
- [ ] CORS origins updated for production
- [ ] SSL certificates configured
- [ ] Domain names configured
- [ ] Health checks implemented

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add error handling for new features
- Update documentation for new endpoints
- Test on both development and production builds
- Ensure security best practices are followed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Contact

**Developer**: Shrinidhi Upadhyaya  
**Email**: shrinidhiupadhyaya00@gmail.com  
**GitHub**: [@Shrinidhi972004](https://github.com/Shrinidhi972004)

**Project Repository**: [https://github.com/Shrinidhi972004/cloud-media-gallery-using-mern-stack-and-aws-s3](https://github.com/Shrinidhi972004/cloud-media-gallery-using-mern-stack-and-aws-s3)

### Getting Help

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Submit an enhancement issue
- 📖 **Documentation**: Check the README and code comments
- 💬 **Questions**: Use GitHub Discussions

---

## 🏆 Project Status

✅ **Production Ready**  
✅ **Security Hardened**  
✅ **Performance Optimized**  
✅ **Docker Support**  
✅ **Comprehensive Documentation**

Built with ❤️ by Shrinidhi Upadhyaya

---

*Last Updated: September 2025*
