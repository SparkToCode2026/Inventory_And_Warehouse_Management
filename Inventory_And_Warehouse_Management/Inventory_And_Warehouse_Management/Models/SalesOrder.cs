using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using System.Text.Json.Serialization;

namespace Inventory_And_Warehouse_Management.Models
{
    public class SalesOrder
    {
        [Key]
        [JsonIgnore]
        public int SalesOrderId { get; set; }

        [Required]
        public string Status { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

       

        // Relationship between SalesOrder and Customer
        [ForeignKey("customer")]
        public int CustomerId { get; set; }
        [JsonIgnore]
        public Customer? customer { get; set; }
      

        // Relationship between SalesOrder and User
        [ForeignKey("User")]
        public int UserId { get; set; }
        [JsonIgnore]
        public User? user { get; set; }

        // Relationship between SalesOrder and SalesOrderItem
        [InverseProperty("salesOrder")]
        [JsonIgnore]
        public List<SalesOrderItem>? salesOrderItems { get; set; }
    }

}
