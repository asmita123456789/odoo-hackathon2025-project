Demo Link: https://app.screencastify.com/watch/I8Z5jROOhYyriQxTxZF9
# StackIt - Q&A Platform

A full-stack Q&A application built with React, Node.js, and MongoDB, inspired by Stack Overflow.

## 🚀 Features

### Core Features
- **User Authentication**: Register, login, and profile management
- **Questions & Answers**: Post questions, provide answers, and vote on content
- **Rich Text Editor**: React Quill integration for formatted content
- **Tag System**: Categorize questions with tags and search by tags
- **Voting System**: Upvote/downvote questions and answers
- **Accept Answers**: Question owners can mark answers as accepted
- **Notifications**: Real-time notifications for various activities
- **Search & Filters**: Search questions and filter by newest, most voted, unanswered
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### User Roles
- **Guest**: View questions and answers
- **User**: Post questions/answers, vote, receive notifications
- **Admin**: Moderate content, edit/delete any question/answer

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Quill** for rich text editing
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection

## 📁 Project Structure

```
stackit/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stackit
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
# Copy config.env.example to config.env and update values
cp config.env.example config.env

# Update config.env with your MongoDB URI and JWT secret
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stackit
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Questions
- `GET /api/questions` - Get all questions (with filters)
- `GET /api/questions/:id` - Get specific question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question
- `POST /api/questions/:id/answers` - Add answer to question

### Answers
- `POST /api/answers/:id/vote` - Vote on answer
- `PATCH /api/answers/:id/accept` - Accept answer
- `PATCH /api/answers/:id/unaccept` - Unaccept answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer

### Users
- `GET /api/users/questions` - Get user's questions
- `GET /api/users/answers` - Get user's answers
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:id` - Get user profile

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/popular` - Get popular tags
- `GET /api/tags/:tag` - Get questions by tag
- `GET /api/tags/search/:query` - Search tags

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `DELETE /api/notifications/:id` - Delete notification

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stackit
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🎨 Features in Detail

### Rich Text Editor
- Bold, italic, underline, strikethrough
- Ordered and unordered lists
- Text alignment (left, center, right)
- Hyperlink insertion
- Image upload support
- Color and background options

### Voting System
- Users can upvote/downvote questions and answers
- Cannot vote on own content
- Real-time vote updates
- Vote history tracking

### Tag System
- Add up to 5 tags per question
- Tag suggestions from existing tags
- Search and filter by tags
- Tag statistics and popularity

### Notifications
- New answer notifications
- Vote notifications
- Answer acceptance notifications
- Mention notifications
- Real-time unread count

### Search & Filters
- Full-text search across questions
- Filter by newest, most voted, unanswered
- Tag-based filtering
- Pagination support

## 🚀 Deployment

### Backend Deployment (Heroku)
```bash
# Add to package.json
"scripts": {
  "start": "node server.js"
}

# Deploy to Heroku
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

### Frontend Deployment (Vercel)
```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Stack Overflow
- Built with modern web technologies
- Designed for learning and collaboration

## 📞 Support

If you have any questions or need help, please open an issue on GitHub. 
