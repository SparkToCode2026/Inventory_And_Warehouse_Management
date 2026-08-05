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
        public int CustomerId { get; set; }
        public Customer customer { get; set; }
      

        // Relationship between SalesOrder and User
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User user { get; set; }

        // Relationship between SalesOrder and SalesOrderItem
        [InverseProperty("salesOrder")]
        public List<SalesOrderItem> salesOrderItems { get; set; }
    }

}
