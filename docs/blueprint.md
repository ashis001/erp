# **App Name**: RoleStock

## Core Features:

- Role-Based Dashboards: Role-based dashboards with specific views and actions based on user roles (Superadmin, Admin).
- Inventory Management Grid: Inventory management grid for Superadmin to view, filter, and update inventory across categories.
- Assignment Modal: Assignment modal to assign inventory to admins, reducing global stock availability.
- Sales Recording Modal: Sales recording modal for Admins to input sales details, decreasing assigned stock and notifying Superadmin.
- Real-time Validations: Real-time validation of inventory assignments and sales to prevent over-assignment or overselling.
- Intelligent Price Suggestions: AI-powered 'tool' to suggest optimal selling prices based on inventory cost, market trends, and competitor pricing. The LLM will use reasoning to dynamically decide if enough information exists to provide a valuable recommendation.
- Audit Logging: Comprehensive audit logs tracking all actions (create, update, delete, assign, sell) for accountability and traceability.

## Style Guidelines:

- Primary color: A muted teal (#45A0A2) to evoke a sense of reliability and calm efficiency, suitable for enterprise applications.
- Background color: Light gray (#F0F4F5), nearly white but slightly desaturated teal hue, to provide a clean and unobtrusive backdrop.
- Accent color: A soft olive green (#80A159) to complement the teal and signal success and completion.
- Body and headline font: 'Inter', a sans-serif font, is suitable for both headlines and body text.
- Use clear, minimalist icons to represent actions and categories, enhancing usability.
- Implement a grid-based layout for responsive design and consistent information presentation.
- Use subtle animations to indicate changes in inventory levels and provide feedback on actions.