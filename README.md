# Cloud Media Gallery

A modern cloud-based media gallery application built with the MERN stack (MongoDB, Express, React, Node.js) and AWS S3 for storage. This application allows users to securely upload, view, and manage their images and videos in a responsive and intuitive interface.

![Cloud Media Gallery Screenshot](https://via.placeholder.com/800x450.png?text=Cloud+Media+Gallery)

## 🌟 Features

- **Secure User Authentication**: Register and login with email/password or Google Sign-in
- **Cloud Storage**: Store your media files securely on AWS S3
- **Media Management**:
  - Upload images and videos with drag-and-drop support
  - View media files in grid or list view
  - Filter media by upload time (day, month, year)
  - Preview media in a full-screen lightbox
  - Update existing files
  - Select and delete multiple files
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technologies Used

- **Frontend**:
  - React.js
  - Tailwind CSS for styling
  - React Toastify for notifications
  - Lucide React for icons

- **Backend**:
  - Node.js with Express
  - MongoDB for database
  - JWT for authentication
  - AWS SDK for S3 integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- An [AWS account](https://aws.amazon.com/) with S3 access

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
AWS_BUCKET_NAME=image-video-gallery-part69
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

### 4. Configure AWS S3

1. Create an S3 bucket named `image-video-gallery-part69` in your AWS account
2. Apply the following bucket policy to allow public read access (modify as needed for your security requirements):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::image-video-gallery-part69/*"
    }
  ]
}
```

3. Enable CORS on your S3 bucket with the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 5. Start the application

Start the backend server:
```bash
cd backend
npm start
```

In a new terminal, start the frontend development server:
```bash
cd frontend
npm start
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### User Registration & Login

1. Access the application at http://localhost:3000
2. Choose "Create Account" to register or "Sign In" to login
3. You can use email/password or the Google Sign-in option

### Managing Media

1. **Upload Files**:
   - Click the "Upload" button in the top bar
   - Alternatively, drag and drop files into the upload area

2. **View Options**:
   - Toggle between grid and list views using the view buttons
   - Filter by "All", "Day", "Month", or "Year" using the filter buttons

3. **File Operations**:
   - Click on a file to view it in the lightbox
   - Use the "Update" button to replace an existing file
   - Select multiple files using the checkboxes and delete them

## 🧑‍💻 Development

### Backend API Endpoints

- **Authentication**:
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Login a user
  - `GET /api/auth/user` - Get current user info

- **Gallery**:
  - `POST /api/gallery/upload` - Upload a new file
  - `GET /api/gallery/files` - Fetch all user files
  - `PUT /api/gallery/update/:fileId` - Update an existing file
  - `POST /api/gallery/delete-multiple` - Delete multiple files
  - `PUT /api/gallery/rename/:fileId` - Rename a file

### Project Structure

```
.
├── backend/                 # Backend server code
│   ├── app.js              # Express app entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Express middlewares
│   ├── models/             # MongoDB models
│   └── routes/             # API routes
└── frontend/               # React frontend
    ├── public/             # Static files
    └── src/                # React source code
        ├── components/     # React components
        └── App.js          # Main App component
```

## 🔒 Security

- User passwords are hashed before storing in the database
- JWT authentication is used to secure API endpoints
- AWS S3 access is controlled via IAM policies

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Shrinidhi - your.email@example.com

Project Link: [https://github.com/Shrinidhi972004/cloud-media-gallery-using-mern-stack-and-aws-s3](https://github.com/Shrinidhi972004/cloud-media-gallery-using-mern-stack-and-aws-s3)

---

Built with ❤️ by Shrinidhi
