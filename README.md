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
- JWT authentication and authorization with role-based access (Staff, Manager, Admin)
- Product management
- Category management
- Supplier management
- Customer management
- Warehouse management
- Inventory level management with automated low-stock email alerts
- Purchase order management with automated supplier confirmation emails
- Sales order management
- Stock movement tracking
- Product-supplier relationship management
- Add, view, update, and delete operations for every model
- Filtering and sorting/aggregate reporting per model
- Input validation
- Duplicate email and phone number validation
- Protected API endpoints
- Database persistence
- Full frontend interface for every module, with role-based UI

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
| Frontend | HTML, CSS, JavaScript, Bootstrap |

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

The final Entity Relationship Diagram covers all 13 models (Category, Product, Supplier, Customer, User, Warehouse, InventoryLevel, StockMovement, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, and ProductSupplier) and their relationships.

The diagram is available at `ERD & Mapping/ERD.png`, with the editable source file at `ERD & Mapping/ERD.drawio`, and the full field-level mapping at `ERD & Mapping/mapping.drawio`.

---

## 👥 Team Members and Responsibilities

| Team Member | Responsibility |
|-------------|----------------|
| Abdullah Al Shamsi (Team Lead) | Category & Product (backend + frontend); code review, merges, and architecture decisions across the whole project |
| Issa Al Sibani (Co-Lead) | Supplier & Customer (backend + frontend); README documentation |
| Sara Al Hinai | User, Stock Movement & Product-Supplier (backend + frontend); JWT Authentication and Email Service |
| Reham Al Barwani | Warehouse & Inventory Level (backend + frontend) |
| Aseel Al Wardi | Purchase Order & Purchase Order Item (backend + frontend) |
| Zuwaina Al Rashdi | Sales Order & Sales Order Item (backend + frontend); ERD and database mapping |



---

## 📮 Postman Collection

A Postman collection covering all Controllers (all CRUD, filter, and sort/aggregate cases, plus Authentication) is available at:

```text
postman/Inventory_Warehouse_API.postman_collection.json
```

Import it into Postman and set the `token` variable after logging in via `POST /api/Auth/login` to test protected endpoints.

---

## 🚀 Project Status

### Completed

**Backend**
- All 13 models with correct relationships, keys, and migrations
- All 13 Controllers (Category, Product, Supplier, Customer, User, Warehouse, InventoryLevel, StockMovement, PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, ProductSupplier), each covering Create, two distinct Update cases, Delete, Get-all with Include, Get-by-id, Filter, and Sort/Aggregate
- JWT Authentication (Register, Login, Change Password) with role-based authorization (`Staff`, `Manager`, `Admin`) enforced on every endpoint
- Email Service: low-stock alerts to managers and purchase order confirmations to suppliers
- Swagger documentation with a working Bearer-token Authorize flow
- Input validation, duplicate email/phone checks, and consistent error handling across all Controllers
- Database persistence verified end to end

**Frontend**
- Login, Register, and Change Password pages
- One page per model (13 total), each with list view, create, full update, a second distinct update case, delete, filter, and sort/aggregate, wired to the live API
- Role-based UI: actions are shown or hidden based on the signed-in user's role, matching backend permissions exactly
- Sign-in gating on every page that requires authentication

**Testing**
- Full manual testing via Swagger and the live UI across all Controllers and pages
- Postman collection covering all endpoints

---

## 🔒 Security Notes

- Do not commit passwords or credentials.
- Do not expose JWT secret keys.
- Do not expose SMTP credentials.
- Do not commit personal database configuration.
- Review Git changes before committing.
