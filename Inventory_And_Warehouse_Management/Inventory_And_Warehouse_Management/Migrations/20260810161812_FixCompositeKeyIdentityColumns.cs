using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory_And_Warehouse_Management.Migrations
{
    /// <inheritdoc />
    public partial class FixCompositeKeyIdentityColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SalesOrderItemId",
                table: "salesOrderItems");

            migrationBuilder.AddColumn<int>(
                name: "SalesOrderItemId",
                table: "salesOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderItemId",
                table: "purchaseOrderItems");

            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderItemId",
                table: "purchaseOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.DropColumn(
                name: "InventoryLevelId",
                table: "InventoryLevels");

            migrationBuilder.AddColumn<int>(
                name: "InventoryLevelId",
                table: "InventoryLevels",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SalesOrderItemId",
                table: "salesOrderItems");

            migrationBuilder.AddColumn<int>(
                name: "SalesOrderItemId",
                table: "salesOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.DropColumn(
                name: "PurchaseOrderItemId",
                table: "purchaseOrderItems");

            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderItemId",
                table: "purchaseOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.DropColumn(
                name: "InventoryLevelId",
                table: "InventoryLevels");

            migrationBuilder.AddColumn<int>(
                name: "InventoryLevelId",
                table: "InventoryLevels",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}