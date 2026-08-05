using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(WarehouseId), nameof(ProductId))]
    public class InventoryLevel
    {
        public int InventoryLevelId { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderThreshold { get; set; }

        // Link back to Warehouse.
        [ForeignKey("Warehouse")]
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }


        // Link back to Product.
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product Product { get; set;}


    }
}
