using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory_And_Warehouse_Management.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_products_ProductId",
                table: "SalesOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_salesOrders_SalesOrderId",
                table: "SalesOrderItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SalesOrderItems",
                table: "SalesOrderItems");

            migrationBuilder.RenameTable(
                name: "SalesOrderItems",
                newName: "salesOrderItems");

            migrationBuilder.RenameIndex(
                name: "IX_SalesOrderItems_ProductId",
                table: "salesOrderItems",
                newName: "IX_salesOrderItems_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_salesOrderItems",
                table: "salesOrderItems",
                columns: new[] { "SalesOrderId", "ProductId" });

            migrationBuilder.AddForeignKey(
                name: "FK_salesOrderItems_products_ProductId",
                table: "salesOrderItems",
                column: "ProductId",
                principalTable: "products",
                principalColumn: "ProductId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_salesOrderItems_salesOrders_SalesOrderId",
                table: "salesOrderItems",
                column: "SalesOrderId",
                principalTable: "salesOrders",
                principalColumn: "SalesOrderId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_salesOrderItems_products_ProductId",
                table: "salesOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_salesOrderItems_salesOrders_SalesOrderId",
                table: "salesOrderItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_salesOrderItems",
                table: "salesOrderItems");

            migrationBuilder.RenameTable(
                name: "salesOrderItems",
                newName: "SalesOrderItems");

            migrationBuilder.RenameIndex(
                name: "IX_salesOrderItems_ProductId",
                table: "SalesOrderItems",
                newName: "IX_SalesOrderItems_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SalesOrderItems",
                table: "SalesOrderItems",
                columns: new[] { "SalesOrderId", "ProductId" });

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderItems_products_ProductId",
                table: "SalesOrderItems",
                column: "ProductId",
                principalTable: "products",
                principalColumn: "ProductId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderItems_salesOrders_SalesOrderId",
                table: "SalesOrderItems",
                column: "SalesOrderId",
                principalTable: "salesOrders",
                principalColumn: "SalesOrderId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
