using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    internal class PurchaseOrder
    {
        [Key]
        public int PurchaseOrderId { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
        public int SupplierId { get; set; }
        public int UserId { get; set; }
    }
}
