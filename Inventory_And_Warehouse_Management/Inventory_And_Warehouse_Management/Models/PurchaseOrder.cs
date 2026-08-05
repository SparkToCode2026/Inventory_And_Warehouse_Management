using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class PurchaseOrder
    {
        [Key]
        public int PurchaseOrderId { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
        public int SupplierId { get; set; }
        public int UserId { get; set; }

        //Relationship for PurchaseOrder
        public Supplier Supplier { get; set; }
        public User User { get; set; }
        public ICollection<PurchaseOrderItem> Items { get; set; }

    }
}
