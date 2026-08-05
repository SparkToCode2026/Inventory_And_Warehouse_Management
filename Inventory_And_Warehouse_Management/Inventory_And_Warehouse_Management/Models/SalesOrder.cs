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

       

        

        // Relationship between SalesOrder and Customer
        [ForeignKey("customer")]
        public Customer customer { get; set; }
        public int CustomerId { get; set; }

        // Relationship between SalesOrder and User
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User User { get; set; }

        // Relationship between SalesOrder and SalesOrderItem
        [InverseProperty("category")]
        public List<SalesOrderItem> salesOrderItems { get; set; }
    }

}
