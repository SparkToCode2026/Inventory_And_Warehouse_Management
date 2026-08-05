using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Supplier
    {
        [Key]
        public int SupplierId { get; set; }
        public string Name { get; set; }
        
        public string Phone { get; set; }
        public string Email { get; set; }


        // One Supplier can have many PurchaseOrders.
        public List<PurchaseOrder> PurchaseOrders { get; set; }

        // Link back to ProductSupplier
        [InverseProperty("supplier")]
        public List<ProductSupplier> productSuppliers { get; set; }

    }
}
