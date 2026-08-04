using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class SalesOrderItem
    {
        [Key]
        public int SalesOrderItemId { get; set; }

        [ForeignKey("SalesOrderId")]
        public int SalesOrderId { get; set; }

        [ForeignKey("ProductId")]
        public int ProductId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice { get; set; }
    }
}
