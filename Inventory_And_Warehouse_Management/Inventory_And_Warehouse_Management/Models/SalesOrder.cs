using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class SalesOrder
    {
        [Key]
        public int SalesOrderId { get; set; }

        public string Status { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime OrderDate { get; set; }

        [ForeignKey("CustomerId")]
        public int CustomerId { get; set; }

        [ForeignKey("UserId")]
        public int UserId { get; set; }

        // Relationship between SalesOrder and Customer, User, and SalesOrderItem
        public Customer Customer { get; set; }

        public User User { get; set; }

        public List<SalesOrderItem> Items { get; set; }
    }

}
