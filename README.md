# OpsPilot - Internal Operations Management Platform

A comprehensive workflow management system built to streamline internal operations, approvals, and resource requests. OpsPilot helps teams manage their operational workflows efficiently with role-based access control, multi-level approvals, and powerful analytics.

## What is OpsPilot?

OpsPilot is an enterprise-grade platform designed to handle the complexity of internal operations. Whether you're managing IT requests, HR approvals, or resource allocations, OpsPilot provides the tools you need to keep everything organized and moving forward.

### Key Features

- **Smart Request Management** - Create, track, and manage requests using customizable templates
- **Multi-Level Approvals** - Flexible approval workflows that adapt to your organization's hierarchy
- **Role-Based Access** - Three-tier access system (Employee, Manager, Admin) with appropriate permissions
- **Delegation System** - Managers can delegate approval responsibilities during absences
- **Real-Time Analytics** - Comprehensive dashboards showing bottlenecks, performance metrics, and trends
- **Activity Tracking** - Complete audit trail of all actions and changes
- **Template Versioning** - Track changes to request templates with full version history
- **Advanced Search** - Quickly find requests with powerful search and filtering

## Tech Stack

### Frontend
- **React 18** - Modern UI with hooks and functional components
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Data visualization
- **Lucide Icons** - Beautiful, consistent iconography
- **date-fns** - Date formatting and manipulation

### Backend
- **Node.js & Express** - RESTful API server
- **MongoDB** - Document database for flexible data storage
- **Mongoose** - ODM for MongoDB
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

## Project Structure

```
ops/
├── frontend/                 # React application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Helper functions
│   │   └── app.js           # Express app setup
│   └── package.json
│
└── README.md                # You are here
```

## How It Works

### For Employees
1. Log in to your account
2. Browse available request templates
3. Fill out a request form
4. Submit and track its progress
5. Get notified when your request is approved or needs changes

### For Managers
1. Review pending approvals in your queue
2. Approve, reject, or escalate requests
3. Delegate approval responsibilities when needed
4. Monitor team request metrics
5. Access detailed analytics

### For Admins
1. Manage users and their roles
2. Create and edit request templates
3. View all system requests
4. Access advanced analytics
5. Monitor system-wide performance

## API Documentation

The API follows RESTful conventions. Here are the main endpoints:

### Authentication
- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Sign in
- `GET /api/v1/auth/logout` - Sign out

### Requests
- `GET /api/v1/requests/me` - Get my requests
- `POST /api/v1/requests` - Create new request
- `GET /api/v1/requests/:id` - Get request details
- `GET /api/v1/requests/search` - Search requests

### Approvals
- `GET /api/v1/requests/approvals` - Get pending approvals
- `PATCH /api/v1/requests/:id/approve` - Approve request
- `PATCH /api/v1/requests/:id/reject` - Reject request
- `PATCH /api/v1/requests/:id/escalate` - Escalate request

### Templates (Admin only)
- `GET /api/v1/templates` - List all templates
- `POST /api/v1/templates` - Create template
- `PATCH /api/v1/templates/:id` - Update template
- `GET /api/v1/templates/:id/versions` - Get version history

### Analytics
- `GET /api/v1/analytics` - Get basic analytics
- `GET /api/v1/analytics/bottlenecks` - Identify bottlenecks
- `GET /api/v1/analytics/trends` - View trends

## Features in Detail

### Request Templates
Templates ensure consistency across requests. Admins can create templates with custom fields, validation rules, and approval workflows. Version control keeps track of all changes.

### Approval Workflows
Requests automatically route to the right approver based on:
- Request type
- Requester's role
- Organizational hierarchy
- Custom routing rules

### Delegation System
Managers can temporarily delegate their approval authority to other managers. Perfect for vacations or high-workload periods. Delegations can be:
- Time-bound (start and end dates)
- Scope-limited (specific templates only)
- Easily activated or deactivated

### Analytics Dashboard
Get insights into your operations:
- Request volume trends
- Average approval times
- Bottleneck identification
- SLA compliance tracking
- Approver performance metrics

## Contributing

This is an internal project, but if you'd like to suggest improvements:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request with a clear description

## Troubleshooting

**Can't connect to database?**
- Make sure MongoDB is running
- Check your DATABASE connection string in .env
- Verify MongoDB is listening on the correct port

**Frontend can't reach API?**
- Confirm backend is running on port 5001
- Check VITE_API_URL in frontend/.env
- Look for CORS errors in browser console

**Login not working?**
- Clear browser cookies and local storage
- Check JWT_SECRET is set in backend/.env
- Verify user exists in database

## License

Internal use only - All rights reserved

## Support

For questions or issues, please contact the development team or create an issue in the repository.

---

Built with ❤️ for streamlined operations
