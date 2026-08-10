using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(WarehouseId), nameof(ProductId))]
    public class InventoryLevel
    {
        [JsonIgnore]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InventoryLevelId { get; set; }
        [Required]
        public int QuantityOnHand { get; set; }
        [Required]
        public int ReorderThreshold { get; set; }

        // Link back to Warehouse.
        [ForeignKey("warehouse")]
        public int WarehouseId { get; set; }
        public Warehouse warehouse { get; set; }


        // Link back to Product.
        [ForeignKey("product")]
        public int ProductId { get; set; }
        public Product product { get; set;}


    }
}
