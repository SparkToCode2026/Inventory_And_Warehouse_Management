using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Supplier
    {
        [Key]
        [JsonIgnore]
        public int SupplierId { get; set; }
        [Required]
        public string Name { get; set; }

        [Required]
        public string Phone { get; set; }
        [Required]
        public string Email { get; set; }


        // One Supplier can have many PurchaseOrders.
        [JsonIgnore]
        public List<PurchaseOrder>? PurchaseOrders { get; set; }

        // Link back to ProductSupplier
        [InverseProperty("supplier")]
        [JsonIgnore]
        public List<ProductSupplier>? productSuppliers { get; set; }

    }
}
