using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }


        //product has Category
        [ForeignKey("category")]
        public int CategoryId { get; set; }
        public Category category { get; set; }


        //product records stockMovement 
        [InverseProperty("product")]
        public List<StockMovement> stockMovements { get; set; }


        // Link back to InventoryLevel.
        [InverseProperty("product")]
        public List<InventoryLevel> inventoryLevels { get; set; }

        // Link back to PurchaseOrderItem.
        [InverseProperty("product")]
        public List<PurchaseOrderItem> purchaseOrderItems { get; set; }

        // Link back to SalesOrderItem.
        [InverseProperty("product")]
        public List<SalesOrderItem> SalesOrderItem { get; set; }
    }

}
