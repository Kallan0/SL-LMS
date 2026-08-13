# Sign Language Learning Management System (LMS)

A fully functional, responsive frontend for a Sign Language Learning Management System built with modern web technologies.

## 🎯 Features

### ✅ Authentication & Security
- JWT-based authentication with secure token storage
- Automatic logout after 10 minutes of inactivity
- Form validation with error handling
- Protected routes for authenticated users

### 📚 Lesson Management
- Browse lessons with filtering and search
- Detailed lesson views with step-by-step instructions
- Practice exercises with progress tracking
- Video player integration (placeholder)
- Tips and explanations for each step

### 🧪 Quiz System
- Interactive quizzes with multiple question types
- Real-time progress tracking
- Score calculation and pass/fail determination (70% threshold)
- XP rewards for passing quizzes
- Retry functionality

### 📊 Progress Tracking
- Real-time statistics (lessons, streak, XP, accuracy)
- Learning activity charts
- Achievement system
- Leaderboard with user rankings
- Personal progress dashboard

### 🎨 User Experience
- Dark theme optimized for learning
- Smooth animations with Framer Motion
- Responsive design for mobile, tablet, and desktop
- Accessible navigation with keyboard support
- Loading states and error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open browser to http://localhost:3000
```

### Demo Credentials

**Student Account:**
- Email: `student@example.com`
- Password: `password`

**Mentor Account:**
- Email: `mentor@example.com`
- Password: `password`

## 📁 Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API service layer
│   ├── types/            # TypeScript interfaces
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main app component
│   └── index.css         # Global styles
├── public/               # Static files
└── index.html            # HTML template
```

## 🔧 Available Scripts

```bash
# Start development server
pnpm run dev

# Type checking
pnpm run check

# Format code
pnpm run format

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 🏗️ Architecture

### Authentication Flow
1. User logs in with email and password
2. JWT token is stored securely
3. Token is included in API requests
4. Automatic logout after 10 minutes of inactivity

### Data Fetching
- Custom `useQuery` hook for data fetching with caching
- Custom `useMutation` hook for data mutations
- Service layer pattern for easy API swapping
- Mock data service for development

### State Management
- React Context for global authentication state
- Custom hooks for local state management
- No external state management library needed

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#a855f7)
- **Accent**: Yellow (#eab308)
- **Background**: Slate-900 (#0f172a)
- **Text**: Slate-50 (#f8fafc)

### Typography
- **Display**: Bold sans-serif
- **Body**: Regular sans-serif
- **Monospace**: Code snippets

### Components
- Buttons with hover effects
- Cards with shadows and borders
- Input fields with validation
- Progress bars with animations
- Modals and dialogs

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Inactivity Logout**: Automatic session termination after 10 minutes
- **Input Validation**: Form validation on login
- **Error Handling**: Graceful error display without exposing sensitive info
- **No Hardcoded Secrets**: All sensitive data in .env file

## 📱 Responsive Design

- **Mobile**: Optimized for small screens with touch-friendly buttons
- **Tablet**: Adjusted layouts for medium screens
- **Desktop**: Full-featured experience with sidebar navigation
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🎬 Animations

- **Page Transitions**: Smooth fade and slide animations
- **List Items**: Staggered entrance animations
- **Buttons**: Scale and color transitions on hover
- **Progress Bars**: Animated fill effects
- **Loading States**: Spinning loaders

## 🧪 Testing

To test the application:

1. **Login Flow**: Use demo credentials to test authentication
2. **Navigation**: Test all navigation links and routes
3. **Data Fetching**: Verify data loads correctly
4. **Error Handling**: Test error scenarios
5. **Responsiveness**: Test on different screen sizes

## 🔄 Swapping Mock Data for Real API

To use real API endpoints:

1. Update `/client/src/services/api.ts`
2. Replace `MockApiService` with actual HTTP calls
3. Update environment variables in `.env`
4. No changes needed in components

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architecture documentation
- **[Component Documentation](./client/src/components/)**: Individual component docs
- **[Type Definitions](./client/src/types/index.ts)**: All TypeScript interfaces

## 🐛 Troubleshooting

### Inactivity logout not working
- Ensure mouse/keyboard events are being tracked
- Check localStorage is enabled
- Verify useInactivityLogout hook is called

### Data not loading
- Check network tab for API errors
- Verify mock data service is working
- Clear browser cache and localStorage

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check theme variables in index.css
- Verify global styles are imported

## 🚀 Deployment

### Build for Production
```bash
pnpm run build
```

### Environment Variables
Create a `.env` file with:
```
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=Sign Language LMS
```

### Hosting
The built application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 📝 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Framer Motion**
