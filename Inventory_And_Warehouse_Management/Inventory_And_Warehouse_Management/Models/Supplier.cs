using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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


        public List<PurchaseOrder> purchaseOrders { get; set; }

    }
}
