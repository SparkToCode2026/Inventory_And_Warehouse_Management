using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Product
    {
        [Key]
        [JsonIgnore]
        public int ProductId { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public decimal Price { get; set; }
        public string Description { get; set; }


        //product has Category
        [Required]
        [ForeignKey("category")]
        public int CategoryId { get; set; }
        [JsonIgnore]
        public Category category { get; set; }


        //product records stockMovement 
        [InverseProperty("product")]
        [JsonIgnore]
        public List<StockMovement> stockMovements { get; set; }


        // Link back to InventoryLevel.
        [InverseProperty("product")]
        [JsonIgnore]
        public List<InventoryLevel> inventoryLevels { get; set; }

        // Link back to PurchaseOrderItem.
        [InverseProperty("product")]
        [JsonIgnore]
        public List<PurchaseOrderItem> purchaseOrderItems { get; set; }

        // Link back to SalesOrderItem.
        [InverseProperty("product")]
        [JsonIgnore]
        public List<SalesOrderItem> SalesOrderItem { get; set; }

        // Link back to ProductSupplier
        [InverseProperty("product")]
        [JsonIgnore]
        public List<ProductSupplier> productSuppliers { get; set; }
    }

}
