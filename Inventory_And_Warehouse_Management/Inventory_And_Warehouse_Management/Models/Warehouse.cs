using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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

        //Warehouse and User
        [InverseProperty("_warehouse")]
        public ICollection<User> users { get; set; }

        //Warehouse and StockMovement
        [InverseProperty("_warehouse")]
        public ICollection<StockMovement> stockMovements { get; set; }

        //Warehouse and StockMovement
        [InverseProperty("warehouse")]
        public ICollection<InventoryLevel> inventoryLevels { get; set; }

    }
}
