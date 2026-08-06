using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class StockMovement
    {
        [Key]
        [JsonIgnore]
        public int StockMovementId { get; set; }
        [Required]
        public int Quantity { get; set; }
        [Required]
        public DateTime MovementDate { get; set; }
        [Required]
        public string? MovementType { get; set; }

        //Records
        [ForeignKey("product")]
        [Required]
        public int ProductId { get; set; }
        [JsonIgnore]
        public Product? product { get; set; }

        //occurs at
        [ForeignKey("_warehouse")]
        [Required]
        public int WarehouseId { get; set; }
        [JsonIgnore]
        public Warehouse? _warehouse { get; set; }
    }
}
