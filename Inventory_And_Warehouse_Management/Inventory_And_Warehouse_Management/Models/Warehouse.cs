using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Warehouse
    {
        [Key]
        public int WarehouseId { get; set; }
        public string Name { get; set; }
        public int Capacity { get; set; }
        public string Location { get; set; }
        public string Phone { get; set; }

        // --- Navigation Properties (relationship setup) ---
        public ICollection<User> Users { get; set; }
        public ICollection<StockMovement> StockMovements { get; set; }
        public ICollection<InventoryLevel> InventoryLevels { get; set; }

    }
}
