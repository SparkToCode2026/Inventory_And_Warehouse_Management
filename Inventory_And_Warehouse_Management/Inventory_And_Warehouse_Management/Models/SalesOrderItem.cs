using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    [PrimaryKey(nameof(SalesOrderId), nameof(ProductId))]
    public class SalesOrderItem
    {
        public int SalesOrderItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        // Relationship between SalesOrderItem and SalesOrder
        [ForeignKey("SalesOrderId")]
        public int SalesOrderId { get; set; }
        public SalesOrder salesOrder { get; set; }


        // Relationship between SalesOrderItem and Product
        [ForeignKey("ProductId")]
        public int ProductId { get; set; }
        public Product product { get; set; }

    }
}
