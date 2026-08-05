using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Inventory_And_Warehouse_Management.Models
{
    public class Customer
    {
        [Key]
        public int CustomerId { get; set; }
        public string Name { get; set; }

        public string Phone { get; set; }
        public string Email { get; set; }
        public string Location { get; set; }

        // One Customer can have many SalesOrders.
        [InverseProperty("customer")]
        public List<SalesOrder> salesOrders { get; set; }

    }
}
