# CineLog

## 🎓 Academic Project

CineLog is a web application for movie enthusiasts to catalog, rate, and share their opinions about films. Developed as an academic project for the **Web Development 2** course taught by **Professor Renan Cavichi** (@renancavichi) in the **Analysis and Systems Development program at IFSP**.

Inspired by the [Letterboxd](https://letterboxd.com/) platform, CineLog allows users to create a personal collection of watched movies, assign ratings, write comments, and view other users' reviews, but with its own identity and features adapted to the academic context.

## 🗂️ Project Structure
This repository uses a monorepo structure containing:

- `/backend` - REST API built with Node.js, Express, and Prisma
- `/frontend` - User interface built with HTML, CSS, and Vanilla JavaScript

## 🚀 How to Run the Project

### Backend
```bash
# Enter the backend folder
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit the .env file with your settings

# Run database migrations
npx prisma migrate dev

# Start the server
npm start
```

### Frontend
```bash
# Enter the frontend folder
cd frontend

# Open the index.html file in your browser
# or use an extension like Live Server in VS Code
```

## ✨ Main Features
### For Users
- **Account and Profile**: Registration, login, and personalization with avatar
- **Movie Management**: Add, edit, and view movie details
- **Rating System**: Assign ratings from 1 to 5 stars and write comments
- **Social Interaction**: View reviews from other users

### For Administrators
- **Control Panel**: Overview of platform activities
- **User Management**: Promote, demote, or ban users
- **Content Moderation**: Review and remove inappropriate reviews
- **Movie Catalog**: Manage the available movie database
- **Statistics**: Track platform usage metrics

## 🛠️ Technologies Used
### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- FontAwesome for icons
- Vanilla JavaScript for interactivity and DOM manipulation

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL (database)
- Bcrypt (password hashing)
- JSON Web Token (authentication)

### External Services
- Cloudinary (image storage)

## 🔍 Technical Features
- **Responsive Design**: Interface adapted for mobile and desktop devices
- **Dark Theme**: Elegant design that's easy on the eyes
- **Security**: Password protection and data validation
- **Performance**: Optimized image loading via Cloudinary
- **Visual Feedback**: Notifications and loading indicators
- **Compatibility**: Support for major browsers
- **Accessibility**: Basic accessibility elements implemented

## 👨‍💻 Author
Vitor de Oliveira
