using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory_And_Warehouse_Management.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRequiredFromWarehouseId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_warehouses_WarehouseId",
                table: "users");

            migrationBuilder.AlterColumn<int>(
                name: "WarehouseId",
                table: "users",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_users_warehouses_WarehouseId",
                table: "users",
                column: "WarehouseId",
                principalTable: "warehouses",
                principalColumn: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_warehouses_WarehouseId",
                table: "users");

            migrationBuilder.AlterColumn<int>(
                name: "WarehouseId",
                table: "users",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_users_warehouses_WarehouseId",
                table: "users",
                column: "WarehouseId",
                principalTable: "warehouses",
                principalColumn: "WarehouseId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
