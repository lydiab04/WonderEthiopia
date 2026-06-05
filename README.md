# WonderEthiopia

WonderEthiopia is a web-based tourism discovery and management platform designed to connect tourists, local businesses, tourism managers, and system administrators. The platform enables users to discover destinations, explore tourism services, make reservations, receive personalized recommendations, submit reviews, and interact with tourism-related businesses across Ethiopia.

## Features

### User Management and Authentication

* User registration and login
* Role-Based Access Control (RBAC)
* Secure session management
* Protected routes and permissions

### Tourist Profile and Preferences

* Manage personal profiles
* Store travel preferences
* Support personalized recommendations

### Discovery and Reviews

* Browse Ethiopian destinations
* Search and filter destinations
* View destination details
* Explore tourism businesses
* Submit reviews and ratings
* View average ratings and feedback

### Business Listing and Services

* Create and manage business profiles
* Add, update, and delete services
* Upload service information, prices, and descriptions
* Manage service availability

### Booking and Reservations

* Reserve hotels, tours, events, and transportation services
* Booking confirmation and management
* Payment integration using Chapa Sandbox

### AI Recommendation and Landmark Recognition

* Personalized destination recommendations
* Landmark image recognition
* AI-powered tourism assistance

### Reporting and Administration

* Submit reports regarding businesses and services
* Business approval and moderation workflows
* Administrative dashboards and monitoring tools

---

## Technology Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* NextAuth.js

### External Services

* Chapa Payment Gateway
* AI Recommendation Service
* AI Landmark Recognition Service

---

## Project Structure

```text
wonder-eth/
│
├── app/
│   ├── api/
│   ├── destinations/
│   ├── businesses/
│   ├── bookings/
│   └── reviews/
│
├── components/
│
├── lib/
│   └── db.ts
│
├── models/
│   ├── User.ts
│   ├── Destination.ts
│   ├── Business.ts
│   ├── Service.ts
│   ├── Booking.ts
│   ├── Review.ts
│   └── Report.ts
│
├── public/
│
├── styles/
│
└── package.json
```

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd wonder-eth
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the root directory and configure the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Additional service keys
CHAPA_SECRET_KEY=your_key
AI_SERVICE_API_KEY=your_key
```

### Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

in your browser.

---

## Database Models

### Destination

```text
name
description
region
city
images
rating
created_at
```

### Business

```text
business_name
type
description
region
city
rating
created_at
```

### Review

```text
user_id
target_id
target_type
rating
comment
created_at
```

The review system uses a polymorphic relationship that allows reviews to be attached to either destinations or businesses.

---

## Testing

The project includes:

* Functional Testing
* Unit Testing
* Integration Testing
* System Testing
* Security Testing
* Performance Testing
* Usability Testing

Testing results and documentation are available in the project report.

---

## Future Improvements

* Mobile application support
* Multi-language support
* Advanced AI recommendation models
* Real-time notifications
* Interactive maps and navigation
* Tourism analytics dashboard

---

## Authors

Addis Ababa University

Department of Computer Science

WonderEthiopia Development Team

---

## License

This project was developed for academic purposes as a Final Year Project at Addis Ababa University.
