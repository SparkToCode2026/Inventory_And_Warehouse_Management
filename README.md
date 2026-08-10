
# Inventory and Warehouse Management System

## 📌 Project Overview

The **Inventory and Warehouse Management System** is a full-stack application developed as part of the **SparkToCode Program**.

The system is designed to help businesses manage warehouse and inventory operations through one centralized platform. It supports the management of products, suppliers, customers, inventory levels, purchase orders, sales orders, and stock movements.

The main goal of the project is to reduce manual work, improve inventory accuracy, organize warehouse data, and make daily warehouse operations easier to manage.

---

## 💡 Business Idea

Businesses that manage physical inventory need a reliable way to track products entering and leaving the warehouse.

Manual management can lead to problems such as:

- Incorrect stock quantities
- Duplicate customer or supplier records
- Difficulty tracking purchase and sales activity
- Poor visibility of stock movement
- Data entry errors
- Difficulty organizing supplier and customer information

This system provides a centralized digital solution that allows authorized users to manage warehouse operations while keeping the data organized and consistent.

---

## ✨ Main Features

- User registration and login
- JWT authentication and authorization
- Product management
- Category management
- Supplier management
- Customer management
- Inventory level management
- Purchase order management
- Sales order management
- Stock movement tracking
- Product-supplier relationship management
- Add, view, update, and delete operations
- Filtering and sorting
- Input validation
- Duplicate email and phone number validation
- Protected API endpoints
- Database persistence

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| C# | Main programming language |
| ASP.NET Core Web API | Backend API |
| Entity Framework Core | Database communication |
| Microsoft SQL Server | Database |
| JWT | Authentication and authorization |
| Swagger / OpenAPI | API documentation and testing |
| Git | Version control |
| GitHub | Team collaboration |
| Visual Studio | Development environment |
| Frontend | To be added once the frontend technology is finalized |

---

## ⚙️ How to Run the Project

### Prerequisites

Before running the project, make sure you have:

- Visual Studio
- .NET SDK
- Microsoft SQL Server
- SQL Server Management Studio (recommended)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Open the Project

Open the solution in **Visual Studio**.

Make sure you are working inside the project that contains:

```text
Inventory_And_Warehouse_Management.csproj
```

### 3. Configure the Database

The project uses Microsoft SQL Server.

Database name:

```text
Inventory_And_Warehouse_Management_DB
```

The shared project connection uses:

```text
Server=localhost\SQLEXPRESS;Database=Inventory_And_Warehouse_Management_DB;Trusted_Connection=True;TrustServerCertificate=True;
```

If a team member uses a different local SQL Server instance, they should change the connection string only for local testing and avoid committing personal machine-specific configuration.

### 4. Restore Dependencies

Open the terminal inside the folder containing the `.csproj` file and run:

```bash
dotnet restore
```

### 5. Update the Database

Use the existing Entity Framework Core migrations:

```bash
dotnet ef database update
```

> Do not create new migrations unless the database model has intentionally changed and the change has been agreed with the team.

### 6. Run the Application

Run the project from Visual Studio, or use:

```bash
dotnet run
```

Swagger should open and display the available API endpoints.

---

## 🗄️ Final ERD



---

## 👥 Team Members and Responsibilities

| Team Member | Responsibility |
|-------------|----------------|
|               |                  |
|               |                  |
|               |                  |
|               |                  |



---

## 📮 Postman Collection



---

## 🚀 Project Status

### Completed

- Backend API development
- Database integration
- JWT authentication and authorization
- Swagger API testing
- CRUD testing
- Supplier controller testing
- Customer controller testing
- Validation testing
- Duplicate email and phone number validation
- Database persistence testing
- Filtering and sorting testing



---

## 🔒 Security Notes

- Do not commit passwords or credentials.
- Do not expose JWT secret keys.
- Do not expose SMTP credentials.
- Do not commit personal database configuration.
- Review Git changes before committing.