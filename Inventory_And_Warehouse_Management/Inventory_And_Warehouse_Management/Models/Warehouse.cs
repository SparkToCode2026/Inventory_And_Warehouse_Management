using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Warehouse
    {
        [Key]
        
        public int WarehouseId { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public int Capacity { get; set; }
        [Required]
        public string Location { get; set; }
        [Required]
        public string Phone { get; set; }

        // --- Navigation Properties (relationship setup) ---

        //Warehouse and User
        [JsonIgnore]
        [InverseProperty("_warehouse")]
        public List<User> users { get; set; }

        //Warehouse and StockMovement
        [JsonIgnore]
        [InverseProperty("_warehouse")]
        public List<StockMovement> stockMovements { get; set; }

        //Warehouse and inventoryLevels
        [InverseProperty("warehouse")]
        public List<InventoryLevel> inventoryLevels { get; set; }

    }
}
