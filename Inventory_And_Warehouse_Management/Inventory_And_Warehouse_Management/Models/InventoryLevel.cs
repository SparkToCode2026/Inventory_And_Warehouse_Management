using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class InventoryLevel
    {
        [Key]
        public int InventoryLevelId { get; set; }

        [ForeignKey(nameof(Warehouse))]
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }

        [ForeignKey(nameof(Product))]
        public int ProductId { get; set; }
        public Product Product { get; set; }

        public int QuantityOnHand { get; set; }
        public int ReorderThreshold { get; set; }
    }
}
