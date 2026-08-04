using System;
using System.Collections.Generic;
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

        public int CustomerId { get; set; }

        public int UserId { get; set; }

        
        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        public List<SalesOrderItem> SalesOrderItems { get; set; }
    }
}
