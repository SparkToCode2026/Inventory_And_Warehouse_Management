using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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

        //Relationship between PurchaseOrder and Supplier
        [ForeignKey("supplier")]
        public int SupplierId { get; set; }
        public Supplier supplier { get; set; }

        //Relationship between PurchaseOrder and User
        [ForeignKey("user")]
        public int UserId { get; set; }
        public User user { get; set; }

        //Relationship between PurchaseOrder and PurchaseOrderItem
        [InverseProperty("purchaseOrder")]
        public List<PurchaseOrderItem> purchaseOrderItems { get; set; }

    }
}
