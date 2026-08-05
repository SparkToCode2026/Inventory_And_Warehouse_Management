using Inventory_And_Warehouse_Management.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Inventory_And_Warehouse_Management
{
    internal class ProjectContext : DbContext
    {
        //1- register models
        public DbSet<User> users { get; set; }
        public DbSet<Product> products { get; set; }
        public DbSet<Category> categories { get; set; }
        public DbSet<Customer> customers { get; set; }
        public DbSet<PurchaseOrder> purchaseOrders { get; set; }
        public DbSet<SalesOrder> salesOrders { get; set; }
        public DbSet<Warehouse> warehouses { get; set; }
        public DbSet<Supplier> suppliers { get; set; }
        public DbSet<StockMovement> stockMovements { get; set; }
        public DbSet<PurchaseOrderItem> purchaseOrderItems { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
        public DbSet<InventoryLevel> InventoryLevels { get; set; }
        public DbSet<ProductSupplier> productSuppliers { get; set; }

        //2- connect to database
        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            options.UseSqlServer(
            "Server=Abdullah\\SQLEXPRESS;Database=Inventory_And_Warehouse_Management_DB;Trusted_Connection=True;TrustServerCertificate=True;"
            );
        }
    }
}
