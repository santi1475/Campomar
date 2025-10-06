# Campomar Restaurant Management System

A comprehensive restaurant management system built with the Next.js framework. This application provides a complete solution for managing orders, tables, dishes, and employees, with separate interfaces for administrators and staff.

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Built With](#-built-with)
- [Getting Started](#-getting-started)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [License](#-license)

## 📖 About The Project

**Campomar** is a robust and intuitive web application designed to streamline restaurant operations. It offers a role-based system with distinct functionalities for administrators and employees, ensuring efficient management of daily tasks.

The system is a full-stack application leveraging the power of **Next.js** for both the frontend and backend, with a **PostgreSQL** database hosted on **Supabase** and managed through the **Prisma ORM**. The user interface is built with **React** and styled with **Tailwind CSS**, utilizing **shadcn/ui** for a modern and responsive component library.

## 🛠️ Built With

This project is built with a modern technology stack, ensuring a high-quality and maintainable application.

### Frontend

- **[Next.js](https://nextjs.org/)**: A React framework for building full-stack web applications.
- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[shadcn/ui](https://ui.shadcn.com/)**: A collection of beautifully designed, accessible, and customizable UI components.
- **[Framer Motion](https://www.framer.com/motion/)**: A library for creating production-ready animations.
- **[Zustand](https://zustand-demo.pmnd.rs/)**: A small, fast, and scalable state management solution.

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)**: For creating serverless API endpoints.
- **[Prisma](https://www.prisma.io/)**: A next-generation ORM for Node.js and TypeScript.

### Database

- **[Supabase](https://supabase.com/)**: An open-source Firebase alternative for building secure and scalable backends. It provides a full PostgreSQL database and more.

### Deployment

- **[Vercel](https://vercel.com/)**: A cloud platform for static sites and serverless functions, perfect for deploying Next.js applications.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18.17.0 or later)
- **npm**, **yarn**, or **pnpm**
- A **Supabase** project. You can create one for free at [supabase.com](https://supabase.com/).

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/santi1475/Campomar.git
    cd Campomar
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project. You will need to get your database connection strings from your Supabase project settings (`Settings > Database`).

    ```env
    # Connection string for Prisma Client (used by the application)
    DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[AWS-ENDPOINT].supabase.co:5432/postgres"

    # Direct connection string for Prisma Migrate (used for database migrations)
    DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[AWS-ENDPOINT].supabase.co:6543/postgres"
    ```

    **Note:** Supabase uses two different ports for connecting to the database. Port `5432` is for the pooled connection (used by `DATABASE_URL`), and port `6543` is for the direct connection (used by `DIRECT_URL`).

4.  **Apply database migrations:**

    This command will sync your Prisma schema with your Supabase database.

    ```sh
    npx prisma migrate dev
    ```

5.  **Run the development server:**

    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ✨ Features

- **Role-Based Access Control**: Separate interfaces and functionalities for administrators and employees.
- **Admin Dashboard**: A comprehensive dashboard for managing tables, dishes, and employees.
- **Employee Panel**: A dedicated interface for employees to manage tables, view the menu, and handle orders.
- **Table Management**: A visual grid of tables, showing their status (free/occupied) and allowing for the creation of new orders.
- **Order Management**: Create, modify, and finalize orders with a user-friendly interface.
- **Real-Time Updates**: The application reflects changes in real-time, ensuring all staff members are up-to-date.
- **Kitchen Ticket Printing**: Generate and print kitchen tickets for new orders and added items.
- **Auditing**: Critical actions, such as order cancellations, are logged for security and tracking purposes.
- **Responsive Design**: The application is fully responsive and works on all devices.

## 📂 Project Structure

The project follows the standard Next.js `app` router directory structure.

```
/
├── prisma/           # Prisma schema and migrations
├── public/           # Static assets
└── src/
    ├── app/              # Application routes
    │   ├── (auth)/       # Authentication layout and pages
    │   ├── admin/        # Admin dashboard pages
    │   ├── api/          # API routes
    │   └── empleado/     # Employee panel pages
    ├── components/       # Reusable UI components
    ├── features/         # Feature-specific components and logic
    ├── lib/              # Utility functions and database client
    └── store/            # Zustand store for state management
```

## 🗄️ Database Schema

The database schema is defined using Prisma and includes the following models:

-   `empleados`: Stores employee information, including roles and credentials.
-   `mesas`: Represents the tables in the restaurant and their status.
-   `platos`: Contains the menu items with their descriptions, prices, and categories.
-   `pedidos`: Stores order information, including the employee who took the order and the total amount.
-   `detallepedidos`: A join table for the many-to-many relationship between `pedidos` and `platos`.
-   `pedido_mesas`: A join table to associate orders with one or more tables.
-   `auditoria`: Logs important system events, such as order cancellations, for accountability and tracking. It records who performed the action, when, and a snapshot of the relevant data.
-   And other related tables like `categorias`, `tipoempleado`, and `tipopago`.

For a detailed view of the schema, please refer to the `prisma/schema.prisma` file.

## 🌐 Deployment

This project is optimized for deployment on the **Vercel** platform. Simply connect your GitHub repository to a new Vercel project, and it will be deployed automatically with every push to the `main` branch.

## 📜 License

This project is not licensed for open-source use. Please refer to [Copyright Law](https://github.com/santi1475/Campomar/blob/8a532fdf84a216bbe95df60548c16da7deba6de1/LICENSE) for more information.

## 📨 Contact

<div align="center">

<a href="https://www.linkedin.com/in/santiago-g-v/">
  <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>
<a href="mailto:santiguz1475@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail"/>
</a>

</div>
