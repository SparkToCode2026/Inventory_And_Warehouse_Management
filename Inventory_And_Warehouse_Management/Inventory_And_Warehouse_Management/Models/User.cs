using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class User
    {
        [Key]
        [JsonIgnore]
        public int UserId { get; set; }
        [Required]
        public string? Name { get; set; }
        [Required]

        public string? Email { get; set; }
        [Required]
        [JsonIgnore]
        public string? PasswordHash { get; set; }
        [Required]

        public string? Role { get; set; }
        [Required]

        public string? Phone { get; set; }

        //Work
        [ForeignKey("_warehouse")]
        [Required]
        public int? WarehouseId { get; set; }
        [JsonIgnore]
        public Warehouse? _warehouse { get; set; }

    }
}
