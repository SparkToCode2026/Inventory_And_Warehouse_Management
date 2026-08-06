using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Customer
    {
        [Key]
        [JsonIgnore]
        public int CustomerId { get; set; }
        [Required]
        public string? Name { get; set; }

        [Required]
        public string? Phone { get; set; }
        [Required]
        public string? Email { get; set; }
        [Required]
        public string? Location { get; set; }

        // One Customer can have many SalesOrders.
        [InverseProperty("customer")]
        [JsonIgnore]
        public List<SalesOrder>? salesOrders { get; set; }

    }
}
