using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class PurchaseOrderItem
    {
        [Key]
        public int PurchaseOrderItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        //Relationship for PurchaseOrderItem and purchaseOrder
        [ForeignKey("purchaseOrder")]
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder purchaseOrder { get; set; }


        //Relationship for PurchaseOrderItem and Product
        [ForeignKey("product")]
        public int ProductId { get; set; }
        public Product product { get; set; }
    }
}
