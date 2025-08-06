# Campomar Restaurant Management System

A comprehensive restaurant management system built with the Next.js framework. This application provides a complete solution for managing orders, tables, dishes, and employees, with separate interfaces for administrators and staff.

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Deployment](#deployment)


## 📖 About The Project

**Campomar** is a robust and intuitive web application designed to streamline restaurant operations. It offers a role-based system with distinct functionalities for administrators and employees, ensuring efficient management of daily tasks.

The system is a full-stack application leveraging the power of **Next.js** for both the frontend and backend, with a **PostgreSQL** database managed through the **Prisma ORM**. The user interface is built with **React** and styled with **Tailwind CSS**, utilizing **shadcn/ui** for a modern and responsive component library.


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

- **[PostgreSQL](https://www.postgresql.org/)**: A powerful, open-source object-relational database system.

### Deployment

- **[Vercel](https://vercel.com/)**: A cloud platform for static sites and serverless functions, perfect for deploying Next.js applications.


## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18.17.0 or later)
- **npm**, **yarn**, or **pnpm**
- A **PostgreSQL** database instance

### Installation

1.  **Clone the repository:**

    ```sh
    git clone [https://github.com/santi1475/Campomar.git](https://github.com/santi1475/Campomar.git)
    cd Campomar
    ```
2.  **Install dependencies:**

    ```sh
    npm install
    ```
3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your database connection string:

    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
4.  **Apply database migrations:**

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
- **Responsive Design**: The application is fully responsive and works on all devices.


## 📂 Project Structure

The project follows the standard Next.js `app` router directory structure.

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

## 🗄️ Database Schema

The database schema is defined using Prisma and includes the following models:

-   `empleados`: Stores employee information, including roles and credentials.
-   `mesas`: Represents the tables in the restaurant and their status.
-   `platos`: Contains the menu items with their descriptions, prices, and categories.
-   `pedidos`: Stores order information, including the employee who took the order and the total amount.
-   `detallepedidos`: A join table for the many-to-many relationship between `pedidos` and `platos`.
-   `pedido_mesas`: A join table to associate orders with one or more tables.
-   And other related tables like `categorias`, `tipoempleado`, and `tipopago`.

For a detailed view of the schema, please refer to the `prisma/schema.prisma` file.


## 🌐 Deployment

This project is optimized for deployment on the **Vercel** platform. Simply connect your GitHub repository to a new Vercel project, and it will be deployed automatically with every push to the `main` branch.
