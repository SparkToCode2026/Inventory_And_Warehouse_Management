using System;
using System.Collections.Generic;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class SalesOrderItem
    {
        [Key]
        public int SalesOrderItemId { get; set; }

        public int SalesOrderId { get; set; }

        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice { get; set; }

        
        [ForeignKey("SalesOrderId")]
        public SalesOrder SalesOrder { get; set; }

        [ForeignKey("ProductId")]
        public Product Product { get; set; }
    }
}
