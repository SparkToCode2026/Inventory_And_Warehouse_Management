using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory_And_Warehouse_Management.Migrations
{
    /// <inheritdoc />
    public partial class adddatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    CustomerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customers", x => x.CustomerId);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    SupplierId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliers", x => x.SupplierId);
                });

            migrationBuilder.CreateTable(
                name: "warehouses",
                columns: table => new
                {
                    WarehouseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_warehouses", x => x.WarehouseId);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK_products_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_users_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "WarehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InventoryLevels",
                columns: table => new
                {
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    InventoryLevelId = table.Column<int>(type: "int", nullable: false),
                    QuantityOnHand = table.Column<int>(type: "int", nullable: false),
                    ReorderThreshold = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLevels", x => new { x.WarehouseId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_InventoryLevels_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryLevels_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "WarehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "productSuppliers",
                columns: table => new
                {
                    productId = table.Column<int>(type: "int", nullable: false),
                    supplierId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_productSuppliers", x => new { x.productId, x.supplierId });
                    table.ForeignKey(
                        name: "FK_productSuppliers_products_productId",
                        column: x => x.productId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_productSuppliers_suppliers_supplierId",
                        column: x => x.supplierId,
                        principalTable: "suppliers",
                        principalColumn: "SupplierId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stockMovements",
                columns: table => new
                {
                    StockMovementId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    MovementDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MovementType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stockMovements", x => x.StockMovementId);
                    table.ForeignKey(
                        name: "FK_stockMovements_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_stockMovements_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "WarehouseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchaseOrders",
                columns: table => new
                {
                    PurchaseOrderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SupplierId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchaseOrders", x => x.PurchaseOrderId);
                    table.ForeignKey(
                        name: "FK_purchaseOrders_suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "suppliers",
                        principalColumn: "SupplierId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_purchaseOrders_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "salesOrders",
                columns: table => new
                {
                    SalesOrderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_salesOrders", x => x.SalesOrderId);
                    table.ForeignKey(
                        name: "FK_salesOrders_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_salesOrders_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "purchaseOrderItems",
                columns: table => new
                {
                    PurchaseOrderId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    PurchaseOrderItemId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchaseOrderItems", x => new { x.PurchaseOrderId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_purchaseOrderItems_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_purchaseOrderItems_purchaseOrders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "purchaseOrders",
                        principalColumn: "PurchaseOrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SalesOrderItems",
                columns: table => new
                {
                    SalesOrderId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SalesOrderItemId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesOrderItems", x => new { x.SalesOrderId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_SalesOrderItems_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SalesOrderItems_salesOrders_SalesOrderId",
                        column: x => x.SalesOrderId,
                        principalTable: "salesOrders",
                        principalColumn: "SalesOrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLevels_ProductId",
                table: "InventoryLevels",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_products_CategoryId",
                table: "products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_productSuppliers_supplierId",
                table: "productSuppliers",
                column: "supplierId");

            migrationBuilder.CreateIndex(
                name: "IX_purchaseOrderItems_ProductId",
                table: "purchaseOrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_purchaseOrders_SupplierId",
                table: "purchaseOrders",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_purchaseOrders_UserId",
                table: "purchaseOrders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesOrderItems_ProductId",
                table: "SalesOrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_salesOrders_CustomerId",
                table: "salesOrders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_salesOrders_UserId",
                table: "salesOrders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_stockMovements_ProductId",
                table: "stockMovements",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_stockMovements_WarehouseId",
                table: "stockMovements",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_users_WarehouseId",
                table: "users",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryLevels");

            migrationBuilder.DropTable(
                name: "productSuppliers");

            migrationBuilder.DropTable(
                name: "purchaseOrderItems");

            migrationBuilder.DropTable(
                name: "SalesOrderItems");

            migrationBuilder.DropTable(
                name: "stockMovements");

            migrationBuilder.DropTable(
                name: "purchaseOrders");

            migrationBuilder.DropTable(
                name: "salesOrders");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "warehouses");
        }
    }
}
