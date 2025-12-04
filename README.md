# 🛒 TownKart

**A comprehensive e-commerce platform for local businesses with multi-role support (Customer, Merchant, Delivery Partner)**

[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7.1-green)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC)](https://tailwindcss.com/)

## 📋 Description

TownKart is a modern, full-stack e-commerce platform designed to empower local businesses. It provides a unified platform where customers can discover and order from nearby merchants, merchants can manage their businesses digitally, and delivery partners can earn through flexible work opportunities.

## ✨ Key Features

- **Multi-Role Platform**: Support for Customers, Merchants, and Delivery Partners
- **OTP-Based Authentication**: Secure passwordless login with SMS verification
- **Real-Time Order Tracking**: GPS-based delivery tracking with live updates
- **Unified Dashboard**: Role-specific interfaces for different user types
- **Payment Integration**: Multiple payment methods including COD, UPI, and cards
- **Inventory Management**: Real-time stock tracking and automated notifications
- **Commission Management**: Transparent fee structure for merchants
- **Rating & Review System**: Quality assurance through user feedback

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Redux Toolkit + Zustand
- **Maps**: React Leaflet

### Backend

- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-Time**: Socket.io
- **Caching**: Redis

### External Services

- **Payments**: Razorpay
- **SMS**: MSG91
- **Email**: SendGrid/Resend
- **Maps**: Google Maps Platform
- **File Storage**: Cloudinary/AWS S3
- **Notifications**: Firebase Cloud Messaging

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 15
- **Redis** (optional, for caching)
- **Git**

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/townkart.git
   cd townkart
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the required environment variables in `.env.local`

4. **Set up the database**

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🔧 Environment Setup

Copy `.env.example` to `.env.local` and configure the following variables:

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth.js
- `NEXTAUTH_URL`: Base URL for authentication
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Payment gateway credentials
- `SMS_API_KEY`: For OTP SMS service
- `GOOGLE_MAPS_API_KEY`: For location services

### Optional

- `REDIS_URL`: For caching and session management
- `CLOUDINARY_*`: For image uploads
- `FIREBASE_*`: For push notifications
- `AWS_*`: For file storage

## 🗄️ Database Setup

The application uses PostgreSQL with Prisma ORM. The schema includes tables for users, merchants, products, orders, deliveries, and more.

```bash
# View database in browser
npm run db:studio

# Create and run migrations
npm run db:migrate

# Reset database
npm run db:push -- --force-reset
```

## 🏃 Running the Application

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📁 Project Structure

```
townkart/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── (auth)/       # Authentication pages
│   │   ├── admin/        # Admin dashboard
│   │   ├── customer/     # Customer pages
│   │   ├── merchant/     # Merchant pages
│   │   └── rider/        # Delivery partner pages
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript type definitions
├── .env.example          # Environment variables template
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - Phone number login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/refresh-token` - Token refresh

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/addresses` - Get user addresses

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Merchants

- `GET /api/merchants` - List merchants
- `GET /api/merchants/:id` - Get merchant details
- `POST /api/merchants/products` - Add product

### Deliveries

- `GET /api/deliveries/available` - Get available deliveries
- `POST /api/deliveries/accept` - Accept delivery task

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

For detailed product documentation, application flow, and business logic, see the [Product Documentation](./PRODUCT_DOCS.md) (if available).

---
