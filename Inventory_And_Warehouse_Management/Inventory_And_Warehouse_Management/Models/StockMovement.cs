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
        public string MovementType { get; set; }

        //Records
        [ForeignKey("ProductId")]
        [Required]
        public int ProductId { get; set; }

        //occurs at
        [ForeignKey("WarehouseId")]
        [Required]
        public int WarehouseId { get; set; }
    }
}
